import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vpjjfdhmjqmkkkxigekg.supabase.co';
const supabaseAnonKey = 'sb_publishable_n46jGwz2Bb7Mn2CqczYM2w_zFmY_09Z';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
