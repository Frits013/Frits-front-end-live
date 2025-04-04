// Follow this format:
// 1. Create a new Deno project:
//    mkdir supabase/functions/summarize-chat
//    cd supabase/functions/summarize-chat
//    supabase functions new summarize-chat
// 2. Paste this code into supabase/functions/summarize-chat/index.ts
// 3. Deploy the function:
//    supabase functions deploy summarize-chat

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { SupabaseClient, createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from "https://deno.land/x/openai@v4.24.1/mod.ts";

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract the session ID from the request body
    const { session_id } = await req.json();

    if (!session_id) {
      console.error('Session ID is missing');
      return new Response(JSON.stringify({ error: 'Session ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Fetch chat messages for the given session ID
    const { data: messages, error: messagesError } = await supabaseClient
      .from('chat_messages')
      .select('*')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch chat messages' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Format messages for OpenAI
    const formattedMessages: ChatMessage[] = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    });

    // Call OpenAI API to summarize the chat
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that summarizes chat conversations. Please provide a concise summary of the following conversation:",
        },
        ...formattedMessages,
      ],
    });

    const summary = completion.choices[0]?.message?.content;

    if (!summary) {
      console.error('Failed to generate summary');
      return new Response(JSON.stringify({ error: 'Failed to generate summary' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return the summary
    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in summarize-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
