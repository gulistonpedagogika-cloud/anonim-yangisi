import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://vdjzscnjrfjxbrfqrjoi.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_rUkf5BPd1AwDG0-Ih_iTDg_uZY3KF6B';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
