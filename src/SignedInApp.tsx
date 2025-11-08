import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import AuthPanel from "./components/AuthPanel";
import MealPlannerApp from "./App";

export default function SignedInApp() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState(null);
  const [useDemo, setUseDemo] = useState(false);

  useEffect(() => {
    setUseDemo(localStorage.getItem("demoMode") === "1");

    // 🔴 Force everyone logged out on every page load
    (async () => {
      try {
        await supabase.auth.signOut();
        console.log("Forced fresh logout on init ✅");

        // Proceed normally after logout
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        setAuthed(!!session);

        if (session) {
          const { data: userData } = await supabase.auth.getUser();
          setUser(userData?.user ?? null);
        }
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setReady(true);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log("Auth event:", _event);
        setAuthed(!!session);
        if (session) {
          const { data: userData } = await supabase.auth.getUser();
          setUser(userData?.user ?? null);
        } else {
          setUser(null);
        }
        setReady(true);
      }
    );

    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready)
    return (
      <div style={{ padding: 16, color: "#fff", textAlign: "center" }}>
        Loading…
      </div>
    );

  if (useDemo)
    return (
      <div style={{ padding: 16 }}>
        <Header authed={false} useDemo onExitDemo={() => {
          localStorage.removeItem("demoMode");
          setUseDemo(false);
        }} />
        <MealPlannerApp user={null} demo />
      </div>
    );

  if (!authed || !user)
    return (
      <div style={{ padding: 16 }}>
        <h1>Sign in to sync across devices</h1>
        <AuthPanel />
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => {
              localStorage.setItem("demoMode", "1");
              setUseDemo(true);
            }}
          >
            Try without an account (demo)
          </button>
        </div>
      </div>
    );

  return (
    <div style={{ padding: 16 }}>
      <Header authed useDemo={false} onExitDemo={() => {}} user={user} />
      <MealPlannerApp user={user} demo={false} />
    </div>
  );
}

function Header({ authed, useDemo, onExitDemo, user }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        alignItems: "center",
        marginBottom: 12,
        color: "white",
      }}
    >
      <div style={{ fontWeight: 700 }}>Meal Planner & Tracker</div>
      {user && <div>Welcome, {user.email}</div>}
      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        {useDemo && <button onClick={onExitDemo}>Exit demo</button>}
        {authed && (
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: 6,
              padding: "6px 12px",
              cursor: "pointer",
            }}
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  );
}
