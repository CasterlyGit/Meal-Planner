// src/lib/supabase.ts   ← CREATE THIS FILE
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('Missing Supabase keys!')
}

export const supabase = createClient(url!, key!)