import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPanel() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('')

  // ✅ Redirect back to root, not /auth/callback
  const redirectTo = window.location.origin

  async function signInWithEmail() {
    setStatus('Sending magic link…')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })
    setStatus(error ? `Error: ${error.message}` : 'Check your email for a magic link.')
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    if (error) setStatus(`Error: ${error.message}`)
  }

  return (
    <div style={{ display: 'grid', gap: 12, maxWidth: 360 }}>
      <input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && signInWithEmail()}
        style={{ 
          padding: 12, 
          border: '1px solid #374151', 
          borderRadius: 8,
          background: '#1f2937',
          color: 'white'
        }}
      />
      <button 
        onClick={signInWithEmail}
        style={{
          padding: 12,
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 600
        }}
      >
        Send magic link
      </button>
      <button 
        onClick={signInWithGoogle}
        style={{
          padding: 12,
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 600
        }}
      >
        Continue with Google
      </button>
      {status && <div style={{ color: status.includes('Error') ? '#ef4444' : '#10b981', fontSize: 14 }}>{status}</div>}
    </div>
  )
}