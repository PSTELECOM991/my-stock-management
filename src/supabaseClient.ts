import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xpcqnknetgsdoubyztor.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhwY3Fua25ldGdzZG91Ynl6dG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE5MDM4NTcsImV4cCI6MjA4NzQ3OTg1N30.p5Bgg8G2ofd2jRtWr9zMyuzUO1ze0uJM94fDlysZgOM';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
