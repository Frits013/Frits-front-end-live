
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { verify } from "https://deno.land/x/djwt@v2.9.1/mod.ts";

// Initialize Supabase client for phase management
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; object-src 'none'; base-uri 'none';",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
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

// Helper function to extract user ID from JWT token
async function extractUserIdFromToken(authHeader: string): Promise<string | null> {
  try {
    const token = authHeader.split(' ')[1];
    // Use Supabase client to verify the token and get user info
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    );
    
    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    
    if (error || !user) {
      console.error('Error extracting user from token:', error);
      return null;
    }
    
    return user.id;
  } catch (error) {
    console.error('Error parsing token:', error);
    return null;
  }
}

// Helper function to save AI response to database
async function saveAIResponse(sessionId: string, userId: string, content: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        content: content,
        role: 'writer',
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving AI response to database:', error);
      return false;
    }

    console.log('AI response saved to database successfully');
    return true;
  } catch (error) {
    console.error('Exception saving AI response:', error);
    return false;
  }
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

    const { message, session_id, message_id: providedMessageId } = await req.json();
    console.log('Received request:', { session_id, message_id: providedMessageId });
    console.log('Message content:', message);

    // Extract user ID from token
    const userId = await extractUserIdFromToken(authHeader);
    if (!userId) {
      console.error('Could not extract user ID from token');
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('Extracted user ID:', userId);

    // Get current session phase data
    const currentPhaseData = await getSessionPhaseData(session_id);
    console.log('Current phase data:', currentPhaseData);

    // Save user message to database with phase prompt and get the message_id
    if (!message) {
      console.error('No message provided in request');
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if message is already enhanced to prevent recursive enhancement
    const isAlreadyEnhanced = message.includes('User\'s answer:') || message.includes('phase. You are in that part');
    
    let enhancedMessage;
    if (isAlreadyEnhanced) {
      console.log('Message appears to be already enhanced, using as-is');
      enhancedMessage = message;
    } else {
      // Helper function to determine next phase based on current phase and question count
      const getNextPhasePrompt = async (sessionId: string, currentPhase: string) => {
        // Phase definitions (must match frontend)
        const phaseDefinitions = {
          'introduction': { maxQuestions: 3, order: 0 },
          'theme_selection': { maxQuestions: 4, order: 1 },
          'deep_dive': { maxQuestions: 8, order: 2 },
          'summary': { maxQuestions: 3, order: 3 },
          'recommendations': { maxQuestions: 2, order: 4 }
        };

        const phases = Object.keys(phaseDefinitions);
        
        // Get current assistant message count to determine question number
        const { data: assistantMessages, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', sessionId)
          .eq('role', 'writer')
          .order('created_at', { ascending: true });
        
        if (error || !assistantMessages) {
          console.error('Error fetching assistant messages:', error);
          return currentPhase; // fallback to current phase
        }

        const assistantCount = assistantMessages.length;
        console.log(`Assistant message count: ${assistantCount}`);

        // Calculate which phase we should be in based on message count
        let messagesSoFar = 0;
        let calculatedCurrentPhase = 'introduction';
        let questionsInCurrentPhase = 0;

        for (const phase of phases) {
          const maxQuestions = phaseDefinitions[phase].maxQuestions;
          
          if (assistantCount >= messagesSoFar && assistantCount < messagesSoFar + maxQuestions) {
            calculatedCurrentPhase = phase;
            questionsInCurrentPhase = assistantCount - messagesSoFar + 1; // +1 because we're about to ask the next question
            break;
          } else if (assistantCount >= messagesSoFar + maxQuestions) {
            messagesSoFar += maxQuestions;
          } else {
            break;
          }
        }

        console.log(`Calculated phase: ${calculatedCurrentPhase}, Question ${questionsInCurrentPhase}/${phaseDefinitions[calculatedCurrentPhase]?.maxQuestions}`);

        // Check if this will be the last question of the current phase
        const maxQuestionsInPhase = phaseDefinitions[calculatedCurrentPhase]?.maxQuestions || 3;
        const isLastQuestion = questionsInCurrentPhase >= maxQuestionsInPhase;

        if (isLastQuestion) {
          // Find next phase
          const currentIndex = phases.indexOf(calculatedCurrentPhase);
          if (currentIndex !== -1 && currentIndex < phases.length - 1) {
            const nextPhase = phases[currentIndex + 1];
            console.log(`Last question of ${calculatedCurrentPhase}, applying ${nextPhase} phase prompt`);
            return nextPhase;
          }
        }

        // Default to current phase
        return calculatedCurrentPhase;
      };

      // Get the appropriate phase for prompting
      const phaseForPrompt = await getNextPhasePrompt(session_id, currentPhaseData?.current_phase || 'introduction');
      
      // Create phase identification prompt
      const phasePrompt = phaseForPrompt 
        ? `The next question you will ask will be from the ${phaseForPrompt} phase. You are in that part of the interview process KEEP THIS INTO ACCOUNT.`
        : '';
      
      enhancedMessage = phasePrompt 
        ? `${phasePrompt}\n\nUser's answer: ${message}`
        : `User's answer: ${message}`;
    }
    
    // Save the enhanced user message to database
    const { data: savedMessage, error: saveError } = await supabase
      .from('chat_messages')
      .insert({
        session_id: session_id,
        user_id: userId,
        content: enhancedMessage,
        role: 'user',
        created_at: new Date().toISOString()
      })
      .select('message_id')
      .single();

    if (saveError || !savedMessage) {
      console.error('Error saving user message to database:', saveError);
      return new Response(
        JSON.stringify({ error: 'Failed to save message to database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const message_id = savedMessage.message_id;
    console.log('Saved user message with ID:', message_id);

    // Extract the token for debugging.
    const supabaseToken = authHeader.split(' ')[1];
    console.log('Supabase token length:', supabaseToken.length);
    console.log('Supabase token prefix:', supabaseToken.substring(0, 20) + '...');

    // Get the FastAPI URL from environment variables.
    const fastApiUrl = Deno.env.get('DEVELOPMENT_FASTAPI_URL');
    if (!fastApiUrl) {
      console.log('DEVELOPMENT_FASTAPI_URL not found, using direct response instead');
      const aiResponse = message ? `I received your message: "${message}"` : "Hello! How can I help you today?";
      
      // Save the AI response to database
      const saveSuccess = await saveAIResponse(session_id, userId, aiResponse);
      if (!saveSuccess) {
        console.error('Failed to save simulated AI response to database');
      }
      
      const simulatedResponse = {
        response: aiResponse,
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
    
    // Request body - backend expects only session_id and message_id (gets message content from DB)
    const requestBody = JSON.stringify({ 
      session_id, 
      message_id
    });
    console.log('Chat request body:', requestBody);
    
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
    
    // Check if backend returned an error
    if (data.error) {
      console.warn('Backend reported an error:', data.response);
      return new Response(
        JSON.stringify({
          error: data.error,
          response: data.response,
          session_id: data.session_id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Backend handles saving the AI response, no need to duplicate it here
    console.log('FastAPI backend processed message successfully');

    // Return the response from FastAPI (no phase_info processing since backend doesn't send it)
    return new Response(
      JSON.stringify({
        response: data.response || "I received your message and am processing it.",
        session_id: data.session_id || session_id,
        phase_info: {
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
