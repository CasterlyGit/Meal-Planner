import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import AuthPanel from './components/AuthPanel'

// 👉 import your big UI (default export) and alias it:
import MealPlannerApp from './App'

export default function SignedInApp() {
  const [ready, setReady] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [useDemo, setUseDemo] = useState(false)

  useEffect(() => {
    setUseDemo(localStorage.getItem('demoMode') === '1')
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!ready) return <div style={{ padding:16 }}>Loading…</div>

  if (useDemo) {
    return (
      <div style={{ padding:16 }}>
        <Header authed={false} useDemo onExitDemo={() => {
          localStorage.removeItem('demoMode'); setUseDemo(false)
        }} />
        <MealPlannerApp />
      </div>
    )
  }

  if (!authed) {
    return (
      <div style={{ padding:16 }}>
        <h1>Sign in to sync across devices</h1>
        <AuthPanel />
        <div style={{ marginTop:12 }}>
          <button onClick={() => { localStorage.setItem('demoMode','1'); setUseDemo(true) }}>
            Try without an account (demo)
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding:16 }}>
      <Header authed useDemo={false} onExitDemo={()=>{}} />
      <MealPlannerApp />
    </div>
  )
}

function Header({ authed, useDemo, onExitDemo }:{
  authed:boolean; useDemo:boolean; onExitDemo:()=>void
}) {
  return (
    <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:12 }}>
      <div style={{ fontWeight:700 }}>Meal Planner & Tracker</div>
      <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
        {useDemo && <button onClick={onExitDemo}>Exit demo</button>}
        {authed && <button onClick={() => supabase.auth.signOut()}>Sign out</button>}
      </div>
    </div>
  )
}
