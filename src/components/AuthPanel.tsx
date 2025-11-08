import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthPanel() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [status, setStatus] = useState('')
  const [useMagicLink, setUseMagicLink] = useState(false)

  const redirectTo = window.location.origin

  async function signInWithPassword() {
    if (!email || !password) {
      setStatus('Error: Please enter both email and password')
      return
    }

    setStatus('Signing in...')
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      setStatus(`Error: ${error.message}`)
    } else {
      setStatus('Success! Loading your data...')
    }
  }

  async function signUpWithPassword() {
    if (!email || !password) {
      setStatus('Error: Please enter both email and password')
      return
    }

    if (password.length < 6) {
      setStatus('Error: Password must be at least 6 characters')
      return
    }

    setStatus('Creating account...')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
      },
    })
    
    if (error) {
      setStatus(`Error: ${error.message}`)
    } else {
      setStatus('Success! Check your email to confirm your account.')
    }
  }

  async function signInWithEmail() {
    if (!email) {
      setStatus('Error: Please enter your email')
      return
    }

    setStatus('Sending magic link...')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })
    setStatus(error ? `Error: ${error.message}` : 'Check your email for a magic link.')
  }

  const handleSubmit = () => {
    if (useMagicLink) {
      signInWithEmail()
    } else if (isSignUp) {
      signUpWithPassword()
    } else {
      signInWithPassword()
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16, maxWidth: 360 }}>
      <input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !useMagicLink && password && handleSubmit()}
        style={{ 
          padding: 12, 
          border: '1px solid #374151', 
          borderRadius: 8,
          background: '#1f2937',
          color: 'white',
          fontSize: 14
        }}
      />
      
      {!useMagicLink && (
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          style={{ 
            padding: 12, 
            border: '1px solid #374151', 
            borderRadius: 8,
            background: '#1f2937',
            color: 'white',
            fontSize: 14
          }}
        />
      )}

      <button 
        onClick={handleSubmit}
        style={{
          padding: 12,
          background: '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: 14
        }}
      >
        {useMagicLink ? 'Send Magic Link' : isSignUp ? 'Create Account' : 'Sign In'}
      </button>

      {!useMagicLink && (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#10b981',
              cursor: 'pointer',
              fontSize: 13,
              textDecoration: 'underline'
            }}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      )}

      <div style={{ textAlign: 'center', paddingTop: 8, borderTop: '1px solid #374151' }}>
        <button
          onClick={() => {
            setUseMagicLink(!useMagicLink)
            setStatus('')
          }}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#9ca3af',
            cursor: 'pointer',
            fontSize: 12
          }}
        >
          {useMagicLink ? '← Back to password login' : 'Use magic link instead →'}
        </button>
      </div>

      {status && (
        <div style={{ 
          color: status.includes('Error') ? '#ef4444' : '#10b981', 
          fontSize: 13,
          padding: 12,
          background: status.includes('Error') ? '#7f1d1d' : '#065f46',
          borderRadius: 8
        }}>
          {status}
        </div>
      )}
    </div>
  )
}