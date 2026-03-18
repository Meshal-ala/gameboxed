import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gatarbmbvjrrbcemsdhl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhdGFyYm1idmpycmJjZW1zZGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3OTcxNzEsImV4cCI6MjA4OTM3MzE3MX0.cVW3ybZX5CAuxC-pE94YTTwOMuA3IufAzgHavY3rxag';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
