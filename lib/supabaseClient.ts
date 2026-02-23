import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jgxntetaxzgqllqexacd.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpneG50ZXRheHpncWxscWV4YWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4ODM3NTAsImV4cCI6MjA4NzQ1OTc1MH0.Qy90d4whuFzU3XDg0PlrYuFsk-laN4OBhRKlZr8VkRA';

// Initialize the single Supabase client for the browser
export const supabase = createClient(supabaseUrl, supabaseKey);
