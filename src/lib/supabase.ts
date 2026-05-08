import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// URL Sanitization: Remove trailing slashes and ensure proper protocol
const supabaseUrl = rawSupabaseUrl.replace(/\/$/, '');

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('Supabase credentials missing! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
}

// Extra validation for Vercel deployment environments
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  logger.warn('Supabase URL should start with https://. Current value: ' + supabaseUrl);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
