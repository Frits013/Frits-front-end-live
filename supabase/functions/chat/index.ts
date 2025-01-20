import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { message, chat_id } = await req.json();
    console.log('Received request:', { message, chat_id });

    // Make request to FastAPI backend on Render
    console.log('Attempting to connect to FastAPI at https://demo-fastapi-app.onrender.com/chat');
    const response = await fetch('https://demo-fastapi-app.onrender.com/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        chat_id,
      }),
    });

    if (!response.ok) {
      console.error('FastAPI error:', response.status, await response.text());
      throw new Error(`FastAPI responded with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('FastAPI response:', data);

    if (!data.response) {
      throw new Error('Invalid response format from FastAPI');
    }

    return new Response(
      JSON.stringify(data),
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
        details: 'Error connecting to FastAPI backend on Render'
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