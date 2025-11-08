import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import AuthPanel from './components/AuthPanel'
import MealPlannerApp from './App'

export default function SignedInApp() {
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [user, setUser] = useState(null)
  const [useDemo, setUseDemo] = useState(false)

  // 🟩 1. Initial setup
  useEffect(() => {
    setUseDemo(localStorage.getItem('demoMode') === '1')

    let cancelled = false

    const init = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) console.error('Error getting session:', error)

        const session = data?.session
        if (!cancelled) setAuthed(!!session)

        if (session) {
          const { data: userData } = await supabase.auth.getUser()
          if (!cancelled) setUser(userData?.user ?? null)
        } else {
          if (!cancelled) setUser(null)
        }
      } catch (err) {
        console.error('Init error:', err)
      } finally {
        if (!cancelled) setReady(true) // ✅ Always set ready
      }
    }

    init()

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('Auth event:', _event)
        setAuthed(!!session)
        if (session) {
          const { data: userData } = await supabase.auth.getUser()
          setUser(userData?.user ?? null)
        } else {
          setUser(null)
        }
        setReady(true)
      }
    )

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  // 🟦 2. Conditional rendering
  if (!ready)
    return (
      <div
        style={{
          padding: 16,
          color: '#fff',
          fontFamily: 'sans-serif',
          textAlign: 'center',
        }}
      >
        Loading your meal planner…
      </div>
    )

  if (useDemo) {
    return (
      <div style={{ padding: 16 }}>
        <Header
          authed={false}
          useDemo
          onExitDemo={() => {
            localStorage.removeItem('demoMode')
            setUseDemo(false)
          }}
        />
        <MealPlannerApp user={null} demo />
      </div>
    )
  }

  if (!authed || !user) {
    return (
      <div style={{ padding: 16 }}>
        <h1>Sign in to sync across devices</h1>
        <AuthPanel />
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => {
              localStorage.setItem('demoMode', '1')
              setUseDemo(true)
            }}
          >
            Try without an account (demo)
          </button>
        </div>
      </div>
    )
  }

  // 🟨 3. Authenticated view with sign-out
  return (
    <div style={{ padding: 16 }}>
      <Header authed useDemo={false} onExitDemo={() => {}} user={user} />
      <MealPlannerApp user={user} demo={false} />
    </div>
  )
}

function Header({
  authed,
  useDemo,
  onExitDemo,
  user,
}: {
  authed: boolean
  useDemo: boolean
  onExitDemo: () => void
  user?: any
}) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        marginBottom: 12,
        color: 'white',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ fontWeight: 700 }}>Meal Planner & Tracker</div>
      {user && <div>Welcome, {user.email}</div>}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        {useDemo && <button onClick={onExitDemo}>Exit demo</button>}
        {authed && (
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  )
}
