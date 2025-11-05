import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv-safe';

// Load and validate environment variables
dotenv.config({
  example: '.env.example',
  allowEmptyValues: false
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file');
}

export const supabase = createClient(supabaseUrl, supabaseKey);