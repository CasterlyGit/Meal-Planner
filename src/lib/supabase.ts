import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Missing Supabase URL or Key! Check Vercel env vars.')
}

export const supabase = createClient(url, key)

supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase AUTH →', event, session?.user?.email || 'nobody')
  console.log('Full user object →', session?.user)
})