// src/App.tsx
import React, { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'
import {
  Calendar,
  Plus,
  Trash2,
  ShoppingCart,
  Book,
  TrendingUp,
  Search,
  Star,
  X,
  Award,
  Flame,
  Target,
  Utensils,
  CheckCircle,
  Clock,
  BarChart3,
  Heart,
  List,
  Moon,
  Sun,
} from 'lucide-react'
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion'

import LayoutShell from './ui/LayoutShell'
import Card from './ui/Card'
import EmptyState from './ui/EmptyState'
import useDebounce from './hooks/useDebounce'
import InstallButton from './components/InstallButton'

// -------------------- TYPES --------------------
type Recipe = {
  id: number
  name: string
  ingredients: string[]
  prep: string
  calories: number
  protein: number
  carbs: number
  fats: number
  favorite: boolean
}

type DailyGoals = { calories: number; protein: number; carbs: number; fats: number }
type MealLog = {
  id: number
  recipeId: number
  date: string
  mealType: string
  timestamp: number
  inDiary: boolean
}

type Props = { user: any | null; demo?: boolean }

// -------------------- COLOR PALETTE --------------------
const lightColors = {
  background: "#FAFAF8",
  surface: "#FFFFFF",
  text_primary: "#333333",
  text_secondary: "#6B7280",
  border: "#E5E7EB",
  primary: "#A7C7E7",
  secondary: "#F9D5E5",
  tertiary: "#C8E6C9",
  highlight: "#FFF3B0",
  sections: {
    today: "#A7C7E7",
    planner: "#F9D5E5",
    recipes: "#C8E6C9",
    shopping: "#FFF3B0",
    nutrition: "#FFD6A5",
    diary: "#B5EAD7"
  },
  states: {
    success: "#A8E6CF",
    warning: "#FFD3B6",
    error: "#FFAAA5",
    info: "#B5EAD7"
  }
}

const darkColors = {
  background: "#0F0F1A",
  surface: "rgba(255, 255, 255, 0.05)",
  text_primary: "#FFFFFF",
  text_secondary: "rgba(255, 255, 255, 0.7)",
  border: "rgba(255, 255, 255, 0.1)",
  primary: "#A7C7E7",
  secondary: "#F9D5E5",
  tertiary: "#C8E6C9",
  highlight: "#FFF3B0",
  sections: {
    today: "#A7C7E7",
    planner: "#F9D5E5",
    recipes: "#C8E6C9",
    shopping: "#FFF3B0",
    nutrition: "#FFD6A5",
    diary: "#B5EAD7"
  },
  states: {
    success: "#A8E6CF",
    warning: "#FFD3B6",
    error: "#FFAAA5",
    info: "#B5EAD7"
  }
}

// -------------------- UI BITS --------------------
const AppleRing = ({
  percentage,
  size,
  strokeWidth,
  gradient,
  icon: Icon,
  darkMode,
}: {
  percentage: number
  size: number
  strokeWidth: number
  gradient: [string, string]
  icon: React.ComponentType<{ size?: number; className?: string }>
  darkMode: boolean
}) => {
  const id = useId()
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI

  const spring = useSpring(0, { stiffness: 120, damping: 20, mass: 0.4 })
  useEffect(() => { spring.set(percentage) }, [percentage, spring])

  const dashoffset = useTransform(spring, (p) => {
    const pct = Math.min(p, 100)
    return circumference - (pct / 100) * circumference
  })

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id={`g-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradient[0]} />
            <stop offset="100%" stopColor={gradient[1]} />
          </linearGradient>
        </defs>

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}
          strokeWidth={strokeWidth}
          fill="none"
        />

        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#g-${id})`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          style={{
            strokeLinecap: 'round',
            filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))',
            strokeDashoffset: dashoffset,
          }}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <Icon size={size * 0.25} className={darkMode ? "text-white" : "text-gray-700"} />
      </div>
    </div>
  )
}

// Enhanced Bottom Dock with Glass Effect
const BottomDock = ({ view, setView, darkMode }: { view: string; setView: (view: any) => void; darkMode: boolean }) => {
  const views = [
    { id: 'today', label: 'Today', icon: Target, color: darkMode ? darkColors.sections.today : lightColors.sections.today },
    { id: 'planner', label: 'Planner', icon: Calendar, color: darkMode ? darkColors.sections.planner : lightColors.sections.planner },
    { id: 'recipes', label: 'Recipes', icon: Book, color: darkMode ? darkColors.sections.recipes : lightColors.sections.recipes },
    { id: 'shopping', label: 'Shopping', icon: ShoppingCart, color: darkMode ? darkColors.sections.shopping : lightColors.sections.shopping },
    { id: 'nutrition', label: 'Nutrition', icon: BarChart3, color: darkMode ? darkColors.sections.nutrition : lightColors.sections.nutrition },
    { id: 'diary', label: 'Diary', icon: Heart, color: darkMode ? darkColors.sections.diary : lightColors.sections.diary },
  ] as const

  return (
    <motion.div
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`flex items-center gap-1 backdrop-blur-2xl rounded-3xl border px-3 py-3 shadow-2xl ${
        darkMode 
          ? 'bg-black/30 border-white/20 shadow-black/50' 
          : 'bg-white/80 border-gray-200 shadow-black/10'
      }`}>
        {views.map((item) => {
          const Icon = item.icon
          const isActive = view === item.id
          
          return (
            <motion.button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'text-white shadow-lg' 
                  : darkMode 
                    ? 'text-white/70 hover:text-white hover:bg-white/10' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
              style={{
                backgroundColor: isActive ? item.color : 'transparent',
              }}
              whileHover={{ 
                scale: 1.1,
                y: -2,
                transition: { type: "spring", stiffness: 400, damping: 17 }
              }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon size={20} className="relative z-10" />
              <span className="text-[10px] mt-1 relative z-10 font-semibold">
                {item.label}
              </span>
              
              {isActive && (
                <motion.div
                  className="absolute -top-1 w-1 h-1 bg-white rounded-full shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}

// 3D Glass Card Component
const GlassCard = ({ children, className = "", accentColor, darkMode }: { children: React.ReactNode; className?: string; accentColor?: string; darkMode: boolean }) => (
  <motion.div
    className={`rounded-3xl shadow-2xl backdrop-blur-xl border ${
      darkMode 
        ? 'bg-white/5 border-white/10' 
        : 'bg-white border-gray-200'
    } ${className}`}
    whileHover={{ 
      y: -4,
      transition: { type: "spring", stiffness: 400, damping: 17 }
    }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    style={{
      borderLeftColor: accentColor,
      borderLeftWidth: '4px',
    }}
  >
    {children}
  </motion.div>
)

// Floating Add Recipe Button
const FloatingAddButton = ({ onAdd, darkMode }: { onAdd: () => void; darkMode: boolean }) => (
  <motion.button
    onClick={onAdd}
    className={`fixed top-6 right-6 z-30 p-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${
      darkMode 
        ? 'bg-white/10 border-white/20 text-white shadow-white/10' 
        : 'bg-white border-gray-200 text-gray-700 shadow-black/10'
    }`}
    whileHover={{ scale: 1.05, rotate: 5 }}
    whileTap={{ scale: 0.95 }}
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.2 }}
  >
    <Plus size={24} />
  </motion.button>
)

// Theme Toggle Button
const ThemeToggle = ({ darkMode, toggleDarkMode }: { darkMode: boolean; toggleDarkMode: () => void }) => (
  <motion.button
    onClick={toggleDarkMode}
    className={`fixed top-6 left-6 z-30 p-3 rounded-2xl shadow-2xl backdrop-blur-xl border ${
      darkMode 
        ? 'bg-white/10 border-white/20 text-white shadow-white/10' 
        : 'bg-white border-gray-200 text-gray-700 shadow-black/10'
    }`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    initial={{ opacity: 0, x: -50 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.2 }}
  >
    {darkMode ? <Sun size={20} /> : <Moon size={20} />}
  </motion.button>
)

const GoalsModal = ({
  onClose,
  currentGoals,
  onSave,
  darkMode,
}: {
  onClose: () => void
  currentGoals: DailyGoals
  onSave: (g: DailyGoals) => void
  darkMode: boolean
}) => {
  const [goals, setGoals] = useState<DailyGoals>(currentGoals)
  const handleSave = () => {
    onSave(goals)
    onClose()
  }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <GlassCard darkMode={darkMode} className="p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Set Daily Goals</h3>
          <button onClick={onClose} className={darkMode ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-gray-700'} aria-label="Close">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          {([
            ['Calories', 'calories'],
            ['Protein (g)', 'protein'],
            ['Carbs (g)', 'carbs'],
            ['Fats (g)', 'fats'],
          ] as const).map(([label, key]) => (
            <div key={key}>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white/80' : 'text-gray-700'}`}>{label}</label>
              <input
                type="number"
                inputMode="numeric"
                value={goals[key]}
                onChange={(e) => setGoals({ ...goals, [key]: Number(e.target.value) })}
                className={`w-full p-3 rounded-2xl border backdrop-blur-xl ${
                  darkMode 
                    ? 'bg-white/10 border-white/20 text-white placeholder-white/50' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-green-500 text-white py-3 rounded-2xl hover:bg-green-600 transition-all shadow-lg"
            >
              Save Goals
            </button>
            <button onClick={onClose} className={`flex-1 py-3 rounded-2xl transition-all ${
              darkMode 
                ? 'bg-white/10 text-white hover:bg-white/20' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}>
              Cancel
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

const RecipeForm = ({ onSubmit, onCancel, darkMode }: { onSubmit: (r: any) => void; onCancel: () => void; darkMode: boolean }) => {
  const [formData, setFormData] = useState({
    name: '',
    ingredients: '',
    prep: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
  })

  const handleSubmit = () => {
    const { name, ingredients, prep, calories, protein, carbs, fats } = formData
    if (!name || !ingredients || !prep || !calories || !protein || !carbs || !fats) {
      alert('Please fill in all fields')
      return
    }
    onSubmit({
      name,
      ingredients: ingredients.split(',').map((i) => i.trim()),
      prep,
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fats: Number(fats),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <GlassCard darkMode={darkMode} className="p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Add New Recipe</h3>
          <button onClick={onCancel} className={darkMode ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-gray-700'} aria-label="Close">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Recipe Name"
            className={`w-full p-3 rounded-2xl border backdrop-blur-xl ${
              darkMode 
                ? 'bg-white/10 border-white/20 text-white placeholder-white/50' 
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
            }`}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <textarea
            placeholder="Ingredients (comma separated)"
            className={`w-full p-3 rounded-2xl border backdrop-blur-xl min-h-[80px] ${
              darkMode 
                ? 'bg-white/10 border-white/20 text-white placeholder-white/50' 
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
            }`}
            value={formData.ingredients}
            onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
          />
          <input
            type="text"
            placeholder="Prep Time (e.g., 15 min)"
            className={`w-full p-3 rounded-2xl border backdrop-blur-xl ${
              darkMode 
                ? 'bg-white/10 border-white/20 text-white placeholder-white/50' 
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
            }`}
            value={formData.prep}
            onChange={(e) => setFormData({ ...formData, prep: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            {(['calories', 'protein', 'carbs', 'fats'] as const).map((k) => (
              <input
                key={k}
                type="number"
                placeholder={k[0].toUpperCase() + k.slice(1)}
                className={`p-3 rounded-2xl border backdrop-blur-xl ${
                  darkMode 
                    ? 'bg-white/10 border-white/20 text-white placeholder-white/50' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                }`}
                value={(formData as any)[k]}
                onChange={(e) => setFormData({ ...formData, [k]: e.target.value })}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-blue-500 text-white py-3 rounded-2xl hover:bg-blue-600 transition-all shadow-lg"
            >
              Add Recipe
            </button>
            <button onClick={onCancel} className={`flex-1 py-3 rounded-2xl transition-all ${
              darkMode 
                ? 'bg-white/10 text-white hover:bg-white/20' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}>
              Cancel
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}

const MealSelector = ({
  date,
  mealType,
  onClose,
  recipes,
  onPick,
  mode = 'planner',
  onAddRecipe,
  darkMode,
}: {
  date: string
  mealType: string
  onClose: () => void
  recipes: Recipe[]
  onPick: (recipeId: number, date: string, mealType: string) => void
  mode?: 'planner' | 'log'
  onAddRecipe: () => void
  darkMode: boolean
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <GlassCard darkMode={darkMode} className="p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Select a Recipe for {mealType} {mode === 'log' ? '(Log)' : '(Plan)'}
          </h3>
          <button onClick={onClose} className={darkMode ? 'text-white/70 hover:text-white' : 'text-gray-500 hover:text-gray-700'} aria-label="Close">
            <X size={24} />
          </button>
        </div>
        
        {/* Add Recipe Button inside selector */}
        <div className="mb-4">
          <button
            onClick={onAddRecipe}
            className="w-full bg-green-500 text-white py-3 rounded-2xl hover:bg-green-600 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Create New Recipe
          </button>
        </div>

        <div className="grid gap-3">
          {recipes.map((recipe) => (
            <motion.button
              key={recipe.id}
              onClick={() => onPick(recipe.id, date, mealType)}
              className={`text-left p-4 rounded-2xl border backdrop-blur-xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-all ${
                darkMode 
                  ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                  : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
              }`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{recipe.name}</h4>
                  <p className={`text-sm ${darkMode ? 'text-white/60' : 'text-gray-600'}`}>{recipe.prep}</p>
                </div>
                <div className="text-right text-sm">
                  <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{recipe.calories} cal</div>
                  <div className={darkMode ? 'text-white/60' : 'text-gray-600'}>
                    P: {recipe.protein}g C: {recipe.carbs}g F: {recipe.fats}g
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
        {recipes.length === 0 && (
          <div className="text-center py-8">
            <Book className={`mx-auto mb-2 ${darkMode ? 'text-white/40' : 'text-gray-400'}`} size={48} />
            <p className={darkMode ? 'text-white/60' : 'text-gray-600'}>No recipes found. Create your first recipe!</p>
          </div>
        )}
      </GlassCard>
    </div>
  )
}

// Advanced Nutrition Graph Component
const NutritionRadarChart = ({ nutrition, goals, darkMode }: { nutrition: any; goals: DailyGoals; darkMode: boolean }) => {
  const metrics = [
    { key: 'protein', label: 'Protein', goal: goals.protein, value: nutrition.protein, color: '#A7C7E7' },
    { key: 'carbs', label: 'Carbs', goal: goals.carbs, value: nutrition.carbs, color: '#C8E6C9' },
    { key: 'fats', label: 'Fats', goal: goals.fats, value: nutrition.fats, color: '#FFD6A5' },
    { key: 'calories', label: 'Calories', goal: goals.calories, value: nutrition.calories, color: '#F9D5E5' },
  ]

  const maxValue = Math.max(...metrics.map(m => Math.max(m.goal, m.value)))

  return (
    <div className="w-full h-64 relative">
      <svg width="100%" height="100%" viewBox="0 0 400 400" className="transform -rotate-90">
        {/* Grid circles */}
        {[0.25, 0.5, 0.75, 1].map((radius, i) => (
          <circle
            key={i}
            cx="200"
            cy="200"
            r={radius * 160}
            fill="none"
            stroke={darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            strokeWidth="1"
          />
        ))}
        
        {/* Metric lines and labels */}
        {metrics.map((metric, i) => {
          const angle = (i * 90) * (Math.PI / 180)
          const x1 = 200
          const y1 = 200
          const x2 = 200 + Math.cos(angle) * 180
          const y2 = 200 + Math.sin(angle) * 180
          
          return (
            <g key={metric.key}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
                strokeWidth="1"
              />
              <text
                x={200 + Math.cos(angle) * 200}
                y={200 + Math.sin(angle) * 200}
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${i * 90 + 90} ${200 + Math.cos(angle) * 200} ${200 + Math.sin(angle) * 200})`}
                className={`text-sm font-semibold ${darkMode ? 'text-white/80' : 'text-gray-700'}`}
                fill={darkMode ? 'white' : 'black'}
              >
                {metric.label}
              </text>
            </g>
          )
        })}
        
        {/* Data polygon */}
        <polygon
          points={metrics.map((metric, i) => {
            const angle = (i * 90) * (Math.PI / 180)
            const progress = Math.min(metric.value / metric.goal, 1.5) // Cap at 150% for visualization
            const radius = 160 * progress
            const x = 200 + Math.cos(angle) * radius
            const y = 200 + Math.sin(angle) * radius
            return `${x},${y}`
          }).join(' ')}
          fill="url(#gradient)"
          fillOpacity="0.3"
          stroke="url(#gradient)"
          strokeWidth="3"
        />
        
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A7C7E7" />
            <stop offset="25%" stopColor="#C8E6C9" />
            <stop offset="50%" stopColor="#FFD6A5" />
            <stop offset="75%" stopColor="#F9D5E5" />
            <stop offset="100%" stopColor="#B5EAD7" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Legend */}
      <div className="absolute bottom-0 left-0 right-0 grid grid-cols-2 gap-2 text-xs">
        {metrics.map(metric => (
          <div key={metric.key} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: metric.color }}
            />
            <span className={darkMode ? 'text-white/70' : 'text-gray-600'}>
              {metric.label}: {metric.value}/{metric.goal}g
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// -------------------- MAIN APP --------------------
export default function MealPlannerApp({ user, demo = false }: Props) {
  const [darkMode, setDarkMode] = useState(true)
  const [view, setView] = useState<'today' | 'planner' | 'recipes' | 'shopping' | 'nutrition' | 'diary'>('today')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [meals, setMeals] = useState<Record<string, Recipe[]>>({})
  const [mealLogs, setMealLogs] = useState<MealLog[]>([])
  const [loggedMeals, setLoggedMeals] = useState<Record<string, Recipe[]>>({})
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [showAddRecipe, setShowAddRecipe] = useState(false)
  const [showAddMeal, setShowAddMeal] = useState(false)
  const [showLogMeal, setShowLogMeal] = useState(false)
  const [selectedMealType, setSelectedMealType] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showGoalsModal, setShowGoalsModal] = useState(false)
  const [dailyGoals, setDailyGoals] = useState<DailyGoals>({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fats: 65,
  })
  const today = new Date().toISOString().split('T')[0]
  const colors = darkMode ? darkColors : lightColors

  // Enhanced sample recipes
  const sampleRecipes: Recipe[] = [
    {
      id: 1,
      name: 'Greek Yogurt Bowl',
      ingredients: ['Greek yogurt', 'Mixed berries', 'Granola', 'Honey', 'Chia seeds'],
      prep: '5 min',
      calories: 320,
      protein: 25,
      carbs: 45,
      fats: 8,
      favorite: false,
    },
    {
      id: 2,
      name: 'Grilled Chicken Salad',
      ingredients: ['Chicken breast', 'Mixed greens', 'Cherry tomatoes', 'Cucumber', 'Olive oil', 'Lemon juice'],
      prep: '15 min',
      calories: 420,
      protein: 35,
      carbs: 12,
      fats: 25,
      favorite: false,
    },
    {
      id: 3,
      name: 'Salmon with Roasted Vegetables',
      ingredients: ['Salmon fillet', 'Broccoli', 'Sweet potato', 'Carrots', 'Garlic', 'Olive oil', 'Lemon'],
      prep: '30 min',
      calories: 480,
      protein: 38,
      carbs: 35,
      fats: 22,
      favorite: false,
    },
    {
      id: 4,
      name: 'Protein Smoothie',
      ingredients: ['Protein powder', 'Banana', 'Spinach', 'Almond milk', 'Peanut butter', 'Ice'],
      prep: '5 min',
      calories: 380,
      protein: 32,
      carbs: 28,
      fats: 12,
      favorite: false,
    },
    {
      id: 5,
      name: 'Quinoa Buddha Bowl',
      ingredients: ['Quinoa', 'Avocado', 'Chickpeas', 'Kale', 'Tahini', 'Lemon', 'Pumpkin seeds'],
      prep: '20 min',
      calories: 450,
      protein: 18,
      carbs: 65,
      fats: 16,
      favorite: false,
    }
  ]

  // demo vs authed
  const isDemo = !user || demo

  // Load data
  useEffect(() => {
    if (isDemo) {
      const savedMeals = localStorage.getItem('mealPlans')
      const savedLogs = localStorage.getItem('mealLogs')
      const savedRecipes = localStorage.getItem('recipes')
      const savedDarkMode = localStorage.getItem('darkMode')
      
      if (savedDarkMode) setDarkMode(JSON.parse(savedDarkMode))
      if (savedMeals) setMeals(JSON.parse(savedMeals))
      if (savedLogs) setMealLogs(JSON.parse(savedLogs))
      if (savedRecipes) {
        setRecipes(JSON.parse(savedRecipes))
      } else {
        setRecipes(sampleRecipes)
        localStorage.setItem('recipes', JSON.stringify(sampleRecipes))
      }
      return
    }
  }, [isDemo, user])

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  // Process meal logs into a usable format
  useEffect(() => {
    const processed: Record<string, Recipe[]> = {}
    mealLogs.forEach(log => {
      const recipe = recipes.find(r => r.id === log.recipeId)
      if (recipe) {
        const key = `${log.date}-${log.mealType}`
        if (!processed[key]) processed[key] = []
        processed[key].push(recipe)
      }
    })
    setLoggedMeals(processed)
  }, [mealLogs, recipes])

  // Save data
  useEffect(() => {
    if (isDemo) {
      localStorage.setItem('mealPlans', JSON.stringify(meals))
      localStorage.setItem('mealLogs', JSON.stringify(mealLogs))
      localStorage.setItem('recipes', JSON.stringify(recipes))
    }
  }, [isDemo, meals, mealLogs, recipes])

  // Helper functions
  const getWeekDates = useCallback(() => {
    const curr = new Date(selectedDate)
    const week: string[] = []
    curr.setDate(curr.getDate() - curr.getDay())
    for (let i = 0; i < 7; i++) {
      const date = new Date(curr)
      date.setDate(date.getDate() + i)
      week.push(date.toISOString().split('T')[0])
    }
    return week
  }, [selectedDate])

  const addMealToPlan = useCallback(
    (recipeId: number, date: string, mealType: string) => {
      const recipe = recipes.find((r) => r.id === recipeId)
      if (!recipe) return
      const key = `${date}-${mealType}`
      setMeals((prev) => {
        const existingMeals = prev[key] || []
        return { ...prev, [key]: [...existingMeals, recipe] }
      })
      setShowAddMeal(false)
    },
    [recipes]
  )

  const logMeal = useCallback(
    (recipeId: number, date: string, mealType: string) => {
      const newLog: MealLog = {
        id: Date.now(),
        recipeId,
        date,
        mealType,
        timestamp: Date.now(),
        inDiary: false,
      }
      setMealLogs(prev => [...prev, newLog])
      setShowLogMeal(false)
    },
    []
  )

  // Fixed: Single button to add all today's meals to diary
  const addTodayToDiary = useCallback(() => {
    setMealLogs(prev => prev.map(log => 
      log.date === today ? { ...log, inDiary: true } : log
    ))
  }, [today])

  const removeMealFromPlan = useCallback((date: string, mealType: string, index: number) => {
    const key = `${date}-${mealType}`
    setMeals((prev) => {
      const existingMeals = prev[key] || []
      const updated = { ...prev }
      const newMeals = existingMeals.filter((_, i) => i !== index)
      if (newMeals.length === 0) delete updated[key]
      else updated[key] = newMeals
      return updated
    })
  }, [])

  const removeLoggedMeal = useCallback((logId: number) => {
    setMealLogs(prev => prev.filter(log => log.id !== logId))
  }, [])

  const addRecipe = useCallback((recipe: any) => {
    const newRecipe: Recipe = { ...recipe, id: Date.now(), favorite: false }
    setRecipes((prev) => [...prev, newRecipe])
    setShowAddRecipe(false)
  }, [])

  const toggleFavorite = useCallback((recipeId: number) => {
    setRecipes((prev) => prev.map((r) => (r.id === recipeId ? { ...r, favorite: !r.favorite } : r)))
  }, [])

  const deleteRecipe = useCallback((recipeId: number) => {
    setRecipes((prev) => prev.filter((r) => r.id !== recipeId))
  }, [])

  const getDailyNutrition = useCallback(
    (date: string, source: 'planner' | 'log' = 'log') => {
      const totals = { calories: 0, protein: 0, carbs: 0, fats: 0 }
      const mealSource = source === 'planner' ? meals : loggedMeals
      
      ;(['breakfast', 'lunch', 'dinner', 'snack'] as const).forEach((mealType) => {
        const mealList = mealSource[`${date}-${mealType}`] || []
        mealList.forEach((meal) => {
          totals.calories += meal.calories
          totals.protein += meal.protein
          totals.carbs += meal.carbs
          totals.fats += meal.fats
        })
      })
      return totals
    },
    [meals, loggedMeals]
  )

  const getShoppingList = useCallback(() => {
    const ingredients = new Set<string>()
    getWeekDates().forEach((date) => {
      ;(['breakfast', 'lunch', 'dinner', 'snack'] as const).forEach((mealType) => {
        const mealList = meals[`${date}-${mealType}`] || []
        mealList.forEach((meal) => {
          meal.ingredients.forEach((ing) => ingredients.add(ing))
        })
      })
    })
    return Array.from(ingredients)
  }, [meals, getWeekDates])

  const getWeeklyStats = useCallback(() => {
    const weekDates = getWeekDates()
    const weekTotals = { calories: 0, protein: 0, carbs: 0, fats: 0 }
    const dailyData = weekDates.map((date) => {
      const nutrition = getDailyNutrition(date, 'log')
      weekTotals.calories += nutrition.calories
      weekTotals.protein += nutrition.protein
      weekTotals.carbs += nutrition.carbs
      weekTotals.fats += nutrition.fats
      return { date, ...nutrition }
    })
    const avgCalories = Math.round(weekTotals.calories / 7)
    const avgProtein = Math.round(weekTotals.protein / 7)
    const daysOnTrack = dailyData.filter((d) => d.protein >= dailyGoals.protein * 0.9).length
    return { dailyData, avgCalories, avgProtein, daysOnTrack }
  }, [getWeekDates, getDailyNutrition, dailyGoals.protein])

  const todayNutrition = getDailyNutrition(today, 'log')
  const proteinPercent = Math.min((todayNutrition.protein / dailyGoals.protein) * 100, 100)
  const caloriesPercent = Math.min((todayNutrition.calories / dailyGoals.calories) * 100, 100)
  const carbsFatsPercent = Math.min(
    ((todayNutrition.carbs / dailyGoals.carbs + todayNutrition.fats / dailyGoals.fats) / 2) * 100,
    100
  )

  const filteredRecipes = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return recipes.filter(
      (r) => r.name.toLowerCase().includes(q) || r.ingredients.some((ing) => ing.toLowerCase().includes(q))
    )
  }, [recipes, searchQuery])

  // Fixed: Safe diary meals calculation
  const diaryMeals = useMemo(() => {
    return mealLogs
      .filter(log => log.inDiary)
      .map(log => {
        const recipe = recipes.find(r => r.id === log.recipeId)
        return recipe ? { log, recipe } : null
      })
      .filter(Boolean) as { log: MealLog; recipe: Recipe }[]
  }, [mealLogs, recipes])

  return (
    <LayoutShell 
      title="Meal Planner & Tracker" 
      actions={<InstallButton variant="ghost" size="sm" />}
      className={darkMode ? 'dark' : ''}
    >
      <div 
        className={`pb-24 min-h-screen transition-colors duration-300 ${
          darkMode 
            ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900' 
            : 'bg-gradient-to-br from-blue-50 via-rose-50 to-amber-50'
        }`}
      >
        {/* Theme Toggle */}
        <ThemeToggle darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />
        
        {/* Floating Add Recipe Button - Always visible */}
        <FloatingAddButton onAdd={() => setShowAddRecipe(true)} darkMode={darkMode} />

        {/* VIEWS */}
        <AnimatePresence mode="wait">
          {view === 'today' && (
            <motion.div
              key="today"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8 p-6"
            >
              {/* Progress Rings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <GlassCard darkMode={darkMode} className="p-8 flex flex-col items-center justify-center" accentColor={colors.sections.today}>
                  <div className="mb-6 text-center">
                    <h2 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Today's Progress</h2>
                    <p className={darkMode ? 'text-white/60' : 'text-gray-600'}>
                      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                  </div>

                  <div className="relative flex items-center justify-center mb-8" style={{ width: 320, height: 320 }}>
                    <div className="absolute">
                      <AppleRing percentage={proteinPercent} size={300} strokeWidth={22} gradient={['#A7C7E7', '#95B9DC']} icon={Target} darkMode={darkMode} />
                    </div>
                    <div className="absolute">
                      <AppleRing percentage={caloriesPercent} size={230} strokeWidth={22} gradient={['#FFD6A5', '#FFC88B']} icon={Flame} darkMode={darkMode} />
                    </div>
                    <div className="absolute">
                      <AppleRing percentage={carbsFatsPercent} size={160} strokeWidth={22} gradient={['#C8E6C9', '#B7DBB8']} icon={Award} darkMode={darkMode} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-400">{todayNutrition.protein}g</div>
                      <div className={darkMode ? 'text-sm text-white/60' : 'text-sm text-gray-600'}>Protein</div>
                      <div className={darkMode ? 'text-xs text-white/40' : 'text-xs text-gray-500'}>of {dailyGoals.protein}g</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-400">{todayNutrition.calories}</div>
                      <div className={darkMode ? 'text-sm text-white/60' : 'text-sm text-gray-600'}>Calories</div>
                      <div className={darkMode ? 'text-xs text-white/40' : 'text-xs text-gray-500'}>of {dailyGoals.calories}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-400">
                        {todayNutrition.carbs}g / {todayNutrition.fats}g
                      </div>
                      <div className={darkMode ? 'text-sm text-white/60' : 'text-sm text-gray-600'}>Carbs / Fats</div>
                      <div className={darkMode ? 'text-xs text-white/40' : 'text-xs text-gray-500'}>
                        {dailyGoals.carbs}g / {dailyGoals.fats}g
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowGoalsModal(true)}
                      className="bg-blue-500 text-white px-6 py-3 rounded-2xl hover:bg-blue-600 transition-all shadow-lg"
                    >
                      Edit Goals
                    </button>
                    <button
                      onClick={addTodayToDiary}
                      className="bg-pink-500 text-white px-6 py-3 rounded-2xl hover:bg-pink-600 transition-all shadow-lg flex items-center gap-2"
                    >
                      <Heart size={16} />
                      Save to Diary
                    </button>
                  </div>
                </GlassCard>

                {/* Today's Meal Log */}
                <GlassCard darkMode={darkMode} className="p-6" accentColor={colors.sections.today}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Today's Meal Log</h3>
                  </div>
                  
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((mealType) => {
                      const mealList = loggedMeals[`${today}-${mealType}`] || []
                      return (
                        <div key={mealType} className={`rounded-2xl p-4 border backdrop-blur-xl ${
                          darkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex justify-between items-center mb-3">
                            <div className={`font-semibold uppercase text-sm ${
                              darkMode ? 'text-green-400' : 'text-green-600'
                            }`}>{mealType}</div>
                            <button
                              onClick={() => {
                                setSelectedDate(today)
                                setSelectedMealType(mealType)
                                setShowLogMeal(true)
                              }}
                              className={`p-2 rounded-xl transition-all ${
                                darkMode 
                                  ? 'bg-white/10 text-white hover:bg-white/20' 
                                  : 'bg-blue-500 text-white hover:bg-blue-600'
                              }`}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          
                          <AnimatePresence>
                            {mealList.length > 0 ? (
                              <div className="space-y-2">
                                {mealList.map((meal, idx) => {
                                  const log = mealLogs.find(l => 
                                    l.date === today && l.mealType === mealType && l.recipeId === meal.id
                                  )
                                  return (
                                    <motion.div
                                      key={log?.id || idx}
                                      className={`flex items-center justify-between p-3 rounded-xl border backdrop-blur-xl ${
                                        darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
                                      }`}
                                      layout
                                      initial={{ opacity: 0, y: 4 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -4 }}
                                    >
                                      <div className="flex-1">
                                        <div className={`font-medium text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>{meal.name}</div>
                                        <div className={darkMode ? 'text-xs text-white/60' : 'text-xs text-gray-600'}>
                                          {meal.calories} cal • {meal.protein}g protein
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => log && removeLoggedMeal(log.id)}
                                        className="text-red-500 hover:text-red-400 ml-2 transition-colors"
                                        aria-label="Remove meal"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </motion.div>
                                  )
                                })}
                              </div>
                            ) : (
                              <motion.div
                                className={`text-center py-6 ${darkMode ? 'text-white/40' : 'text-gray-500'}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                              >
                                <Utensils size={32} className="mx-auto mb-2" />
                                <p className="text-sm">No meals logged yet</p>
                                <button
                                  onClick={() => {
                                    setSelectedDate(today)
                                    setSelectedMealType(mealType)
                                    setShowLogMeal(true)
                                  }}
                                  className={`mt-2 text-sm ${
                                    darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'
                                  }`}
                                >
                                  Log your first meal
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </GlassCard>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard darkMode={darkMode} className="p-6 text-center" accentColor={colors.states.success}>
                  <div className="text-2xl font-bold text-green-400 mb-2">{todayNutrition.protein}g</div>
                  <div className={darkMode ? 'text-white/60 text-sm' : 'text-gray-600 text-sm'}>Protein Today</div>
                </GlassCard>
                <GlassCard darkMode={darkMode} className="p-6 text-center" accentColor={colors.states.warning}>
                  <div className="text-2xl font-bold text-orange-400 mb-2">{todayNutrition.calories}</div>
                  <div className={darkMode ? 'text-white/60 text-sm' : 'text-gray-600 text-sm'}>Calories Today</div>
                </GlassCard>
                <GlassCard darkMode={darkMode} className="p-6 text-center" accentColor={colors.states.info}>
                  <div className="text-2xl font-bold text-blue-400 mb-2">
                    {Math.round((todayNutrition.protein / dailyGoals.protein) * 100)}%
                  </div>
                  <div className={darkMode ? 'text-white/60 text-sm' : 'text-gray-600 text-sm'}>Goal Progress</div>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {view === 'planner' && (
            <motion.div
              key="planner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <div className="mb-6 flex justify-between items-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={`p-3 rounded-2xl border backdrop-blur-xl ${
                    darkMode 
                      ? 'bg-white/10 border-white/20 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                {getWeekDates().map((date) => {
                  const dateObj = new Date(date + 'T00:00:00')
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
                  const dayNum = dateObj.getDate()
                  const isToday = date === today

                  return (
                    <GlassCard key={date} className="p-4" darkMode={darkMode} accentColor={colors.sections.planner}>
                      <div className="text-center mb-4">
                        <div className={`font-semibold ${isToday ? 'text-green-400' : darkMode ? 'text-white/60' : 'text-gray-600'}`}>{dayName}</div>
                        <div className={`text-2xl font-bold ${isToday ? (darkMode ? 'text-white' : 'text-gray-900') : darkMode ? 'text-white/80' : 'text-gray-800'}`}>{dayNum}</div>
                      </div>

                      {(['breakfast', 'lunch', 'dinner'] as const).map((mealType) => {
                        const mealList = meals[`${date}-${mealType}`] || []
                        return (
                          <div key={mealType} className="mb-3 last:mb-0">
                            <div className={`text-xs font-semibold uppercase mb-2 ${darkMode ? 'text-white/60' : 'text-gray-600'}`}>{mealType}</div>
                            <AnimatePresence>
                              {mealList.map((meal, idx) => (
                                <motion.div
                                  key={`${meal.name}-${idx}`}
                                  className={`p-2 rounded-xl text-sm relative group border mb-1 ${
                                    darkMode ? 'bg-green-500/20 border-green-500/30' : 'bg-green-100 border-green-200'
                                  }`}
                                  layout
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                >
                                  <div className={`font-medium text-xs ${darkMode ? 'text-white' : 'text-gray-900'}`}>{meal.name}</div>
                                  <div className={`text-xs ${darkMode ? 'text-white/60' : 'text-gray-600'}`}>{meal.calories} cal</div>
                                  <button
                                    onClick={() => removeMealFromPlan(date, mealType, idx)}
                                    className="absolute top-1 right-1 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="Remove"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                            <button
                              onClick={() => {
                                setSelectedDate(date)
                                setSelectedMealType(mealType)
                                setShowAddMeal(true)
                              }}
                              className={`w-full mt-1 border-2 border-dashed rounded-xl p-2 transition-colors ${
                                darkMode 
                                  ? 'border-white/20 text-white/60 hover:border-green-400 hover:text-green-400' 
                                  : 'border-gray-300 text-gray-500 hover:border-green-400 hover:text-green-600'
                              }`}
                              aria-label={`Add ${mealType} on ${date}`}
                            >
                              <Plus size={16} className="mx-auto" />
                            </button>
                          </div>
                        )
                      })}
                    </GlassCard>
                  )
                })}
              </div>
            </motion.div>
          )}

          {view === 'recipes' && (
            <motion.div
              key="recipes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <div className="mb-6 flex gap-4">
                <div className="flex-1 relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-white/60' : 'text-gray-500'}`} size={20} />
                  <input
                    type="text"
                    placeholder="Search recipes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-2xl border backdrop-blur-xl ${
                      darkMode 
                        ? 'bg-white/10 border-white/20 text-white placeholder-white/50' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>
              </div>

              {filteredRecipes.length === 0 ? (
                <GlassCard darkMode={darkMode} className="p-8 text-center" accentColor={colors.sections.recipes}>
                  <EmptyState
                    icon={Book}
                    title="No recipes found"
                    hint="Try a different search or add a new recipe."
                    darkMode={darkMode}
                    cta={
                      <button
                        onClick={() => setShowAddRecipe(true)}
                        className="px-6 py-3 rounded-2xl bg-green-500 text-white hover:bg-green-600 transition-all shadow-lg"
                      >
                        Add Your First Recipe
                      </button>
                    }
                  />
                </GlassCard>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredRecipes.map((recipe) => (
                    <GlassCard key={recipe.id} className="p-6" darkMode={darkMode} accentColor={colors.sections.recipes}>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{recipe.name}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleFavorite(recipe.id)}
                            className={`p-2 rounded-xl transition-all ${
                              recipe.favorite 
                                ? 'text-yellow-400 bg-yellow-400/20' 
                                : darkMode 
                                  ? 'text-white/60 bg-white/10 hover:bg-white/20' 
                                  : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                            }`}
                            aria-label={recipe.favorite ? 'Unfavorite' : 'Favorite'}
                          >
                            <Star size={18} fill={recipe.favorite ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            onClick={() => deleteRecipe(recipe.id)}
                            className={`p-2 rounded-xl transition-all ${
                              darkMode 
                                ? 'text-red-400 bg-white/10 hover:bg-red-400/20' 
                                : 'text-red-500 bg-gray-100 hover:bg-red-50'
                            }`}
                            aria-label="Delete recipe"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <p className={`text-sm mb-4 ${darkMode ? 'text-white/60' : 'text-gray-600'}`}>{recipe.prep}</p>
                      <div className="mb-4">
                        <div className={`text-xs mb-2 ${darkMode ? 'text-white/40' : 'text-gray-500'}`}>Ingredients:</div>
                        <div className={`text-sm ${darkMode ? 'text-white/80' : 'text-gray-700'}`}>{recipe.ingredients.join(', ')}</div>
                      </div>
                      <div className={`border-t pt-4 grid grid-cols-2 gap-3 text-sm ${
                        darkMode ? 'border-white/20' : 'border-gray-200'
                      }`}>
                        <div className="text-center">
                          <div className={darkMode ? 'text-white/40 text-xs' : 'text-gray-500 text-xs'}>Calories</div>
                          <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{recipe.calories}</div>
                        </div>
                        <div className="text-center">
                          <div className={darkMode ? 'text-white/40 text-xs' : 'text-gray-500 text-xs'}>Protein</div>
                          <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{recipe.protein}g</div>
                        </div>
                        <div className="text-center">
                          <div className={darkMode ? 'text-white/40 text-xs' : 'text-gray-500 text-xs'}>Carbs</div>
                          <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{recipe.carbs}g</div>
                        </div>
                        <div className="text-center">
                          <div className={darkMode ? 'text-white/40 text-xs' : 'text-gray-500 text-xs'}>Fats</div>
                          <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{recipe.fats}g</div>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === 'shopping' && (
            <motion.div
              key="shopping"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <GlassCard darkMode={darkMode} className="p-6" accentColor={colors.sections.shopping}>
                <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Weekly Shopping List</h2>
                <div className={`text-sm mb-4 ${darkMode ? 'text-white/60' : 'text-gray-600'}`}>Based on your meal plan for the week</div>

                {getShoppingList().length === 0 ? (
                  <EmptyState
                    icon={ShoppingCart}
                    title="No items yet"
                    hint="Add meals to your planner to generate a shopping list."
                    darkMode={darkMode}
                    cta={
                      <button
                        onClick={() => setView('planner')}
                        className="px-3 py-1.5 rounded-control bg-blue-500 text-white hover:bg-blue-600"
                      >
                        Open Planner
                      </button>
                    }
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {getShoppingList().map((item, idx) => (
                      <label
                        key={idx}
                        className={`flex items-center gap-2 p-2 rounded-control cursor-pointer transition-colors ${
                          darkMode 
                            ? 'bg-white/5 border border-white/10 hover:bg-white/10' 
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <input type="checkbox" className="w-4 h-4 text-blue-500" />
                        <span className={darkMode ? 'text-white/80' : 'text-gray-700'}>{item}</span>
                      </label>
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}

          {view === 'nutrition' && (
            <motion.div
              key="nutrition"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 p-6"
            >
              {(() => {
                const { dailyData, avgCalories, avgProtein, daysOnTrack } = getWeeklyStats()
                const maxCalories = Math.max(...dailyData.map((d) => d.calories), dailyGoals.calories)

                return (
                  <>
                    {/* Stats cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <GlassCard darkMode={darkMode} className="p-6 text-center" accentColor={colors.states.success}>
                        <div className="flex items-center gap-3 mb-2">
                          <Target size={32} className="text-green-400" />
                          <div>
                            <div className={darkMode ? 'text-sm text-white/60' : 'text-sm text-gray-600'}>Avg Protein</div>
                            <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{avgProtein}g</div>
                          </div>
                        </div>
                        <div className={darkMode ? 'text-sm text-white/40' : 'text-sm text-gray-500'}>Goal: {dailyGoals.protein}g</div>
                      </GlassCard>

                      <GlassCard darkMode={darkMode} className="p-6 text-center" accentColor={colors.states.warning}>
                        <div className="flex items-center gap-3 mb-2">
                          <Flame size={32} className="text-orange-400" />
                          <div>
                            <div className={darkMode ? 'text-sm text-white/60' : 'text-sm text-gray-600'}>Avg Calories</div>
                            <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{avgCalories}</div>
                          </div>
                        </div>
                        <div className={darkMode ? 'text-sm text-white/40' : 'text-sm text-gray-500'}>Goal: {dailyGoals.calories}</div>
                      </GlassCard>

                      <GlassCard darkMode={darkMode} className="p-6 text-center" accentColor={colors.states.info}>
                        <div className="flex items-center gap-3 mb-2">
                          <Award size={32} className="text-blue-400" />
                          <div>
                            <div className={darkMode ? 'text-sm text-white/60' : 'text-sm text-gray-600'}>Days On Track</div>
                            <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{daysOnTrack}/7</div>
                          </div>
                        </div>
                        <div className={darkMode ? 'text-sm text-white/40' : 'text-sm text-gray-500'}>90%+ protein goal</div>
                      </GlassCard>

                      <GlassCard darkMode={darkMode} className="p-6 text-center" accentColor={colors.sections.nutrition}>
                        <div className="flex items-center gap-3 mb-2">
                          <TrendingUp size={32} className="text-yellow-400" />
                          <div>
                            <div className={darkMode ? 'text-sm text-white/60' : 'text-sm text-gray-600'}>Weekly Progress</div>
                            <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{Math.round((daysOnTrack / 7) * 100)}%</div>
                          </div>
                        </div>
                        <div className={darkMode ? 'text-sm text-white/40' : 'text-sm text-gray-500'}>Weekly goal achievement</div>
                      </GlassCard>
                    </div>

                    {/* Advanced Nutrition Radar Chart */}
                    <GlassCard darkMode={darkMode} className="p-6" accentColor={colors.sections.nutrition}>
                      <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Macro Nutrient Balance</h3>
                      <NutritionRadarChart nutrition={todayNutrition} goals={dailyGoals} darkMode={darkMode} />
                    </GlassCard>

                    {/* Daily calories bars */}
                    <GlassCard darkMode={darkMode} className="p-6" accentColor={colors.sections.nutrition}>
                      <h3 className={`text-xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Daily Calorie Intake</h3>
                      <div className="space-y-4">
                        {dailyData.map((day) => {
                          const dateObj = new Date(day.date + 'T00:00:00')
                          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                          const barWidth = (day.calories / maxCalories) * 100
                          const isOnTrack = day.protein >= dailyGoals.protein * 0.9

                          return (
                            <div key={day.date}>
                              <div className="flex items-center justify-between mb-1">
                                <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{dayName}</span>
                                <span className={`text-sm ${darkMode ? 'text-white/60' : 'text-gray-600'}`}>{day.calories} cal</span>
                              </div>
                              <div className={`relative h-8 rounded-full overflow-hidden ${
                                darkMode ? 'bg-white/10' : 'bg-gray-100'
                              }`}>
                                <motion.div
                                  className={`h-full rounded-full ${
                                    isOnTrack
                                      ? 'bg-gradient-to-r from-green-500 to-green-400'
                                      : 'bg-gradient-to-r from-gray-400 to-gray-300'
                                  }`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${barWidth}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                                {day.calories > 0 && (
                                  <div className="absolute inset-0 flex items-center px-3 text-xs font-medium text-white">
                                    P: {day.protein}g • C: {day.carbs}g • F: {day.fats}g
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                        <div className="w-3 h-3 border-2 border-dashed border-green-400 rounded" />
                        <span className={darkMode ? 'text-white/60' : 'text-gray-600'}>Daily Goal: {dailyGoals.calories} cal</span>
                      </div>
                    </GlassCard>
                  </>
                )
              })()}
            </motion.div>
          )}

          {view === 'diary' && (
            <motion.div
              key="diary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <GlassCard darkMode={darkMode} className="p-6" accentColor={colors.sections.diary}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Food Diary</h2>
                  <div className={darkMode ? 'text-white/60 text-sm' : 'text-gray-600 text-sm'}>
                    {diaryMeals.length} saved {diaryMeals.length === 1 ? 'meal' : 'meals'}
                  </div>
                </div>

                {diaryMeals.length === 0 ? (
                  <EmptyState
                    icon={Heart}
                    title="No meals in diary yet"
                    hint="Click 'Save to Diary' in Today's view to add meals."
                    darkMode={darkMode}
                    cta={
                      <button
                        onClick={() => setView('today')}
                        className="px-3 py-1.5 rounded-control bg-pink-500 text-white hover:bg-pink-600"
                      >
                        Go to Today
                      </button>
                    }
                  />
                ) : (
                  <div className="space-y-4">
                    {diaryMeals.map(({ log, recipe }) => (
                      <motion.div
                        key={log.id}
                        className={`flex items-center justify-between p-4 rounded-2xl border backdrop-blur-xl shadow-sm ${
                          darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'
                        }`}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{recipe.name}</h4>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              darkMode ? 'bg-pink-500/20 text-pink-300' : 'bg-pink-100 text-pink-700'
                            }`}>
                              {log.mealType}
                            </span>
                            <span className={darkMode ? 'text-xs text-white/50' : 'text-xs text-gray-500'}>
                              {new Date(log.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                          <div className={darkMode ? 'text-sm text-white/60' : 'text-sm text-gray-600'}>
                            {recipe.calories} cal • {recipe.protein}g protein • {recipe.carbs}g carbs • {recipe.fats}g fats
                          </div>
                          <div className={`text-xs mt-1 ${darkMode ? 'text-white/40' : 'text-gray-500'}`}>
                            Prep: {recipe.prep} • Ingredients: {recipe.ingredients.join(', ')}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setMealLogs(prev => prev.map(l => 
                                l.id === log.id ? { ...l, inDiary: false } : l
                              ))
                            }}
                            className={`p-2 rounded-xl transition-colors ${
                              darkMode 
                                ? 'text-red-400 bg-white/10 hover:bg-red-400/20' 
                                : 'text-red-500 bg-gray-100 hover:bg-red-50'
                            }`}
                            aria-label="Remove from diary"
                          >
                            <Heart size={18} fill="currentColor" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Dock */}
      <BottomDock view={view} setView={setView} darkMode={darkMode} />

      {/* Modals */}
      {showAddRecipe && <RecipeForm onSubmit={addRecipe} onCancel={() => setShowAddRecipe(false)} darkMode={darkMode} />}
      {showAddMeal && (
        <MealSelector
          date={selectedDate}
          mealType={selectedMealType}
          recipes={recipes}
          onPick={addMealToPlan}
          mode="planner"
          onAddRecipe={() => {
            setShowAddMeal(false)
            setShowAddRecipe(true)
          }}
          darkMode={darkMode}
          onClose={() => setShowAddMeal(false)}
        />
      )}
      {showLogMeal && (
        <MealSelector
          date={selectedDate}
          mealType={selectedMealType}
          recipes={recipes}
          onPick={logMeal}
          mode="log"
          onAddRecipe={() => {
            setShowLogMeal(false)
            setShowAddRecipe(true)
          }}
          darkMode={darkMode}
          onClose={() => setShowLogMeal(false)}
        />
      )}
      {showGoalsModal && (
        <GoalsModal currentGoals={dailyGoals} onSave={setDailyGoals} onClose={() => setShowGoalsModal(false)} darkMode={darkMode} />
      )}
    </LayoutShell>
  )
}