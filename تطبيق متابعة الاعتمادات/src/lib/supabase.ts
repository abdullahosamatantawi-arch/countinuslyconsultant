import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://trfmjyaoucmfxxocduhr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyZm1qeWFvdWNtZnh4b2NkdWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNDkwMzQsImV4cCI6MjA4NDYyNTAzNH0.H3WtnkC6mrVigAl9RUDe4o4xtnHXYRQADnGBvfDPJdE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
