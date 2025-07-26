
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Initialize Supabase client for phase management
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; object-src 'none'; base-uri 'none';",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

// Helper function to get current session phase data
async function getSessionPhaseData(sessionId: string) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select(`
      current_phase,
      phase_metadata,
      phase_question_counts,
      phase_max_questions,
      phase_completion_criteria
    `)
    .eq('id', sessionId)
    .single();

  if (error) {
    console.error('Error fetching session phase data:', error);
    return null;
  }

  return data;
}

// Helper function to get phase configuration
async function getPhaseConfig(phase: string) {
  const { data, error } = await supabase
    .from('interview_phases_config')
    .select('*')
    .eq('phase', phase)
    .single();

  if (error) {
    console.error('Error fetching phase config:', error);
    return null;
  }

  return data;
}

// Helper function to update session phase data
async function updateSessionPhase(sessionId: string, updates: any) {
  const { error } = await supabase
    .from('chat_sessions')
    .update(updates)
    .eq('id', sessionId);

  if (error) {
    console.error('Error updating session phase:', error);
    return false;
  }

  return true;
}

// Helper function to update interview progress
async function updateInterviewProgress(sessionId: string, userId: string, phase: string, data: any) {
  const { error } = await supabase
    .from('interview_progress')
    .upsert({
      session_id: sessionId,
      user_id: userId,
      phase: phase,
      ...data,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'session_id,user_id,phase'
    });

  if (error) {
    console.error('Error updating interview progress:', error);
    return false;
  }

  return true;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log all headers for debugging purposes.
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Validate the authorization header.
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ code: 401, message: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.error('Invalid authorization header format');
      return new Response(
        JSON.stringify({
          code: 401,
          message: "Invalid authorization header format. Expected Bearer token"
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { message, session_id, message_id } = await req.json();
    console.log('Received request:', { session_id, message_id });
    console.log('Message content:', message);

    // Get current session phase data
    const currentPhaseData = await getSessionPhaseData(session_id);
    console.log('Current phase data:', currentPhaseData);

    // Extract the token for debugging.
    const supabaseToken = authHeader.split(' ')[1];
    console.log('Supabase token length:', supabaseToken.length);
    console.log('Supabase token prefix:', supabaseToken.substring(0, 20) + '...');

    // Get the FastAPI URL from environment variables.
    const fastApiUrl = Deno.env.get('DEVELOPMENT_FASTAPI_URL');
    if (!fastApiUrl) {
      console.log('DEVELOPMENT_FASTAPI_URL not found, using direct response instead');
      const simulatedResponse = {
        response: message ? `I received your message: "${message}"` : "Hello! How can I help you today?",
        session_id: session_id
      };
      console.log('Generated direct response:', simulatedResponse);
      return new Response(
        JSON.stringify(simulatedResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Exchange the Supabase token for a FastAPI token.
    console.log(`Exchanging Supabase token at: ${fastApiUrl}/auth/token`);
    console.log('Making token exchange request...');
    const tokenResponse = await fetch(`${fastApiUrl}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({ session_id }),
    });

    console.log('Token exchange response status:', tokenResponse.status);
    const tokenResponseText = await tokenResponse.text();
    console.log('Token exchange raw response text:', tokenResponseText.substring(0, 200) + (tokenResponseText.length > 200 ? '...' : ''));

    let tokenData;
    try {
      tokenData = JSON.parse(tokenResponseText);
    } catch (parseError) {
      console.error('Failed to parse token response as JSON:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse authentication response',
          raw_response: tokenResponseText.substring(0, 500)
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!tokenResponse.ok || tokenData.error) {
      console.error('Token exchange failed:', tokenData.error || 'Unknown error');
      return new Response(
        JSON.stringify({ 
          error: tokenData.error || 'Failed to authenticate with backend',
          details: tokenData.message || tokenData.detail || 'No additional details available'
        }),
        { status: tokenResponse.status || 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    if (!tokenData.access_token) {
      console.error('No access token in response');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid token response from backend',
          details: 'Response did not contain an access token'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Token exchange successful, received FastAPI token');
    
    // Get phase configuration if phase data exists
    let phaseConfig = null;
    if (currentPhaseData?.current_phase) {
      phaseConfig = await getPhaseConfig(currentPhaseData.current_phase);
    }

    // Call the FastAPI chat endpoint using the new token.
    console.log(`Calling FastAPI chat endpoint at: ${fastApiUrl}/chat/send_message`);
    
    // Enhanced request body with phase data
    const requestBody = JSON.stringify({ 
      session_id, 
      message_id, 
      message,
      phase_data: {
        current_phase: currentPhaseData?.current_phase || 'introduction',
        phase_metadata: currentPhaseData?.phase_metadata || {},
        phase_question_counts: currentPhaseData?.phase_question_counts || {},
        phase_max_questions: currentPhaseData?.phase_max_questions || {},
        system_prompt: phaseConfig?.system_prompt,
        max_questions: phaseConfig?.max_questions,
        completion_threshold: phaseConfig?.completion_threshold
      }
    });
    console.log('Enhanced chat request body with phase data:', requestBody);
    
    const response = await fetch(`${fastApiUrl}/chat/send_message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenData.access_token}`
      },
      body: requestBody,
    });

    console.log('FastAPI response status:', response.status);
    console.log('FastAPI response headers:', Object.fromEntries(response.headers.entries()));
    
    // Read the raw response text for debugging purposes.
    const responseText = await response.text();
    console.log('FastAPI raw response text (first 200 chars):',
      responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
    );
    
    if (responseText.trim().startsWith('<!DOCTYPE html>') || responseText.trim().startsWith('<html>')) {
      console.error('Received HTML response instead of JSON');
      return new Response(
        JSON.stringify({ 
          error: 'Received HTML response instead of JSON',
          details: responseText.substring(0, 500)
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
      console.log('FastAPI parsed JSON response:', data);
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse backend response as JSON',
          details: responseText.substring(0, 500)
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Option B: Use the error field from the backend.
    // If the backend indicates an error, log it and pass the original message through.
    if (data.error) {
      console.warn('Backend reported an error:', data.response);
      return new Response(
        JSON.stringify({
          error: data.error,
          message: data.response,
          session_id: data.session_id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Process phase information from FastAPI response
    if (data.phase_info) {
      console.log('Processing phase info:', data.phase_info);
      
      // Update session phase data if phase transition occurred
      if (data.phase_info.current_phase && data.phase_info.current_phase !== currentPhaseData?.current_phase) {
        console.log(`Phase transition detected: ${currentPhaseData?.current_phase} -> ${data.phase_info.current_phase}`);
        await updateSessionPhase(session_id, {
          current_phase: data.phase_info.current_phase,
          phase_metadata: data.phase_info.phase_metadata || currentPhaseData?.phase_metadata || {},
          phase_question_counts: data.phase_info.phase_question_counts || currentPhaseData?.phase_question_counts || {},
          updated_at: new Date().toISOString()
        });
      }

      // Update interview progress
      if (data.phase_info.current_phase) {
        // Get user ID from token (you may need to decode the JWT token)
        // For now, we'll use a placeholder - you should implement proper user ID extraction
        const userId = tokenData.user_id || 'placeholder_user_id';
        
        await updateInterviewProgress(session_id, userId, data.phase_info.current_phase, {
          questions_asked: data.phase_info.questions_in_phase || 0,
          completion_confidence: data.phase_info.completion_confidence || 0,
          selected_themes: data.phase_info.selected_themes || [],
          insights: data.phase_info.insights || {}
        });
      }
    }

    // For successful responses, return enhanced data with phase information
    return new Response(
      JSON.stringify({
        response: data.response,
        session_id: data.session_id,
        phase_info: data.phase_info || {
          current_phase: currentPhaseData?.current_phase || 'introduction',
          progress_percent: 0,
          questions_in_phase: 0,
          max_questions_in_phase: phaseConfig?.max_questions || 3,
          should_transition: false,
          selected_themes: [],
          completion_confidence: 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Error processing chat request'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
