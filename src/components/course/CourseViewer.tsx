'use client';

import React, { useState, useEffect } from 'react';
import { Course, CourseModule, UserCourseProgress, UserNote } from '@/types/course';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  Play,
  CheckCircle,
  Lock,
  Star,
  Trophy,
  MessageSquare,
  StickyNote,
  Brain,
  User,
  Clock,
  Target,
  Award,
  Zap,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface CourseViewerProps {
  courseId: string;
  isAdmin?: boolean;
  userId?: string;
  mockCourse?: Course; // Para demonstrações
}

interface ViewerState {
  course: Course | null;
  currentModule: CourseModule | null;
  userProgress: UserCourseProgress | null;
  userNotes: UserNote[];
  loading: boolean;
  error: string | null;
  sidebarOpen: boolean;
  toolsOpen: boolean;
}

export default function CourseViewer({ courseId, isAdmin = false, userId, mockCourse }: CourseViewerProps) {
  const { toast } = useToast();
  const [state, setState] = useState<ViewerState>({
    course: null,
    currentModule: null,
    userProgress: null,
    userNotes: [],
    loading: true,
    error: null,
    sidebarOpen: true,
    toolsOpen: false
  });

  const [newNote, setNewNote] = useState('');
  const [aiChatInput, setAiChatInput] = useState('');
  const [aiChatMessages, setAiChatMessages] = useState<any[]>([]);

  // Load course data
  useEffect(() => {
    if (mockCourse) {
      // Use mock data for demonstration
      setState(prev => ({
        ...prev,
        course: mockCourse,
        currentModule: mockCourse.modules?.[0] || null,
        loading: false
      }));
    } else {
      loadCourseData();
    }
  }, [courseId, userId, mockCourse]);

  const loadCourseData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Load course with modules - tentar diferentes estruturas de tabela
      let courseData = null;
      let courseError = null;
      
      // Primeiro, tentar com modules
      const { data: courseData1, error: courseError1 } = await supabase
        .from('courses')
        .select(`
          *,
          modules(
            *,
            quizzes:module_quizzes(*)
          )
        `)
        .eq('id', courseId)
        .single();
      
      courseData = courseData1;
      courseError = courseError1;
      
      if (courseError1) {
        console.error('Erro ao carregar curso:', courseError1);
      }
      
      console.log('Dados do curso carregados:', { courseData, courseError });

      if (courseError) throw courseError;

      // Load user progress if userId is provided
      let userProgress = null;
      if (userId) {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .single();
        
        userProgress = progressData;
      }

      // Load user notes if userId is provided
      let userNotes: UserNote[] = [];
      if (userId) {
        const { data: notesData } = await supabase
          .from('user_notes')
          .select('*')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .order('created_at', { ascending: false });
        
        userNotes = notesData || [];
      }

      setState(prev => ({
        ...prev,
        course: courseData,
        currentModule: courseData.modules?.[0] || null,
        userProgress,
        userNotes,
        loading: false
      }));
    } catch (err: any) {
      console.error('Erro ao carregar curso:', err);
      setState(prev => ({
        ...prev,
        error: err.message || 'Erro ao carregar curso',
        loading: false
      }));
      toast({
        title: "Erro",
        description: "Erro ao carregar curso",
        variant: "destructive",
      });
    }
  };

  const selectModule = (module: CourseModule) => {
    console.log('Selecionando módulo:', module.title, module);
    
    // Adicionar loading state temporário
    setState(prev => ({ 
      ...prev, 
      currentModule: null // Limpar módulo atual temporariamente
    }));
    
    // Pequeno delay para feedback visual
    setTimeout(() => {
      setState(prev => ({ 
        ...prev, 
        currentModule: module 
      }));
      console.log('Módulo selecionado com sucesso:', module.title);
    }, 100);
  };

  const toggleModuleCompletion = async (moduleId: string) => {
    if (!userId || !state.course) return;

    try {
      // Update user progress
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          course_id: state.course.id,
          current_module_id: moduleId,
          completed_modules: [moduleId], // Simplified for demo
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: "Progresso atualizado!",
      });
      loadCourseData(); // Reload to get updated progress
    } catch (err: any) {
      console.error('Erro ao atualizar progresso:', err);
      toast({
        title: "Erro",
        description: "Erro ao atualizar progresso",
        variant: "destructive",
      });
    }
  };

  const saveNote = async () => {
    if (!userId || !state.course || !newNote.trim()) return;

    try {
      const { error } = await supabase
        .from('user_notes')
        .insert({
          user_id: userId,
          course_id: state.course.id,
          module_id: state.currentModule?.id,
          content: newNote.trim(),
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      setNewNote('');
      toast({
        title: "Sucesso!",
        description: "Anotação salva!",
      });
      loadCourseData(); // Reload to get updated notes
    } catch (err: any) {
      console.error('Erro ao salvar anotação:', err);
      toast({
        title: "Erro",
        description: "Erro ao salvar anotação",
        variant: "destructive",
      });
    }
  };

  const sendAiMessage = async () => {
    if (!aiChatInput.trim()) return;

    const userMessage = {
      role: 'user',
      content: aiChatInput,
      timestamp: new Date().toISOString()
    };

    setAiChatMessages(prev => [...prev, userMessage]);
    setAiChatInput('');

    // Simulate AI response (replace with actual AI integration)
    setTimeout(() => {
      const aiResponse = {
        role: 'assistant',
        content: `Entendi sua pergunta sobre "${aiChatInput}". Como posso ajudá-lo com este tópico do curso?`,
        timestamp: new Date().toISOString()
      };
      setAiChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  if (state.loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando curso...</p>
        </div>
      </div>
    );
  }

  if (state.error || !state.course) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{state.error || 'Curso não encontrado'}</p>
          <Button onClick={loadCourseData}>Tentar Novamente</Button>
        </div>
      </div>
    );
  }

  const completedModules = state.userProgress?.completed_modules || [];
  const progressPercentage = state.course.modules ? 
    (completedModules.length / state.course.modules.length) * 100 : 0;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setState(prev => ({ ...prev, sidebarOpen: !prev.sidebarOpen }))}
        >
          {state.sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
      </div>

      {/* Left Sidebar - Navigation */}
      <div className={`
        ${state.sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transition-transform duration-300 ease-in-out
        fixed lg:relative z-40 w-80 bg-white border-r border-gray-200 h-full overflow-y-auto
      `}>
        {/* Course Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="font-bold text-gray-900 text-lg line-clamp-2">
                {state.course.title}
              </h1>
              <p className="text-sm text-gray-600 capitalize">
                {state.course.difficulty_level}
              </p>
            </div>
          </div>

          {/* Progress */}
          {userId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progresso</span>
                <span className="font-medium">{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{completedModules.length} de {state.course.modules?.length || 0} módulos</span>
                <div className="flex items-center space-x-1">
                  <Trophy className="w-3 h-3" />
                  <span>1250 XP</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modules List */}
        <div className="p-4">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="w-4 h-4 mr-2" />
            Módulos do Curso
          </h2>
          <div className="space-y-2">
            {state.course.modules?.map((module, index) => {
              const isCompleted = completedModules.includes(module.id);
              const isCurrent = state.currentModule?.id === module.id;
              const isLocked = index > 0 && !completedModules.includes(state.course.modules![index - 1].id);

              return (
                <div
                  key={module.id}
                  className={`
                    p-3 rounded-lg border cursor-pointer transition-all
                    ${isCurrent ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'}
                    ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                  onClick={() => !isLocked && selectModule(module)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : isLocked ? (
                        <Lock className="w-5 h-5 text-gray-400" />
                      ) : (
                        <Play className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 line-clamp-1">
                        {index + 1}. {module.title}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {module.module_type}
                        </Badge>
                        {module.quizzes && module.quizzes.length > 0 && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Star className="w-3 h-3" />
                            <span>{module.quizzes.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {isCurrent && (
                      <ChevronRight className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Content Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {state.currentModule?.title || 'Selecione um módulo'}
              </h1>
              {state.currentModule && (
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>15 min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Target className="w-4 h-4" />
                    <span className="capitalize">{state.currentModule.module_type}</span>
                  </div>
                  {state.currentModule.quizzes && state.currentModule.quizzes.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4" />
                      <span>{state.currentModule.quizzes.length} quiz(s)</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {userId && state.currentModule && (
                <Button
                  onClick={() => toggleModuleCompletion(state.currentModule!.id)}
                  variant={completedModules.includes(state.currentModule.id) ? "secondary" : "default"}
                >
                  {completedModules.includes(state.currentModule.id) ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Concluído
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Marcar como Concluído
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setState(prev => ({ ...prev, toolsOpen: !prev.toolsOpen }))}
              >
                <StickyNote className="w-4 h-4 mr-2" />
                Ferramentas
              </Button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto">
          {state.currentModule ? (
            <div className="max-w-4xl mx-auto">
              {/* Module Description */}
              {state.currentModule.description && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-800">{state.currentModule.description}</p>
                </div>
              )}

              {/* Module Content */}
              <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
                {isAdmin ? (
                  // Admin Editor View (placeholder for WYSIWYG editor)
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Editor WYSIWYG</h3>
                      <p className="text-gray-600 mb-4">
                        Editor Tiptap integrado para administradores
                      </p>
                      <Button variant="outline">
                        Editar Conteúdo
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Student View
                  <div className="prose max-w-none">
                    {(() => {
                      // Debug: Log do conteúdo do módulo
                      console.log('Renderizando conteúdo do módulo:', {
                        moduleId: state.currentModule.id,
                        moduleTitle: state.currentModule.title,
                        contentJsonb: state.currentModule.content_jsonb,
                        hasContent: !!state.currentModule.content_jsonb?.content
                      });
                      
                      // Verificar diferentes estruturas de conteúdo
                      const content = state.currentModule.content_jsonb?.content || 
                                    state.currentModule.content_jsonb?.html ||
                                    state.currentModule.content;
                      
                      if (content && content.trim()) {
                        return (
                          <div 
                            dangerouslySetInnerHTML={{ __html: content }}
                            className="module-content"
                          />
                        );
                      } else {
                        return (
                          <div className="text-center py-12">
                            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              Conteúdo em Desenvolvimento
                            </h3>
                            <p className="text-gray-600">
                              O conteúdo deste módulo ainda está sendo preparado.
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              Debug: {JSON.stringify(state.currentModule.content_jsonb, null, 2)}
                            </p>
                          </div>
                        );
                      }
                    })()
                    }
                  </div>
                )}
              </div>

              {/* Module Quizzes */}
              {state.currentModule.quizzes && state.currentModule.quizzes.length > 0 && (
                <div className="space-y-4">
                  {state.currentModule.quizzes.map((quiz, index) => (
                    <Card key={quiz.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Star className="w-5 h-5 text-yellow-600" />
                          <span>Quiz {index + 1}: {quiz.title}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4">{quiz.description}</p>
                        <Button>
                          <Play className="w-4 h-4 mr-2" />
                          Iniciar Quiz
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                {/* Verificar se está carregando um módulo */}
                {state.course.modules && state.course.modules.length > 0 ? (
                  // Mostrar loading se há módulos mas nenhum selecionado (durante troca)
                  <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Carregando Módulo...
                    </h3>
                    <p className="text-gray-600">
                      Aguarde enquanto o conteúdo é carregado.
                    </p>
                  </>
                ) : (
                  // Mostrar mensagem padrão se não há módulos
                  <>
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Selecione um Módulo
                    </h3>
                    <p className="text-gray-600">
                      Escolha um módulo na barra lateral para começar a estudar.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Tools */}
      {state.toolsOpen && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {/* Tools Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Ferramentas</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setState(prev => ({ ...prev, toolsOpen: false }))}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Notes Section */}
            {userId && (
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                  <StickyNote className="w-4 h-4 mr-2" />
                  Minhas Anotações
                </h3>
                
                {/* Add Note */}
                <div className="space-y-3 mb-4">
                  <Textarea
                    placeholder="Adicionar nova anotação..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <Button 
                    onClick={saveNote} 
                    disabled={!newNote.trim()}
                    size="sm"
                    className="w-full"
                  >
                    Salvar Anotação
                  </Button>
                </div>

                {/* Notes List */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {state.userNotes.map((note) => (
                    <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded p-3">
                      <p className="text-sm text-gray-800 mb-2">{note.content}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(note.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                  {state.userNotes.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Nenhuma anotação ainda
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* AI Chat Section */}
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                Assistente IA
                <Badge variant="secondary" className="ml-2 text-xs">Pro</Badge>
              </h3>
              
              {/* Chat Messages */}
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {aiChatMessages.map((message, index) => (
                  <div key={index} className={`
                    p-3 rounded-lg text-sm
                    ${message.role === 'user' 
                      ? 'bg-blue-50 border border-blue-200 ml-4' 
                      : 'bg-gray-50 border border-gray-200 mr-4'
                    }
                  `}>
                    <p>{message.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
                {aiChatMessages.length === 0 && (
                  <div className="text-center py-8">
                    <Brain className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Faça uma pergunta sobre o curso
                    </p>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Pergunte algo sobre o curso..."
                  value={aiChatInput}
                  onChange={(e) => setAiChatInput(e.target.value)}
                  className="min-h-[60px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendAiMessage();
                    }
                  }}
                />
                <Button 
                  onClick={sendAiMessage} 
                  disabled={!aiChatInput.trim()}
                  size="sm"
                  className="w-full"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Enviar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      {state.sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setState(prev => ({ ...prev, sidebarOpen: false }))}
        />
      )}
    </div>
  );
}