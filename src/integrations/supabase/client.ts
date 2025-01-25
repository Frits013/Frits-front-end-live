import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eqjsrvbisiuysboukgnt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxanNydmJpc2l1eXNib3VrZ250Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDYyMDc4ODAsImV4cCI6MjAyMTc4Mzg4MH0.Wd_7qYbJnXBXZBgdvGVrPiZZGBEcXhM_YHxwVWBtNGY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);