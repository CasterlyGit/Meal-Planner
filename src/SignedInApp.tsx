import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import AuthPanel from './components/AuthPanel'
import MealPlannerApp from './App'

export default function SignedInApp() {
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [user, setUser] = useState(null)
  const [useDemo, setUseDemo] = useState(false)

  useEffect(() => {
    setUseDemo(localStorage.getItem('demoMode') === '1')

    const init = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) console.error('Error getting session:', error)

      const session = data.session
      setAuthed(!!session)

      if (session) {
        const { data: userData } = await supabase.auth.getUser()
        console.log('Current Supabase user:', userData?.user)
        setUser(userData?.user ?? null)
      }

      setReady(true)
    }

    init()

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth event:', _event)
        setAuthed(!!session)
        if (session) {
          const { data: userData } = await supabase.auth.getUser()
          console.log('Auth change → user:', userData?.user)
          setUser(userData?.user ?? null)
        } else {
          setUser(null)
        }
        setReady(true)
      }
    )

    return () => sub.subscription.unsubscribe()
  }, [])

  if (!ready) return <div style={{ padding:16 }}>Loading…</div>

  if (useDemo) {
    return (
      <div style={{ padding:16 }}>
        <Header authed={false} useDemo onExitDemo={() => {
          localStorage.removeItem('demoMode')
          setUseDemo(false)
        }} />
        <MealPlannerApp user={null} demo />
      </div>
    )
  }

  if (!authed || !user) {
    return (
      <div style={{ padding:16 }}>
        <h1>Sign in to sync across devices</h1>
        <AuthPanel />
        <div style={{ marginTop:12 }}>
          <button
            onClick={() => { localStorage.setItem('demoMode','1'); setUseDemo(true) }}
          >
            Try without an account (demo)
          </button>
        </div>
      </div>
    )
  }

  // ✅ Logged-in view with header + sign-out
  return (
    <div style={{ padding:16 }}>
      <Header authed useDemo={false} onExitDemo={() => {}} />
      <MealPlannerApp user={user} demo={false} />
    </div>
  )
}

// Simple reusable header
function Header({
  authed,
  useDemo,
  onExitDemo,
}: {
  authed: boolean
  useDemo: boolean
  onExitDemo: () => void
}) {
  return (
    <div style={{
      display: 'flex',
      gap: 12,
      alignItems: 'center',
      marginBottom: 12
    }}>
      <div style={{ fontWeight: 700 }}>Meal Planner & Tracker</div>
      <div style={{
        marginLeft: 'auto',
        display: 'flex',
        gap: 8
      }}>
        {useDemo && (
          <button onClick={onExitDemo}>Exit demo</button>
        )}
        {authed && (
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              cursor: 'pointer'
            }}
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  )
}
