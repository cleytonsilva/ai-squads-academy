'use client';

import React, { useState, useEffect } from 'react';
import { Quiz, QuizQuestion, QuizAttempt } from '@/types/course';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Trophy,
  Zap,
  Target,
  Award,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Flag,
  Brain,
  Lightbulb,
  Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

interface QuizPlayerProps {
  quiz: Quiz;
  userId: string;
  courseId: string;
  moduleId: string;
  onComplete?: (attempt: QuizAttempt) => void;
  onClose?: () => void;
}

interface QuizState {
  currentQuestionIndex: number;
  answers: Record<string, any>;
  timeRemaining: number;
  isSubmitted: boolean;
  attempt: QuizAttempt | null;
  loading: boolean;
  showResults: boolean;
}

interface QuestionResult {
  questionId: string;
  isCorrect: boolean;
  userAnswer: any;
  correctAnswer: any;
  explanation?: string;
  points: number;
}

export default function QuizPlayer({ quiz, userId, courseId, moduleId, onComplete, onClose }: QuizPlayerProps) {
  const [state, setState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: {},
    timeRemaining: quiz.time_limit_minutes ? quiz.time_limit_minutes * 60 : 0,
    isSubmitted: false,
    attempt: null,
    loading: false,
    showResults: false
  });

  const [questionResults, setQuestionResults] = useState<QuestionResult[]>([]);
  const [startTime] = useState(new Date());

  // Timer effect
  useEffect(() => {
    if (state.timeRemaining > 0 && !state.isSubmitted) {
      const timer = setInterval(() => {
        setState(prev => {
          if (prev.timeRemaining <= 1) {
            // Auto-submit when time runs out
            handleSubmitQuiz();
            return { ...prev, timeRemaining: 0 };
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [state.timeRemaining, state.isSubmitted]);

  const currentQuestion = quiz.questions?.[state.currentQuestionIndex];
  const totalQuestions = quiz.questions?.length || 0;
  const progress = totalQuestions > 0 ? ((state.currentQuestionIndex + 1) / totalQuestions) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: answer
      }
    }));
  };

  const nextQuestion = () => {
    if (state.currentQuestionIndex < totalQuestions - 1) {
      setState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      }));
    }
  };

  const previousQuestion = () => {
    if (state.currentQuestionIndex > 0) {
      setState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1
      }));
    }
  };

  const calculateResults = (): { score: number; totalPoints: number; results: QuestionResult[] } => {
    if (!quiz.questions) return { score: 0, totalPoints: 0, results: [] };

    const results: QuestionResult[] = [];
    let score = 0;
    let totalPoints = 0;

    quiz.questions.forEach(question => {
      const userAnswer = state.answers[question.id];
      const points = question.points || 10;
      totalPoints += points;

      let isCorrect = false;
      let correctAnswer = question.correct_answer;

      // Check answer based on question type
      switch (question.question_type) {
        case 'multiple_choice':
        case 'true_false':
          isCorrect = userAnswer === correctAnswer;
          break;
        case 'multiple_select':
          if (Array.isArray(correctAnswer) && Array.isArray(userAnswer)) {
            isCorrect = correctAnswer.length === userAnswer.length &&
              correctAnswer.every(answer => userAnswer.includes(answer));
          }
          break;
        case 'short_answer':
          // Simple text comparison (could be enhanced with fuzzy matching)
          isCorrect = userAnswer?.toLowerCase().trim() === correctAnswer?.toLowerCase().trim();
          break;
        default:
          isCorrect = false;
      }

      if (isCorrect) {
        score += points;
      }

      results.push({
        questionId: question.id,
        isCorrect,
        userAnswer,
        correctAnswer,
        explanation: question.explanation,
        points: isCorrect ? points : 0
      });
    });

    return { score, totalPoints, results };
  };

  const handleSubmitQuiz = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const endTime = new Date();
      const timeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
      const { score, totalPoints, results } = calculateResults();
      const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
      const passed = percentage >= (quiz.passing_score || 70);

      // Calculate XP based on performance
      const baseXP = quiz.xp_reward || 50;
      const bonusXP = passed ? Math.floor(baseXP * 0.5) : 0; // 50% bonus for passing
      const timeBonus = state.timeRemaining > 0 ? Math.floor(baseXP * 0.2) : 0; // 20% bonus for finishing early
      const totalXP = baseXP + bonusXP + timeBonus;

      // Save quiz attempt
      const attemptData = {
        user_id: userId,
        quiz_id: quiz.id,
        course_id: courseId,
        module_id: moduleId,
        answers_jsonb: state.answers,
        score: score,
        total_points: totalPoints,
        percentage: percentage,
        time_spent_seconds: timeSpent,
        passed: passed,
        xp_earned: totalXP,
        completed_at: endTime.toISOString(),
        created_at: new Date().toISOString()
      };

      const { data: attempt, error } = await supabase
        .from('quiz_attempts')
        .insert(attemptData)
        .select()
        .single();

      if (error) throw error;

      // Update user XP (simplified - in real app, this would be handled by a database function)
      if (passed) {
        const { error: xpError } = await supabase.rpc('add_user_xp', {
          user_id: userId,
          xp_amount: totalXP,
          source: 'quiz_completion',
          reference_id: quiz.id
        });

        if (xpError) {
          console.error('Erro ao adicionar XP:', xpError);
        }
      }

      setQuestionResults(results);
      setState(prev => ({
        ...prev,
        isSubmitted: true,
        attempt: attempt,
        showResults: true,
        loading: false
      }));

      if (passed) {
        toast.success(`Quiz concluído! Você ganhou ${totalXP} XP!`);
      } else {
        toast.error('Quiz não passou. Tente novamente!');
      }

      if (onComplete) {
        onComplete(attempt);
      }
    } catch (error: any) {
      console.error('Erro ao submeter quiz:', error);
      toast.error('Erro ao submeter quiz');
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const retryQuiz = () => {
    setState({
      currentQuestionIndex: 0,
      answers: {},
      timeRemaining: quiz.time_limit_minutes ? quiz.time_limit_minutes * 60 : 0,
      isSubmitted: false,
      attempt: null,
      loading: false,
      showResults: false
    });
    setQuestionResults([]);
  };

  const renderQuestion = (question: QuizQuestion) => {
    const userAnswer = state.answers[question.id];
    const isAnswered = userAnswer !== undefined && userAnswer !== null && userAnswer !== '';

    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <span className="text-lg">Questão {state.currentQuestionIndex + 1}</span>
              <Badge variant="secondary">{question.question_type}</Badge>
              <div className="flex items-center space-x-1 text-sm text-yellow-600">
                <Star className="w-4 h-4" />
                <span>{question.points || 10} pts</span>
              </div>
            </CardTitle>
            {quiz.time_limit_minutes && (
              <div className="flex items-center space-x-2 text-sm">
                <Timer className="w-4 h-4" />
                <span className={state.timeRemaining < 60 ? 'text-red-600 font-bold' : 'text-gray-600'}>
                  {formatTime(state.timeRemaining)}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-lg font-medium text-gray-900">
            {question.question_text}
          </div>

          {question.question_type === 'multiple_choice' && (
            <RadioGroup
              value={userAnswer || ''}
              onValueChange={(value) => handleAnswerChange(question.id, value)}
            >
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {question.question_type === 'true_false' && (
            <RadioGroup
              value={userAnswer || ''}
              onValueChange={(value) => handleAnswerChange(question.id, value === 'true')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="true" id="true" />
                <Label htmlFor="true" className="cursor-pointer">Verdadeiro</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="false" id="false" />
                <Label htmlFor="false" className="cursor-pointer">Falso</Label>
              </div>
            </RadioGroup>
          )}

          {question.question_type === 'multiple_select' && (
            <div className="space-y-2">
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`option-${index}`}
                    checked={(userAnswer || []).includes(option)}
                    onCheckedChange={(checked) => {
                      const currentAnswers = userAnswer || [];
                      if (checked) {
                        handleAnswerChange(question.id, [...currentAnswers, option]);
                      } else {
                        handleAnswerChange(question.id, currentAnswers.filter((a: string) => a !== option));
                      }
                    }}
                  />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          )}

          {question.question_type === 'short_answer' && (
            <Textarea
              placeholder="Digite sua resposta..."
              value={userAnswer || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              rows={3}
            />
          )}

          {/* Answer indicator */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center space-x-2">
              {isAnswered ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-green-600">Respondida</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500">Não respondida</span>
                </>
              )}
            </div>
            <div className="text-sm text-gray-500">
              {state.currentQuestionIndex + 1} de {totalQuestions}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderResults = () => {
    if (!state.attempt) return null;

    const { score, total_points, percentage, passed, xp_earned } = state.attempt;

    return (
      <div className="space-y-6">
        {/* Results Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {passed ? (
                <>
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  <span className="text-green-600">Quiz Aprovado!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-600" />
                  <span className="text-red-600">Quiz Reprovado</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{Math.round(percentage)}%</div>
                <div className="text-sm text-gray-600">Pontuação</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{score}/{total_points}</div>
                <div className="text-sm text-gray-600">Pontos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center">
                  <Zap className="w-5 h-5 mr-1" />
                  {xp_earned}
                </div>
                <div className="text-sm text-gray-600">XP Ganho</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {Math.floor((state.attempt.time_spent_seconds || 0) / 60)}m
                </div>
                <div className="text-sm text-gray-600">Tempo</div>
              </div>
            </div>

            <Progress value={percentage} className="h-3 mb-4" />
            
            <div className="flex items-center justify-center space-x-4">
              {!passed && (
                <Button onClick={retryQuiz} className="flex items-center space-x-2">
                  <RotateCcw className="w-4 h-4" />
                  <span>Tentar Novamente</span>
                </Button>
              )}
              {onClose && (
                <Button variant="outline" onClick={onClose}>
                  Fechar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Question Results */}
        <Card>
          <CardHeader>
            <CardTitle>Revisão das Questões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {questionResults.map((result, index) => {
                const question = quiz.questions?.find(q => q.id === result.questionId);
                if (!question) return null;

                return (
                  <div key={result.questionId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Questão {index + 1}</span>
                        {result.isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex items-center space-x-1 text-sm">
                        <Star className="w-4 h-4 text-yellow-600" />
                        <span>{result.points}/{question.points || 10}</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-900 mb-3">{question.question_text}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Sua resposta: </span>
                        <span className={result.isCorrect ? 'text-green-600' : 'text-red-600'}>
                          {Array.isArray(result.userAnswer) 
                            ? result.userAnswer.join(', ') 
                            : result.userAnswer?.toString() || 'Não respondida'
                          }
                        </span>
                      </div>
                      {!result.isCorrect && (
                        <div>
                          <span className="font-medium text-gray-700">Resposta correta: </span>
                          <span className="text-green-600">
                            {Array.isArray(result.correctAnswer) 
                              ? result.correctAnswer.join(', ') 
                              : result.correctAnswer?.toString()
                            }
                          </span>
                        </div>
                      )}
                      {result.explanation && (
                        <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-2">
                          <div className="flex items-center space-x-2 mb-1">
                            <Lightbulb className="w-4 h-4 text-blue-600" />
                            <span className="font-medium text-blue-800">Explicação:</span>
                          </div>
                          <p className="text-blue-700 text-sm">{result.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (state.showResults) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {renderResults()}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Quiz Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{quiz.title}</h1>
            <p className="text-gray-600">{quiz.description}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Target className="w-4 h-4" />
                <span>{totalQuestions} questões</span>
              </div>
              {quiz.time_limit_minutes && (
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{quiz.time_limit_minutes} min</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Award className="w-4 h-4" />
                <span>{quiz.passing_score || 70}% para passar</span>
              </div>
            </div>
          </div>
        </div>
        
        <Progress value={progress} className="h-2" />
        <div className="flex items-center justify-between mt-2 text-sm text-gray-600">
          <span>Progresso: {state.currentQuestionIndex + 1} de {totalQuestions}</span>
          <span>{Math.round(progress)}% concluído</span>
        </div>
      </div>

      {/* Current Question */}
      {currentQuestion && renderQuestion(currentQuestion)}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={previousQuestion}
          disabled={state.currentQuestionIndex === 0}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        <div className="flex items-center space-x-3">
          {state.currentQuestionIndex === totalQuestions - 1 ? (
            <Button
              onClick={handleSubmitQuiz}
              disabled={state.loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {state.loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                <>
                  <Flag className="w-4 h-4 mr-2" />
                  Finalizar Quiz
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={nextQuestion}
              disabled={state.currentQuestionIndex === totalQuestions - 1}
            >
              Próxima
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Quiz Info */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="flex items-center justify-center space-x-1 text-yellow-600 mb-1">
                <Zap className="w-5 h-5" />
                <span className="font-bold">{quiz.xp_reward || 50} XP</span>
              </div>
              <p className="text-sm text-gray-600">Recompensa base</p>
            </div>
            <div>
              <div className="flex items-center justify-center space-x-1 text-green-600 mb-1">
                <Trophy className="w-5 h-5" />
                <span className="font-bold">+50% XP</span>
              </div>
              <p className="text-sm text-gray-600">Bônus por passar</p>
            </div>
            <div>
              <div className="flex items-center justify-center space-x-1 text-blue-600 mb-1">
                <Timer className="w-5 h-5" />
                <span className="font-bold">+20% XP</span>
              </div>
              <p className="text-sm text-gray-600">Bônus por velocidade</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}