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

    // 🔹 Initial session
    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session
      setAuthed(!!session)

      if (session) {
        const { data: userData } = await supabase.auth.getUser()
        console.log('Current Supabase user:', userData?.user)
        setUser(userData?.user ?? null)
      }

      setReady(true)
    })

    // 🔹 Listen for auth state changes
    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setAuthed(!!session)
        if (session) {
          const { data: userData } = await supabase.auth.getUser()
          console.log('Auth change → user:', userData?.user)
          setUser(userData?.user ?? null)
        } else {
          setUser(null)
        }
      }
    )

    return () => sub.subscription.unsubscribe()
  }, [])

    if (!ready) return <div style={{ padding:16 }}>Loading…</div>

  if (useDemo) {
    return (
      <div style={{ padding:16 }}>
        <MealPlannerApp user={null} demo />
      </div>
    )
  }

  if (!authed || !user) {
    return (
      <div style={{ padding:16 }}>
        <h1>Sign in to sync across devices</h1>
        <AuthPanel />
      </div>
    )
  }

  return (
    <div style={{ padding:16 }}>
      <MealPlannerApp user={user} demo={false} />
    </div>
  )
}
