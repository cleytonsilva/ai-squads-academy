import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Send, Heart, Star, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface MissionPlayerProps {
  scenarioId: string;
}

interface MissionAttempt {
  id: string;
  status: 'in_progress' | 'completed' | 'failed' | 'locked';
  xp_earned: number;
  lives_remaining: number;
}

interface ChatLog {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const MissionPlayer: React.FC<MissionPlayerProps> = ({ scenarioId }) => {
  const { user } = useAuth();
  const [attempt, setAttempt] = useState<MissionAttempt | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatLog[]>([]);
  const [initialScenario, setInitialScenario] = useState<string>('');
  const [userResponse, setUserResponse] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && scenarioId) {
      loadOrCreateAttempt();
    }
  }, [user, scenarioId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const loadOrCreateAttempt = async () => {
    setIsLoading(true);
    if (!user) return;

    // Get profile_id from user_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      toast.error('User profile not found.');
      setIsLoading(false);
      return;
    }
    const profileId = profile.id;

    // First, fetch the scenario details to get the initial text
    const { data: scenarioData, error: scenarioError } = await supabase
        .from('mission_scenarios')
        .select('initial_scenario')
        .eq('id', scenarioId)
        .single();

    if(scenarioError || !scenarioData){
        toast.error('Failed to load scenario details.');
        console.error(scenarioError);
        setIsLoading(false);
        return;
    }
    setInitialScenario(scenarioData.initial_scenario);

    // Check for an existing attempt
    const { data: existingAttempt, error: attemptError } = await supabase
      .from('mission_attempts')
      .select('*')
      .eq('user_id', profileId)
      .eq('scenario_id', scenarioId)
      .single();

    if (existingAttempt) {
      setAttempt(existingAttempt);
      fetchChatHistory(existingAttempt.id);
    } else if (attemptError.code === 'PGRST116') { // "single row not found"
      // Create a new attempt if none exists
      const { data: newAttempt, error: createError } = await supabase
        .from('mission_attempts')
        .insert({
          user_id: profileId,
          scenario_id: scenarioId,
          status: 'in_progress', // Start the mission immediately
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        toast.error('Failed to start mission.');
        console.error(createError);
      } else {
        setAttempt(newAttempt);
        // No chat history for a new attempt
        setChatHistory([]);
      }
    } else if (attemptError) {
        toast.error('Failed to load mission progress.');
        console.error(attemptError);
    }
    setIsLoading(false);
  };

  const fetchChatHistory = async (attemptId: string) => {
    const { data, error } = await supabase
      .from('mission_chat_logs')
      .select('*')
      .eq('attempt_id', attemptId)
      .order('created_at', { ascending: true });

    if (error) {
      toast.error('Failed to load chat history.');
      console.error(error);
    } else {
      setChatHistory(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userResponse.trim() || !attempt || isSubmitting) return;

    setIsSubmitting(true);

    const currentResponse = userResponse;
    setUserResponse('');
    // Optimistically update UI
    setChatHistory(prev => [...prev, {id: Date.now(), role: 'user', content: currentResponse, created_at: new Date().toISOString()}]);

    try {
      const { data, error } = await supabase.functions.invoke('interactive-mission-engine', {
        body: {
          attemptId: attempt.id,
          userResponse: currentResponse,
        },
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error || 'An unknown error occurred.');

      // Update UI with confirmed data from backend
      setChatHistory(prev => [...prev, {id: Date.now() + 1, role: 'assistant', content: data.response, created_at: new Date().toISOString()}]);
      setAttempt(prev => prev ? { ...prev, xp_earned: data.xp_earned, lives_remaining: data.lives_remaining, status: data.status } : null);

      if(data.status !== 'in_progress'){
        toast.info(`Mission ${data.status}!`, {description: data.reason});
      }

    } catch (err) {
      toast.error(err.message);
      // Revert optimistic update if there was an error
      setChatHistory(prev => prev.filter(log => log.content !== currentResponse));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!attempt) {
    return <div className="text-center p-8">Could not load mission. Please try again.</div>;
  }

  const isMissionOver = attempt.status === 'completed' || attempt.status === 'failed';

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Interactive Mission</CardTitle>
        <CardDescription>Respond to the scenario to complete your mission.</CardDescription>
        <div className="flex justify-between items-center pt-2">
            <div className="flex items-center gap-2 text-yellow-500">
                <Star className="w-5 h-5" />
                <span className="font-bold">{attempt.xp_earned} XP</span>
            </div>
            <div className="flex items-center gap-2 text-red-500">
                <Heart className="w-5 h-5" />
                <span className="font-bold">{attempt.lives_remaining} Lives</span>
            </div>
        </div>
      </CardHeader>
      <CardContent className="h-96 overflow-y-auto p-4 border-y space-y-4">
        <div className="p-3 bg-gray-100 rounded-lg">
            <p className="text-sm italic text-gray-700">{initialScenario}</p>
        </div>
        {chatHistory.map((log) => (
          <div key={log.id} className={`flex ${log.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${log.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
              <p className="text-sm">{log.content}</p>
            </div>
          </div>
        ))}
        {isMissionOver && (
            <div className="p-4 text-center bg-yellow-100 border-t-4 border-yellow-500 rounded-b text-yellow-900">
                <ShieldAlert className="w-8 h-8 mx-auto mb-2" />
                <h4 className="font-bold">Mission {attempt.status}!</h4>
                <p className="text-sm">You can review your attempt, but you cannot respond further.</p>
            </div>
        )}
        <div ref={chatEndRef} />
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2 pt-4">
          <Input
            value={userResponse}
            onChange={(e) => setUserResponse(e.target.value)}
            placeholder={isMissionOver ? "Mission is over." : "Type your response..."}
            disabled={isSubmitting || isMissionOver}
          />
          <Button type="submit" disabled={isSubmitting || isMissionOver}>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default MissionPlayer;
