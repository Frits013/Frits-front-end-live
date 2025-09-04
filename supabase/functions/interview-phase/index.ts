import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop() || url.searchParams.get('action');
    
    console.log(`Interview phase action: ${action}`);

    switch (action) {
      case 'status':
        return await getPhaseStatus(req);
      case 'transition':
        return await transitionPhase(req);
      case 'config':
        return await getPhaseConfig(req);
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action. Use: status, transition, or config" }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    console.error('Error in interview-phase function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Get current phase status for a session
async function getPhaseStatus(req: Request) {
  const { session_id } = await req.json();
  
  if (!session_id) {
    return new Response(
      JSON.stringify({ error: "session_id is required" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data: sessionData, error: sessionError } = await supabase
    .from('chat_sessions')
    .select(`
      id,
      current_phase,
      phase_metadata,
      phase_question_counts,
      phase_max_questions,
      selected_themes
    `)
    .eq('id', session_id)
    .single();

  if (sessionError) {
    console.error('Error fetching session:', sessionError);
    return new Response(
      JSON.stringify({ error: "Session not found" }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Get phase configuration
  const { data: phaseConfig } = await supabase
    .from('interview_phases_config')
    .select('*')
    .eq('phase', sessionData.current_phase || 'introduction')
    .single();

  // Calculate progress
  const currentPhase = sessionData.current_phase || 'introduction';
  const questionsInPhase = sessionData.phase_question_counts?.[currentPhase] || 0;
  const maxQuestions = sessionData.phase_max_questions?.[currentPhase] || phaseConfig?.max_questions || 3;
  const progressPercent = Math.min((questionsInPhase / maxQuestions) * 100, 100);

  return new Response(
    JSON.stringify({
      session_id,
      phase_info: {
        current_phase: currentPhase,
        progress_percent: progressPercent,
        questions_in_phase: questionsInPhase,
        max_questions_in_phase: maxQuestions,
        should_transition: questionsInPhase >= maxQuestions,
        selected_themes: sessionData.selected_themes || {},
        completion_confidence: sessionData.phase_metadata?.completion_confidence || 0,
        phase_metadata: sessionData.phase_metadata || {},
        insights: sessionData.phase_metadata?.insights || {}
      },
      phase_config: phaseConfig
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Transition to a new phase
async function transitionPhase(req: Request) {
  const { session_id, new_phase, user_id } = await req.json();
  
  if (!session_id || !new_phase) {
    return new Response(
      JSON.stringify({ error: "session_id and new_phase are required" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate phase
  const validPhases = ['introduction', 'theme_selection', 'deep_dive', 'summary', 'recommendations'];
  if (!validPhases.includes(new_phase)) {
    return new Response(
      JSON.stringify({ error: "Invalid phase" }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Update session phase
  const { error: updateError } = await supabase
    .from('chat_sessions')
    .update({
      current_phase: new_phase,
      updated_at: new Date().toISOString()
    })
    .eq('id', session_id);

  if (updateError) {
    console.error('Error updating session phase:', updateError);
    return new Response(
      JSON.stringify({ error: "Failed to update session phase" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }


  return new Response(
    JSON.stringify({
      success: true,
      session_id,
      new_phase,
      message: `Successfully transitioned to ${new_phase} phase`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Get phase configuration
async function getPhaseConfig(req: Request) {
  const url = new URL(req.url);
  const phase = url.searchParams.get('phase');

  let query = supabase.from('interview_phases_config').select('*');
  
  if (phase) {
    query = query.eq('phase', phase).single();
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching phase config:', error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch phase configuration" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
