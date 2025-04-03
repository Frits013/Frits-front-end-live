
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
    // Get the authorization header from the request
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('No authorization header');
      throw new Error('No authorization header');
    }

    // Get the message, session_id, and message_id from the request body
    const { message, session_id, message_id } = await req.json();
    console.log('Received request:', { message, session_id, message_id });

    // Check if auth header has the JWT token format
    if (!authHeader.startsWith('Bearer ')) {
      console.error('Invalid authorization header format');
      throw new Error('Invalid authorization header format. Expected Bearer token');
    }

    // Forward the request to the FastAPI backend with ONLY the message_id and session_id
    // Note: Message content is NOT sent to the backend
    const response = await fetch('https://preview--frits-conversation-portal.lovable.app/chat/send_message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader, // Forward the JWT token
      },
      body: JSON.stringify({
        session_id,
        message_id, // Use the same message_id that was passed from the client
        // Message content is intentionally not included in the payload
      }),
    });

    if (!response.ok) {
      console.error('FastAPI error:', response.status);
      const errorText = await response.text();
      throw new Error(`FastAPI responded with status: ${response.status}, error: ${errorText}`);
    }

    const data = await response.json();
    console.log('FastAPI response:', data);

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
