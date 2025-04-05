
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
    // Log all headers to debug
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Get the authorization header from the request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ code: 401, message: "Missing authorization header" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the message, session_id, and message_id from the request body
    const { message, session_id, message_id } = await req.json();
    console.log('Received request:', { session_id, message_id });
    console.log('Message content:', message);

    // Check if auth header has the JWT token format
    if (!authHeader.startsWith('Bearer ')) {
      console.error('Invalid authorization header format');
      return new Response(
        JSON.stringify({ code: 401, message: "Invalid authorization header format. Expected Bearer token" }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Extract token for debugging
    const token = authHeader.split(' ')[1];
    console.log('Token length:', token.length);
    console.log('Token prefix:', token.substring(0, 20) + '...');

    // Get the development FastAPI URL from environment variables
    const fastApiUrl = Deno.env.get('DEVELOPMENT_FASTAPI_URL');
    
    // Check if the URL is available
    if (!fastApiUrl) {
      console.log('DEVELOPMENT_FASTAPI_URL not found, using direct response instead');
      
      // Create a simulated response with the message content echoed back
      const simulatedResponse = {
        response: message ? `I received your message: "${message}"` : "Hello! How can I help you today?",
        session_id: session_id
      };
      
      console.log('Generated direct response:', simulatedResponse);
      
      return new Response(
        JSON.stringify(simulatedResponse),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          } 
        }
      );
    }
    
    // If we have a FastAPI URL, forward the request
    console.log(`Calling FastAPI at: ${fastApiUrl}/chat/send_message`);
    
    const requestBody = JSON.stringify({
      session_id,
      message_id,
      message // Include message now for the FastAPI to process
    });
    
    console.log('Request body:', requestBody);
    
    try {
      console.log('Making fetch request to FastAPI...');
      
      const response = await fetch(`${fastApiUrl}/chat/send_message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader, // Forward the JWT token
        },
        body: requestBody,
      });

      console.log('FastAPI response status:', response.status);
      console.log('FastAPI response headers:', Object.fromEntries(response.headers.entries()));
      
      // Get the raw response text first for debugging
      const responseText = await response.text();
      console.log('FastAPI raw response text (first 200 chars):', 
        responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
      
      // Check if the response appears to be HTML (which indicates an error)
      if (responseText.trim().startsWith('<!DOCTYPE html>') || responseText.trim().startsWith('<html>')) {
        console.error('Received HTML response instead of JSON');
        return new Response(
          JSON.stringify({ 
            error: 'Invalid JSON response from FastAPI',
            details: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('FastAPI parsed JSON response:', data);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid JSON response from FastAPI',
            details: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Return the clean response from the backend
      return new Response(
        JSON.stringify({
          response: data.response,
          session_id: data.session_id
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          } 
        }
      );
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to communicate with FastAPI backend',
          details: fetchError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Error in chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Error processing chat request'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
