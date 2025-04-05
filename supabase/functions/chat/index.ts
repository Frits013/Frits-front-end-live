
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

    // Forward the request to the FastAPI backend with ONLY the message_id and session_id
    // Note: Message content is NOT sent to the backend
    const fastApiUrl = 'https://preview--frits-conversation-portal.lovable.app/chat/send_message';
    console.log(`Calling FastAPI at: ${fastApiUrl}`);
    console.log(`With headers: Authorization: ${authHeader.substring(0, 20)}...`);
    
    const requestBody = JSON.stringify({
      session_id,
      message_id,
      // Message content is intentionally not included in the payload
    });
    console.log('Request body:', requestBody);
    
    const response = await fetch(fastApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader, // Forward the JWT token
      },
      body: requestBody,
    });

    console.log('FastAPI response status:', response.status);
    console.log('FastAPI response headers:', Object.fromEntries(response.headers.entries()));
    
    // Check if the response is OK
    if (!response.ok) {
      // Try to get the response text for debugging
      const responseText = await response.text();
      console.error('FastAPI error response text:', responseText);
      
      try {
        // Try to parse the response text as JSON
        const errorData = JSON.parse(responseText);
        return new Response(
          JSON.stringify({ 
            error: `FastAPI error: ${response.status}`, 
            details: errorData 
          }),
          { 
            status: response.status, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } catch (parseError) {
        // If parsing fails, return the raw response text
        return new Response(
          JSON.stringify({ 
            error: `FastAPI responded with non-JSON: ${response.status}`, 
            details: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Try to get the response as text first
    const responseText = await response.text();
    console.log('FastAPI response text sample:', responseText.substring(0, 100) + (responseText.length > 100 ? '...' : ''));
    
    let data;
    try {
      // Try to parse as JSON
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

    // Only return the clean response from the backend
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
