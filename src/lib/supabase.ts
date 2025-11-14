import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase project URL and anon key
export const supabaseUrl = 'https://rddvqbxbmpilbimmppvu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkZHZxYnhibXBpbGJpbW1wcHZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODMyMDAsImV4cCI6MjA3Nzg1OTIwMH0.8y4fFG3WamhU2TTZ2albS50fQrMWldZV_bGXDy9vqMg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
