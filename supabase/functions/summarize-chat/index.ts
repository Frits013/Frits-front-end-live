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
    const { messages } = await req.json();

    // Create a context from the first few messages (up to 3)
    const context = messages.slice(0, 3).map(msg => 
      `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');

    // Get Azure OpenAI configuration from environment variables
    const apiKey = Deno.env.get('AZURE_OPENAI_API_KEY');
    const apiBase = Deno.env.get('AZURE_OPENAI_API_BASE');
    const modelName = Deno.env.get('AZURE_OPENAI_MODEL_NAME');
    const modelVersion = Deno.env.get('AZURE_OPENAI_MODEL_VERSION');

    if (!apiKey || !apiBase || !modelName || !modelVersion) {
      throw new Error('Missing Azure OpenAI configuration');
    }

    console.log('Generating summary using Azure OpenAI');

    // Construct the Azure OpenAI API URL
    const apiUrl = `${apiBase}/openai/deployments/${modelName}/chat/completions?api-version=${modelVersion}`;

    // Generate summary using Azure OpenAI
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that generates very short (2-3 words) titles for conversations based on their content. Focus on the main topic or theme.'
          },
          {
            role: 'user',
            content: `Please generate a very short (2-3 words) title for this conversation:\n\n${context}`
          }
        ],
        max_tokens: 50,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI API error:', errorText);
      throw new Error(`Azure OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Azure OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from Azure OpenAI');
    }

    const summary = data.choices[0].message.content.trim();
    console.log('Generated summary:', summary);

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in summarize-chat function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});