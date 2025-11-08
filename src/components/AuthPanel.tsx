// src/components/AuthPanel.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPanel() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')

  async function signInWithEmail() {
    setStatus('Sending magic link…')
    const redirectTo = window.location.origin
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo }
    })
    setStatus(error ? `Error: ${error.message}` : 'Check your email for a magic link.')
  }

  async function signInWithGoogle() {
    const redirectTo = window.location.origin
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
    })
    if (error) setStatus(`Error: ${error.message}`)
  }

  return (
    <div style={{ display:'grid', gap:12, maxWidth:360 }}>
      <input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ padding:8, border:'1px solid #ccc', borderRadius:6 }}
      />
      <button onClick={signInWithEmail}>Send magic link</button>
      <button onClick={signInWithGoogle}>Continue with Google</button>
      {status && <div>{status}</div>}
    </div>
  )
}
