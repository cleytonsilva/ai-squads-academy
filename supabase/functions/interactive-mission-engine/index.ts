import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to safely parse JSON from AI response
function extractJson(text: string): any | null {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  try {
    return JSON.parse(match ? match[1] : text);
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

    // Create a Supabase client with the service role key
    const adminClient = createClient(supabaseUrl, serviceKey);

    // 1. Get request body and authenticated user
    const { attemptId, userResponse } = await req.json();
    if (!attemptId || !userResponse) {
      return new Response(JSON.stringify({ error: 'attemptId and userResponse are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: authData, error: authError } = await createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } },
    }).auth.getUser();

    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = authData.user.id;

    // Get the user's profile id
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const profileId = profile.id;

    // 2. Validate the attempt and that it belongs to the user
    const { data: attempt, error: attemptError } = await adminClient
      .from('mission_attempts')
      .select(`
        *,
        scenario:mission_scenarios (
          ai_system_prompt
        )
      `)
      .eq('id', attemptId)
      .eq('user_id', profileId) // Security check
      .single();

    if (attemptError || !attempt) {
      return new Response(JSON.stringify({ error: 'Attempt not found or access denied' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (attempt.status !== 'in_progress') {
      return new Response(JSON.stringify({ error: `Mission is not in progress. Current status: ${attempt.status}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. Fetch chat history
    const { data: chatHistory, error: historyError } = await adminClient
      .from('mission_chat_logs')
      .select('role, content')
      .eq('attempt_id', attemptId)
      .order('created_at', { ascending: true });

    if (historyError) throw historyError;

    // 4. Construct the prompt for the AI
    const messages = [
      { role: 'system', content: attempt.scenario.ai_system_prompt },
      ...chatHistory,
      { role: 'user', content: userResponse },
      { role: 'system', content: 'Avalie a resposta do usuário. A resposta está correta, parcialmente correta ou incorreta? Responda com um JSON contendo: {"evaluation": "correct" | "partial" | "incorrect", "reason": "explicação", "response": "sua resposta para continuar o cenário", "xp_change": valor_do_xp}. O valor de xp_change deve ser positivo para correct/partial e negativo para incorrect.' }
    ];

    // 5. Call the AI
    const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        response_format: { type: 'json_object' },
        temperature: 0.5,
      }),
    });

    if (!aiRes.ok) {
      throw new Error(`AI API request failed: ${await aiRes.text()}`);
    }

    const aiJson = await aiRes.json();
    const aiResponseText = aiJson.choices[0].message.content;
    const aiData = extractJson(aiResponseText);

    if (!aiData || !aiData.evaluation || !aiData.reason || !aiData.response) {
       throw new Error(`Invalid JSON response from AI: ${aiResponseText}`);
    }

    // 6. Analyze AI response and calculate changes
    const { evaluation, reason, response, xp_change } = aiData;
    let xpDelta = 0;
    let livesDelta = 0;

    if (evaluation === 'correct' || evaluation === 'partial') {
      xpDelta = Math.abs(xp_change || 10); // Default 10 XP for correct answers
    } else if (evaluation === 'incorrect') {
      xpDelta = -Math.abs(xp_change || 5); // Default -5 XP for incorrect answers
      livesDelta = -1; // Lose 1 life for incorrect answers
    }

    // 7. Use RPC function to atomically update mission attempt state
    const { data: updateResult, error: updateError } = await adminClient
      .rpc('update_mission_attempt_state', {
        p_attempt_id: attemptId,
        p_xp_change: xpDelta,
        p_lives_change: livesDelta
      });

    if (updateError) {
      console.error('Error updating mission attempt state:', updateError);
      throw updateError;
    }

    const updateData = updateResult[0];
    if (!updateData.success) {
      throw new Error(`Failed to update mission state: ${updateData.message}`);
    }

    const newXp = updateData.new_xp;
    const newLives = updateData.new_lives;
    const newStatus = newLives <= 0 ? 'failed' : attempt.status;

    // 8. Log the conversation
    const { error: logError } = await adminClient
      .from('mission_chat_logs')
      .insert([
        { attempt_id: attemptId, role: 'user', content: userResponse },
        { attempt_id: attemptId, role: 'assistant', content: response },
      ]);

    if (logError) throw logError;

    // 8. Return the AI's response to the frontend
    return new Response(JSON.stringify({
      success: true,
      evaluation,
      reason,
      response,
      xp_earned: newXp,
      lives_remaining: newLives,
      status: newStatus,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in interactive-mission-engine:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
