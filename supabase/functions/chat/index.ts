
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
    const supabaseToken = authHeader.split(' ')[1];
    console.log('Supabase token length:', supabaseToken.length);
    console.log('Supabase token prefix:', supabaseToken.substring(0, 20) + '...');

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
    
    // If we have a FastAPI URL, first get a FastAPI token by exchanging the Supabase token
    console.log(`Exchanging Supabase token at: ${fastApiUrl}/auth/token`);
    
    try {
      // Step 1: Exchange Supabase token for FastAPI token
      console.log('Making token exchange request...');
      const tokenResponse = await fetch(`${fastApiUrl}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader, // Send the Supabase token
        },
        body: JSON.stringify({ session_id }),
      });

      console.log('Token exchange response status:', tokenResponse.status);
      
      // Get the token response as text first for better debugging
      const tokenResponseText = await tokenResponse.text();
      console.log('Token exchange raw response text:', tokenResponseText.substring(0, 200) + (tokenResponseText.length > 200 ? '...' : ''));
      
      let tokenData;
      try {
        // Try to parse the response as JSON
        tokenData = JSON.parse(tokenResponseText);
      } catch (parseError) {
        console.error('Failed to parse token response as JSON:', parseError);
        // Return the raw response for debugging
        return new Response(
          JSON.stringify({ 
            error: 'Failed to parse authentication response',
            raw_response: tokenResponseText.substring(0, 500)
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Check if the token response contains any error
      if (!tokenResponse.ok || tokenData.error) {
        console.error('Token exchange failed:', tokenData.error || 'Unknown error');
        // Pass through the backend error message directly
        return new Response(
          JSON.stringify({ 
            error: tokenData.error || 'Failed to authenticate with backend',
            details: tokenData.message || tokenData.detail || 'No additional details available'
          }),
          { 
            status: tokenResponse.status || 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      if (!tokenData.access_token) {
        console.error('No access token in response');
        return new Response(
          JSON.stringify({ 
            error: 'Invalid token response from backend',
            details: 'Response did not contain an access token'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      console.log('Token exchange successful, received FastAPI token');
      
      // Step 2: Call the chat endpoint with the new FastAPI token
      console.log(`Calling FastAPI chat endpoint at: ${fastApiUrl}/chat/send_message`);
      
      const requestBody = JSON.stringify({
        session_id,
        message_id,
        message
      });
      
      console.log('Chat request body:', requestBody);
      
      const response = await fetch(`${fastApiUrl}/chat/send_message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenData.access_token}`, // Use the FastAPI token
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
            error: 'Received HTML response instead of JSON',
            details: responseText.substring(0, 500)
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
            error: 'Failed to parse backend response as JSON',
            details: responseText.substring(0, 500)
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Handle the unified response model (always HTTP 200, but may contain error information)
      // Check if response has a normal message or an error message
      if (!data.response) {
        console.error('Backend response missing expected "response" field:', data);
        return new Response(
          JSON.stringify({
            error: 'Invalid backend response format',
            details: 'Response did not contain expected fields',
            raw_response: data
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Special case for known error messages
      if (data.response === "An error occurred while processing your request.") {
        console.warn('Backend returned a generic error message');
        // Return a more specific error if possible
        return new Response(
          JSON.stringify({
            error: 'Backend processing error',
            message: data.response,
            details: 'The backend was unable to process this request. Please try again with different input.',
            session_id: data.session_id
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Return the response from the backend as-is
      // Your frontend should handle showing error messages appropriately
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
          error: 'Failed to communicate with backend',
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
