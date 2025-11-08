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

    // ✅ Check existing session (DON'T force logout)
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;
        
        console.log("Session check:", session ? "Found session" : "No session");
        
        setAuthed(!!session);

        if (session) {
          const { data: userData } = await supabase.auth.getUser();
          setUser(userData?.user ?? null);
          console.log("User loaded:", userData?.user?.email);
        }
        
        // ✅ Always set ready after initial check
        setReady(true);
      } catch (err) {
        console.error("Init error:", err);
        setReady(true); // Still set ready even on error
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
      }
    );

    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );

  if (useDemo)
    return (
      <div>
        <Header authed={false} useDemo onExitDemo={() => {
          localStorage.removeItem("demoMode");
          setUseDemo(false);
        }} />
        <MealPlannerApp user={null} demo />
      </div>
    );

  if (!authed || !user)
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-black bg-opacity-40 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-white mb-2">Meal Planner & Tracker</h1>
          <p className="text-gray-400 mb-6">Sign in to sync your data across all devices</p>
          <AuthPanel />
          <div className="mt-6 pt-6 border-t border-gray-700">
            <button
              onClick={() => {
                localStorage.setItem("demoMode", "1");
                setUseDemo(true);
              }}
              className="w-full bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Try Demo Mode (No Account)
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div>
      <Header authed useDemo={false} onExitDemo={() => {}} user={user} />
      <MealPlannerApp user={user} demo={false} />
    </div>
  );
}

function Header({ authed, useDemo, onExitDemo, user }) {
  return (
    <div className="bg-black bg-opacity-40 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold text-white">Meal Planner & Tracker</div>
          {user && <div className="text-sm text-gray-400">👋 {user.email}</div>}
        </div>
        <div className="flex items-center gap-3">
          {useDemo && (
            <button
              onClick={onExitDemo}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              Exit Demo
            </button>
          )}
          {authed && (
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.reload();
              }}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}