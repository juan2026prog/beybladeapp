import { createClient } from '@supabase/supabase-js';

// Read from Vite environment variables or use the provided credentials as default fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yntpctzgxaderribxsbe.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InludHBjdHpneGFkZXJyaWJ4c2JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5ODQxMzksImV4cCI6MjA5MjU2MDEzOX0.vpXyxCAA3T58ARPm45_YIiX6jB7-P_E2OUSEOPM02y4';

// Initialize the Supabase client isolated inside the "beyblade" schema
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'beyblade',
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('placeholder')
  );
};
