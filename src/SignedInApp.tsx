// src/SignedInApp.tsx
import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import AuthPanel from "./components/AuthPanel";
import MealPlannerApp from "./App";
import InstallButton from "./components/InstallButton";

export default function SignedInApp() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [useDemo, setUseDemo] = useState(false);

  useEffect(() => {
    // Check demo mode
    const isDemoMode = localStorage.getItem("demoMode") === "1";
    setUseDemo(isDemoMode);

    if (isDemoMode) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    let sub: { unsubscribe?: () => void } | null = null;

    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      setLoading(false);
      console.log("✅ Initial session loaded:", session?.user?.email || "No user");
    });

    // Listen for auth changes
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      console.log("🔄 Auth changed:", _event, session?.user?.email || "No user");
    });
    sub = data.subscription;

    return () => {
      cancelled = true;
      sub?.unsubscribe?.();
    };
  }, []);

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Demo mode
  if (useDemo) {
    return (
      <div>
        <Header
          user={null}
          onSignOut={() => {}}
          onExitDemo={() => {
            localStorage.removeItem("demoMode");
            setUseDemo(false);
          }}
          isDemo={true}
        />
        <MealPlannerApp user={null} demo={true} />
      </div>
    );
  }

  // Not signed in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-black/40 backdrop-blur-sm border border-gray-700 rounded-2xl p-8 max-w-md w-full">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Meal Planner & Tracker</h1>
            <InstallButton variant="ghost" size="sm" />
          </div>
          <p className="text-gray-400 mb-6">
            Sign in to sync your data across all devices
          </p>
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
  }

  // Signed in
  return (
    <div>
      <Header
        user={user}
        onSignOut={async () => {
          await supabase.auth.signOut();
          setUser(null);
        }}
        onExitDemo={() => {}}
        isDemo={false}
      />
      <MealPlannerApp user={user} demo={false} />
    </div>
  );
}

function Header({
  user,
  onSignOut,
  onExitDemo,
  isDemo,
}: {
  user: any | null;
  onSignOut: () => void;
  onExitDemo: () => void;
  isDemo: boolean;
}) {
  return (
    <div className="bg-black bg-opacity-40 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-xl font-bold text-white">Meal Planner & Tracker</div>
          {user && <div className="text-sm text-gray-400">👋 {user.email}</div>}
        </div>
        <div className="flex items-center gap-3">
          {/* Install CTA visible inside the app too */}
          <InstallButton variant="ghost" size="sm" />
          {isDemo && (
            <button
              onClick={onExitDemo}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              Exit Demo
            </button>
          )}
          {user && (
            <button
              onClick={onSignOut}
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
