
// Follow this format:
// 1. Create a new Deno project:
//    mkdir supabase/functions/handle-new-user
//    cd supabase/functions/handle-new-user
//    supabase functions new handle-new-user
// 2. Deploy the function:
//    supabase functions deploy handle-new-user

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
    const body = await req.json();
    const { record } = body;

    // Initialize Supabase client with service role key for admin privileges
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Make sure we're using the correct column name: "user_id" not "id"
    // Insert or update the users table
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert({
        user_id: record.id, // Use the proper key from auth.users
        email: record.email,
      });

    if (error) {
      console.error('Error in handle-new-user function:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in handle-new-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
