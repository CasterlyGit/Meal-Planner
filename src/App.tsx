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
} from 'lucide-react'
import { motion, useSpring, useTransform } from 'framer-motion'

import LayoutShell from './ui/LayoutShell'
import TopTabs from './ui/TopTabs'
import Card from './ui/Card'
import EmptyState from './ui/EmptyState'
import Skeleton from './ui/Skeleton'
import useDebounce from './hooks/useDebounce'

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
type Props = { user: any | null; demo?: boolean }

// -------------------- UI BITS --------------------
const AppleRing = ({
  percentage,
  size,
  strokeWidth,
  gradient,
  icon: Icon,
}: {
  percentage: number
  size: number
  strokeWidth: number
  gradient: [string, string]
  icon: React.ComponentType<{ size?: number; className?: string }>
}) => {
  const id = useId()
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI

  // spring for percentage value
  const spring = useSpring(0, { stiffness: 120, damping: 20, mass: 0.4 })

  // update spring whenever percentage changes
  useEffect(() => {
    spring.set(percentage)
  }, [percentage, spring])

  // derive strokeDashoffset from spring (this replaces spring.to(...))
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
          stroke="rgba(255,255,255,0.2)"
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
            filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))',
            strokeDashoffset: dashoffset, // <-- motion value
          }}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <Icon size={size * 0.25} className="text-white" />
      </div>
    </div>
  )
}

const GoalsModal = ({
  onClose,
  currentGoals,
  onSave,
}: {
  onClose: () => void
  currentGoals: DailyGoals
  onSave: (g: DailyGoals) => void
}) => {
  const [goals, setGoals] = useState<DailyGoals>(currentGoals)
  const handleSave = () => {
    onSave(goals)
    onClose()
  }
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white rounded-card p-6 max-w-md w-full"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Set Daily Goals</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type="number"
                inputMode="numeric"
                value={goals[key]}
                onChange={(e) => setGoals({ ...goals, [key]: Number(e.target.value) })}
                className="w-full p-2 border rounded-control"
              />
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-primary text-white py-2 rounded-control hover:bg-primary-600"
            >
              Save Goals
            </button>
            <button onClick={onClose} className="flex-1 bg-gray-200 py-2 rounded-control hover:bg-gray-300">
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

const RecipeForm = ({ onSubmit, onCancel }: { onSubmit: (r: any) => void; onCancel: () => void }) => {
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
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white rounded-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Add New Recipe</h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700" aria-label="Close">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Recipe Name"
            className="w-full p-2 border rounded-control"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <textarea
            placeholder="Ingredients (comma separated)"
            className="w-full p-2 border rounded-control"
            value={formData.ingredients}
            onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
          />
          <input
            type="text"
            placeholder="Prep Time (e.g., 15 min)"
            className="w-full p-2 border rounded-control"
            value={formData.prep}
            onChange={(e) => setFormData({ ...formData, prep: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            {(['calories', 'protein', 'carbs', 'fats'] as const).map((k) => (
              <input
                key={k}
                type="number"
                placeholder={k[0].toUpperCase() + k.slice(1)}
                className="p-2 border rounded-control"
                value={(formData as any)[k]}
                onChange={(e) => setFormData({ ...formData, [k]: e.target.value })}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-primary text-white py-2 rounded-control hover:bg-primary-600"
            >
              Add Recipe
            </button>
            <button onClick={onCancel} className="flex-1 bg-gray-200 py-2 rounded-control hover:bg-gray-300">
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

const MealSelector = ({
  date,
  mealType,
  onClose,
  recipes,
  onPick,
}: {
  date: string
  mealType: string
  onClose: () => void
  recipes: Recipe[]
  onPick: (recipeId: number, date: string, mealType: string) => void
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        className="bg-white rounded-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Select a Recipe for {mealType}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">
            <X size={24} />
          </button>
        </div>
        <div className="grid gap-3">
          {recipes.map((recipe) => (
            <motion.button
              key={recipe.id}
              onClick={() => onPick(recipe.id, date, mealType)}
              className="text-left p-4 border rounded-card hover:bg-gray-50 cursor-pointer focus:outline-none focus-visible:ring-[var(--ring)] focus-visible:ring-blue-500"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{recipe.name}</h4>
                  <p className="text-sm text-gray-600">{recipe.prep}</p>
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold">{recipe.calories} cal</div>
                  <div className="text-gray-600">
                    P: {recipe.protein}g C: {recipe.carbs}g F: {recipe.fats}g
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

// -------------------- MAIN APP --------------------
export default function MealPlannerApp({ user, demo = false }: Props) {
  const [view, setView] = useState<'today' | 'planner' | 'recipes' | 'shopping' | 'nutrition'>('today')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [meals, setMeals] = useState<Record<string, Recipe[]>>({})
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [showAddRecipe, setShowAddRecipe] = useState(false)
  const [showAddMeal, setShowAddMeal] = useState(false)
  const [selectedMealType, setSelectedMealType] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showGoalsModal, setShowGoalsModal] = useState(false)
  const [dailyGoals, setDailyGoals] = useState<DailyGoals>({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fats: 65,
  })

  // demo vs authed
  const isDemo = !user || demo

  // persist last view & goals
  useEffect(() => {
    const v = localStorage.getItem('view')
    if (v) setView(v as any)
    const savedGoals = localStorage.getItem('dailyGoals')
    if (savedGoals) setDailyGoals(JSON.parse(savedGoals))
  }, [])
  useEffect(() => localStorage.setItem('view', view), [view])
  useEffect(() => localStorage.setItem('dailyGoals', JSON.stringify(dailyGoals)), [dailyGoals])

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isTyping = ['INPUT', 'TEXTAREA'].includes(target?.tagName || '')
      if (e.key === '/' && !isTyping) {
        e.preventDefault()
        const el = document.querySelector<HTMLInputElement>('input[placeholder="Search recipes..."]')
        el?.focus()
      }
      if (e.key === 't') setView('today')
      if (e.key === 'p') setView('planner')
      if (e.key === 'r') setView('recipes')
      if (e.key === 's') setView('shopping')
      if (e.key === 'w') setView('nutrition')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ---------- LOAD ----------
  useEffect(() => {
    if (isDemo) {
      const savedMeals = localStorage.getItem('mealPlans')
      const savedRecipes = localStorage.getItem('recipes')
      if (savedMeals) setMeals(JSON.parse(savedMeals))
      if (savedRecipes) {
        setRecipes(JSON.parse(savedRecipes))
      } else {
        const sampleRecipes: Recipe[] = [
          {
            id: 1,
            name: 'Greek Yogurt Bowl',
            ingredients: ['Greek yogurt', 'Berries', 'Granola', 'Honey'],
            prep: '5 min',
            calories: 320,
            protein: 18,
            carbs: 42,
            fats: 8,
            favorite: false,
          },
          {
            id: 2,
            name: 'Grilled Chicken Salad',
            ingredients: ['Chicken breast', 'Mixed greens', 'Cherry tomatoes', 'Olive oil'],
            prep: '15 min',
            calories: 380,
            protein: 35,
            carbs: 12,
            fats: 22,
            favorite: false,
          },
          {
            id: 3,
            name: 'Salmon with Vegetables',
            ingredients: ['Salmon fillet', 'Broccoli', 'Carrots', 'Lemon'],
            prep: '25 min',
            calories: 450,
            protein: 40,
            carbs: 18,
            fats: 24,
            favorite: false,
          },
        ]
        setRecipes(sampleRecipes)
        localStorage.setItem('recipes', JSON.stringify(sampleRecipes))
      }
      return
    }

    if (!user) return
    ;(async () => {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('meals')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error loading meal plan:', error)
        return
      }

      if (data?.meals) {
        const payload: any = data.meals
        if (payload.meals) setMeals(payload.meals)
        if (payload.recipes) setRecipes(payload.recipes)
      } else {
        const sampleRecipes: Recipe[] = [
          {
            id: 1,
            name: 'Greek Yogurt Bowl',
            ingredients: ['Greek yogurt', 'Berries', 'Granola', 'Honey'],
            prep: '5 min',
            calories: 320,
            protein: 18,
            carbs: 42,
            fats: 8,
            favorite: false,
          },
          {
            id: 2,
            name: 'Grilled Chicken Salad',
            ingredients: ['Chicken breast', 'Mixed greens', 'Cherry tomatoes', 'Olive oil'],
            prep: '15 min',
            calories: 380,
            protein: 35,
            carbs: 12,
            fats: 22,
            favorite: false,
          },
          {
            id: 3,
            name: 'Salmon with Vegetables',
            ingredients: ['Salmon fillet', 'Broccoli', 'Carrots', 'Lemon'],
            prep: '25 min',
            calories: 450,
            protein: 40,
            carbs: 18,
            fats: 24,
            favorite: false,
          },
        ]
        setRecipes(sampleRecipes)
      }
    })()
  }, [isDemo, user])

  // ---------- SAVE (local) ----------
  useEffect(() => {
    if (isDemo) localStorage.setItem('mealPlans', JSON.stringify(meals))
  }, [isDemo, meals])
  useEffect(() => {
    if (isDemo) localStorage.setItem('recipes', JSON.stringify(recipes))
  }, [isDemo, recipes])

  // ---------- SAVE (Supabase, debounced) ----------
  const debouncedMeals = useDebounce(meals, 400)
  const debouncedRecipes = useDebounce(recipes, 400)
  useEffect(() => {
    if (isDemo || !user) return
    const save = async () => {
      const payload = { meals: debouncedMeals, recipes: debouncedRecipes }
      const { error } = await supabase
        .from('meal_plans')
        .upsert({ user_id: user.id, title: 'Default', meals: payload }, { onConflict: 'user_id' })
      if (error) console.error('Error saving meal plan:', error)
    }
    save()
  }, [isDemo, user, debouncedMeals, debouncedRecipes])

  // ---------- HELPERS ----------
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
    (date: string) => {
      const totals = { calories: 0, protein: 0, carbs: 0, fats: 0 }
      ;(['breakfast', 'lunch', 'dinner', 'snack'] as const).forEach((mealType) => {
        const mealList = meals[`${date}-${mealType}`] || []
        mealList.forEach((meal) => {
          totals.calories += meal.calories
          totals.protein += meal.protein
          totals.carbs += meal.carbs
          totals.fats += meal.fats
        })
      })
      return totals
    },
    [meals]
  )

  const calculateStreak = useCallback(
    (weekDates: string[]) => {
      let streak = 0
      for (let i = weekDates.length - 1; i >= 0; i--) {
        const nutrition = getDailyNutrition(weekDates[i])
        if (nutrition.protein >= dailyGoals.protein * 0.9) streak++
        else break
      }
      return streak
    },
    [dailyGoals.protein, getDailyNutrition]
  )

  const weekDates = useMemo(() => getWeekDates(), [getWeekDates])

  const getWeeklyStats = useCallback(() => {
    const weekTotals = { calories: 0, protein: 0, carbs: 0, fats: 0 }
    const dailyData = weekDates.map((date) => {
      const nutrition = getDailyNutrition(date)
      weekTotals.calories += nutrition.calories
      weekTotals.protein += nutrition.protein
      weekTotals.carbs += nutrition.carbs
      weekTotals.fats += nutrition.fats
      return { date, ...nutrition }
    })
    const avgCalories = Math.round(weekTotals.calories / 7)
    const avgProtein = Math.round(weekTotals.protein / 7)
    const daysOnTrack = dailyData.filter((d) => d.protein >= dailyGoals.protein * 0.9).length
    const streak = calculateStreak(weekDates)
    return { dailyData, avgCalories, avgProtein, daysOnTrack, streak }
  }, [weekDates, getDailyNutrition, dailyGoals.protein, calculateStreak])

  const filteredRecipes = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return recipes.filter(
      (r) => r.name.toLowerCase().includes(q) || r.ingredients.some((ing) => ing.toLowerCase().includes(q))
    )
  }, [recipes, searchQuery])

  const getShoppingList = useCallback(() => {
    const ingredients = new Set<string>()
    weekDates.forEach((date) => {
      ;(['breakfast', 'lunch', 'dinner', 'snack'] as const).forEach((mealType) => {
        const mealList = meals[`${date}-${mealType}`] || []
        mealList.forEach((meal) => {
          meal.ingredients.forEach((ing) => ingredients.add(ing))
        })
      })
    })
    return Array.from(ingredients)
  }, [meals, weekDates])

  // -------------------- RENDER --------------------
  const today = new Date().toISOString().split('T')[0]
  const todayNutrition = getDailyNutrition(today)
  const proteinPercent = Math.min((todayNutrition.protein / dailyGoals.protein) * 100, 100)
  const caloriesPercent = Math.min((todayNutrition.calories / dailyGoals.calories) * 100, 100)
  const carbsFatsPercent = Math.min(
    ((todayNutrition.carbs / dailyGoals.carbs + todayNutrition.fats / dailyGoals.fats) / 2) * 100,
    100
  )

  return (
    <LayoutShell title="Meal Planner & Tracker">
      {/* NAV */}
      <div className="mb-3 border-b border-on-outline/30 pb-2">
        <TopTabs view={view} setView={setView} />
      </div>

      {/* VIEWS */}
      {view === 'today' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Rings + summary */}
          <div className="flex flex-col items-center justify-center min-h-[500px]">
            <div className="mb-4 text-center">
              <h2 className="text-3xl font-bold">Today's Progress</h2>
              <p className="text-on-muted">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
            </div>

            <div className="relative flex items-center justify-center" style={{ width: 320, height: 320 }}>
              <div className="absolute">
                <AppleRing percentage={proteinPercent} size={300} strokeWidth={22} gradient={['#7FFF00', '#00FF7F']} icon={Target} />
              </div>
              <div className="absolute">
                <AppleRing percentage={caloriesPercent} size={230} strokeWidth={22} gradient={['#FF006E', '#FFBE0B']} icon={Flame} />
              </div>
              <div className="absolute">
                <AppleRing percentage={carbsFatsPercent} size={160} strokeWidth={22} gradient={['#00D9FF', '#7B2CBF']} icon={Award} />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">{todayNutrition.protein}g</div>
                <div className="text-sm text-on-muted">Protein</div>
                <div className="text-xs text-on-muted">of {dailyGoals.protein}g</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">{todayNutrition.calories}</div>
                <div className="text-sm text-on-muted">Calories</div>
                <div className="text-xs text-on-muted">of {dailyGoals.calories}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">
                  {todayNutrition.carbs}g / {todayNutrition.fats}g
                </div>
                <div className="text-sm text-on-muted">Carbs / Fats</div>
                <div className="text-xs text-on-muted">
                  {dailyGoals.carbs}g / {dailyGoals.fats}g
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowGoalsModal(true)}
              className="mt-6 bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-600 transition-colors"
            >
              Edit Goals
            </button>
          </div>

          {/* Today's meals */}
          <Card className="p-6 max-h-[600px] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Today's Meals</h3>
            <div className="space-y-3">
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((mealType) => {
                const mealList = meals[`${today}-${mealType}`] || []
                return (
                  <div key={mealType} className="bg-surface-3 rounded-card p-4 border border-on-outline/20">
                    <div className="font-semibold text-green-400 uppercase text-sm mb-2">{mealType}</div>
                    {mealList.length > 0 ? (
                      <div className="space-y-2">
                        {mealList.map((meal, idx) => (
                          <motion.div
                            key={`${meal.name}-${idx}`}
                            className="flex items-center justify-between bg-surface-2 p-2 rounded-control"
                            layout
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <div className="flex-1">
                              <div className="font-medium text-sm">{meal.name}</div>
                              <div className="text-xs text-on-muted">
                                {meal.calories} cal • {meal.protein}g protein
                              </div>
                            </div>
                            <button
                              onClick={() => removeMealFromPlan(today, mealType, idx)}
                              className="text-red-400 hover:text-red-300 ml-2"
                              aria-label="Remove meal"
                            >
                              <Trash2 size={16} />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-on-muted text-sm">No meals planned</div>
                    )}
                    <button
                      onClick={() => {
                        setSelectedDate(today)
                        setSelectedMealType(mealType)
                        setShowAddMeal(true)
                      }}
                      className="mt-2 w-full bg-primary/10 text-primary border border-primary px-3 py-2 rounded-control hover:bg-primary/15 transition-colors flex items-center justify-center gap-2 text-sm"
                    >
                      <Plus size={16} />
                      Add Meal
                    </button>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {view === 'planner' && (
        <div>
          <div className="mb-6 flex justify-between items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2 border rounded-control bg-surface-2 border-on-outline/30"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {weekDates.map((date) => {
              const dateObj = new Date(date + 'T00:00:00')
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
              const dayNum = dateObj.getDate()
              const nutrition = getDailyNutrition(date)

              return (
                <Card key={date} className="p-4">
                  <div className="text-center mb-3">
                    <div className="font-semibold text-on-muted">{dayName}</div>
                    <div className="text-2xl font-bold">{dayNum}</div>
                    <div className="text-xs text-on-muted mt-1">{nutrition.calories} cal</div>
                  </div>

                  {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((mealType) => {
                    const mealList = meals[`${date}-${mealType}`] || []
                    return (
                      <div key={mealType} className="mb-3 last:mb-0">
                        <div className="text-xs font-semibold text-on-muted uppercase mb-1">{mealType}</div>
                        {mealList.length > 0 ? (
                          <div className="space-y-1">
                            {mealList.map((meal, idx) => (
                              <motion.div
                                key={`${meal.name}-${idx}`}
                                className="bg-green-500/15 p-2 rounded-control text-sm relative group border border-green-500/30"
                                layout
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                              >
                                <div className="font-medium text-xs">{meal.name}</div>
                                <div className="text-xs text-on-muted">{meal.calories} cal</div>
                                <button
                                  onClick={() => removeMealFromPlan(date, mealType, idx)}
                                  className="absolute top-1 right-1 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                  aria-label="Remove"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </motion.div>
                            ))}
                          </div>
                        ) : null}
                        <button
                          onClick={() => {
                            setSelectedDate(date)
                            setSelectedMealType(mealType)
                            setShowAddMeal(true)
                          }}
                          className="w-full mt-1 border-2 border-dashed border-on-outline/30 rounded-control p-2 text-on-muted hover:border-primary hover:text-primary transition-colors"
                          aria-label={`Add ${mealType} on ${date}`}
                        >
                          <Plus size={16} className="mx-auto" />
                        </button>
                      </div>
                    )
                  })}
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {view === 'recipes' && (
        <div>
          <div className="mb-6 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-muted" size={20} />
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-control bg-surface-2 border-on-outline/30"
              />
            </div>
            <button
              onClick={() => setShowAddRecipe(true)}
              className="bg-primary text-white px-6 py-2 rounded-control hover:bg-primary-600 flex items-center gap-2"
            >
              <Plus size={20} />
              Add Recipe
            </button>
          </div>

          {filteredRecipes.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                icon={Book}
                title="No recipes found"
                hint="Try a different search or add a new recipe."
                cta={
                  <button
                    onClick={() => setShowAddRecipe(true)}
                    className="px-3 py-1.5 rounded-control bg-primary text-white hover:bg-primary-600"
                  >
                    Add Recipe
                  </button>
                }
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecipes.map((recipe) => (
                <Card key={recipe.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg">{recipe.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleFavorite(recipe.id)}
                        className={`p-1 rounded-control ${recipe.favorite ? 'text-yellow-400' : 'text-on-muted'} hover:bg-surface-3`}
                        aria-label={recipe.favorite ? 'Unfavorite' : 'Favorite'}
                      >
                        <Star size={20} fill={recipe.favorite ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => deleteRecipe(recipe.id)}
                        className="p-1 rounded-control text-red-400 hover:bg-surface-3"
                        aria-label="Delete recipe"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-on-muted mb-2">{recipe.prep}</p>
                  <div className="mb-3">
                    <div className="text-xs text-on-muted mb-1">Ingredients:</div>
                    <div className="text-sm">{recipe.ingredients.join(', ')}</div>
                  </div>
                  <div className="border-t border-on-outline/20 pt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-on-muted">Calories:</span>
                      <span className="font-semibold ml-1">{recipe.calories}</span>
                    </div>
                    <div>
                      <span className="text-on-muted">Protein:</span>
                      <span className="font-semibold ml-1">{recipe.protein}g</span>
                    </div>
                    <div>
                      <span className="text-on-muted">Carbs:</span>
                      <span className="font-semibold ml-1">{recipe.carbs}g</span>
                    </div>
                    <div>
                      <span className="text-on-muted">Fats:</span>
                      <span className="font-semibold ml-1">{recipe.fats}g</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {view === 'shopping' && (
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Weekly Shopping List</h2>
          <div className="text-sm text-on-muted mb-4">Based on your meal plan for the week</div>

          {getShoppingList().length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="No items yet"
              hint="Add meals to your planner to generate a shopping list."
              cta={
                <button
                  onClick={() => setView('planner')}
                  className="px-3 py-1.5 rounded-control bg-primary text-white hover:bg-primary-600"
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
                  className="flex items-center gap-2 p-2 border border-on-outline/30 rounded-control bg-surface-2 cursor-pointer"
                >
                  <input type="checkbox" className="w-4 h-4" />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          )}
        </Card>
      )}

      {view === 'nutrition' && (
        <div className="space-y-6">
          {(() => {
            const { dailyData, avgCalories, avgProtein, daysOnTrack, streak } = getWeeklyStats()
            const maxCalories = Math.max(...dailyData.map((d) => d.calories), dailyGoals.calories)

            return (
              <>
                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <Target size={32} />
                      <div>
                        <div className="text-sm opacity-90">Avg Protein</div>
                        <div className="text-3xl font-bold">{avgProtein}g</div>
                      </div>
                    </div>
                    <div className="text-sm opacity-80">Goal: {dailyGoals.protein}g</div>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-orange-500 to-red-500 text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <Flame size={32} />
                      <div>
                        <div className="text-sm opacity-90">Avg Calories</div>
                        <div className="text-3xl font-bold">{avgCalories}</div>
                      </div>
                    </div>
                    <div className="text-sm opacity-80">Goal: {dailyGoals.calories}</div>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <Award size={32} />
                      <div>
                        <div className="text-sm opacity-90">Days On Track</div>
                        <div className="text-3xl font-bold">{daysOnTrack}/7</div>
                      </div>
                    </div>
                    <div className="text-sm opacity-80">90%+ protein goal</div>
                  </Card>

                  <Card className="p-6 bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp size={32} />
                      <div>
                        <div className="text-sm opacity-90">Current Streak</div>
                        <div className="text-3xl font-bold">{streak} days</div>
                      </div>
                    </div>
                    <div className="text-sm opacity-80">Keep it going!</div>
                  </Card>
                </div>

                {/* Daily calories bars */}
                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-6">Daily Calorie Intake</h3>
                  <div className="space-y-4">
                    {dailyData.map((day) => {
                      const dateObj = new Date(day.date + 'T00:00:00')
                      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                      const barWidth = (day.calories / maxCalories) * 100
                      const isOnTrack = day.protein >= dailyGoals.protein * 0.9

                      return (
                        <div key={day.date}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{dayName}</span>
                            <span className="text-sm text-on-muted">{day.calories} cal</span>
                          </div>
                          <div className="relative h-8 bg-surface-2 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${
                                isOnTrack
                                  ? 'bg-gradient-to-r from-green-500 to-green-400'
                                  : 'bg-gradient-to-r from-gray-600 to-gray-500'
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
                  <div className="mt-4 flex items-center gap-2 text-sm text-on-muted">
                    <div className="w-3 h-3 border-2 border-dashed border-green-400 rounded" />
                    <span>Daily Goal: {dailyGoals.calories} cal</span>
                  </div>
                </Card>

                {/* Macro breakdown */}
                <Card className="p-6">
                  <h3 className="text-xl font-bold mb-6">Weekly Macro Breakdown</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {dailyData.map((day) => {
                      const dateObj = new Date(day.date + 'T00:00:00')
                      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
                      const total = day.protein + day.carbs + day.fats
                      const proteinPercent = total > 0 ? (day.protein / total) * 100 : 0
                      const carbsPercent = total > 0 ? (day.carbs / total) * 100 : 0
                      const fatsPercent = total > 0 ? (day.fats / total) * 100 : 0

                      return (
                        <div key={day.date} className="text-center">
                          <div className="font-semibold mb-2">{dayName}</div>
                          <div className="h-32 w-full bg-surface-2 rounded-lg overflow-hidden flex flex-col">
                            <div className="bg-green-500" style={{ height: `${proteinPercent}%` }} />
                            <div className="bg-orange-500" style={{ height: `${carbsPercent}%` }} />
                            <div className="bg-purple-500" style={{ height: `${fatsPercent}%` }} />
                          </div>
                          <div className="mt-2 text-xs space-y-1">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded" />
                              <span className="text-on-muted">P: {day.protein}g</span>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-3 h-3 bg-orange-500 rounded" />
                              <span className="text-on-muted">C: {day.carbs}g</span>
                            </div>
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-3 h-3 bg-purple-500 rounded" />
                              <span className="text-on-muted">F: {day.fats}g</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              </>
            )
          })()}
        </div>
      )}

      {/* Modals */}
      {showAddRecipe && <RecipeForm onSubmit={addRecipe} onCancel={() => setShowAddRecipe(false)} />}
      {showAddMeal && (
        <MealSelector
          date={selectedDate}
          mealType={selectedMealType}
          recipes={recipes}
          onPick={addMealToPlan}
          onClose={() => setShowAddMeal(false)}
        />
      )}
      {showGoalsModal && (
        <GoalsModal currentGoals={dailyGoals} onSave={setDailyGoals} onClose={() => setShowGoalsModal(false)} />
      )}
    </LayoutShell>
  )
}
