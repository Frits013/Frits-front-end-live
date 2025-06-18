
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    
    // Call the FastAPI chat endpoint using the new token.
    console.log(`Calling FastAPI chat endpoint at: ${fastApiUrl}/chat/send_message`);
    
    const requestBody = JSON.stringify({ session_id, message_id, message });
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
    
    // For successful responses, return the backend data directly.
    return new Response(
      JSON.stringify({
        response: data.response,
        session_id: data.session_id
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
