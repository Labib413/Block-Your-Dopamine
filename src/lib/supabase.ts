import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// URL Sanitization: Ensure the URL is just the base origin
// This fixes "Invalid path specified in request URL" which happens when /rest/v1 or trailing slashes are included
let supabaseUrl = rawSupabaseUrl.trim();

// 1. Ensure protocol is present
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  supabaseUrl = `https://${supabaseUrl}`;
}

// 2. Remove trailing slashes and any accidentally included API paths
if (supabaseUrl) {
  try {
    const urlObj = new URL(supabaseUrl);
    supabaseUrl = urlObj.origin;
  } catch (e) {
    // Fallback to basic string manipulation if URL parsing fails
    supabaseUrl = supabaseUrl.replace(/\/+$/, '').split('/rest/v1')[0].split('/auth/v1')[0];
  }
}

if (!supabaseUrl || !supabaseAnonKey) {
  logger.error('Supabase credentials missing! Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
