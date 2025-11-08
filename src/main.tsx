import React from 'react'
import ReactDOM from 'react-dom/client'
import { supabase } from './lib/supabase'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg w-full text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">Meal Planner</h1>
        <p className="text-gray-600 mb-10">Your free database is ready!</p>

        <button
          onClick={async () => {
            // Create account + login
            await supabase.auth.signUp({
              email: "you@gmail.com",
              password: "12345678"
            })

            // Save your first meal plan
            await supabase.from('meal_plans').insert({
              title: "My First Week",
              meals: { monday: "Chicken + Rice", tuesday: "Salmon + Broccoli" }
            })

            // Log today's food
            await supabase.from('daily_logs').insert({
              meal_type: "dinner",
              food_name: "Grilled Chicken",
              calories: 450
            })

            alert("IT WORKED! Go to Supabase → Table Editor → you’ll see your data!")
          }}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-2xl py-6 px-16 rounded-2xl shadow-xl transform hover:scale-105 transition-all"
        >
          CLICK → Save My First Meal
        </button>

        <p className="text-sm text-gray-500 mt-8">
          After clicking → check Supabase dashboard
        </p>
      </div>
    </div>
  </React.StrictMode>
)