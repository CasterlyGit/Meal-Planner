import React from 'react'
import ReactDOM from 'react-dom/client'
import { supabase } from './lib/supabase'
import './index.css'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg w-full text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">Meal Planner</h1>
        <p className="text-gray-600 mb-10">Database connected!</p>

        <button
          onClick={async () => {
            try {
              // 1. Create account
              const { data } = await supabase.auth.signUp({
                email: "test@test.com",
                password: "12345678"
              })

              // 2. Save meal plan
              await supabase.from('meal_plans').insert({
                title: "My First Week",
                meals: { monday: "Oats", tuesday: "Chicken Rice" }
              })

              // 3. Log food
              await supabase.from('daily_logs').insert({
                meal_type: "breakfast",
                food_name: "Avocado Toast",
                calories: 380
              })

              alert("IT WORKED! 🎉 Check Supabase → Table Editor → data is there!")
            } catch (e) {
              alert("Error: " + e)
            }
          }}
          className="bg-green-600 hover:bg-green-700 text-white font-bold text-2xl py-6 px-16 rounded-2xl shadow-xl transform hover:scale-105 transition-all"
        >
          CLICK → Save My First Meal
        </button>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)