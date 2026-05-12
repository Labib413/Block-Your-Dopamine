import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Sanitize Supabase URL: strip trailing slashes and ensure https protocol
const supabaseUrl = rawSupabaseUrl.replace(/\/+$/, '');

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('Supabase credentials missing! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
} else if (!supabaseUrl.startsWith('https://')) {
  logger.warn('Insecure Supabase URL detected. Use https:// for secure communication.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
