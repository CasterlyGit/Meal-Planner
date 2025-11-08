import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, ShoppingCart, Book, TrendingUp, Search, Star, X, Award, Flame, Target } from 'lucide-react';

export default function MealPlannerApp() {
  const [view, setView] = useState('today');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [meals, setMeals] = useState({});
  const [recipes, setRecipes] = useState([]);
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [dailyGoals, setDailyGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fats: 65
  });

  useEffect(() => {
    const savedGoals = localStorage.getItem('dailyGoals');
    if (savedGoals) setDailyGoals(JSON.parse(savedGoals));
  }, []);

  useEffect(() => {
    localStorage.setItem('dailyGoals', JSON.stringify(dailyGoals));
  }, [dailyGoals]);

  useEffect(() => {
    const savedMeals = localStorage.getItem('mealPlans');
    const savedRecipes = localStorage.getItem('recipes');
    if (savedMeals) setMeals(JSON.parse(savedMeals));
    if (savedRecipes) {
      setRecipes(JSON.parse(savedRecipes));
    } else {
      const sampleRecipes = [
        { id: 1, name: 'Greek Yogurt Bowl', ingredients: ['Greek yogurt', 'Berries', 'Granola', 'Honey'], prep: '5 min', calories: 320, protein: 18, carbs: 42, fats: 8, favorite: false },
        { id: 2, name: 'Grilled Chicken Salad', ingredients: ['Chicken breast', 'Mixed greens', 'Cherry tomatoes', 'Olive oil'], prep: '15 min', calories: 380, protein: 35, carbs: 12, fats: 22, favorite: false },
        { id: 3, name: 'Salmon with Vegetables', ingredients: ['Salmon fillet', 'Broccoli', 'Carrots', 'Lemon'], prep: '25 min', calories: 450, protein: 40, carbs: 18, fats: 24, favorite: false },
      ];
      setRecipes(sampleRecipes);
      localStorage.setItem('recipes', JSON.stringify(sampleRecipes));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('mealPlans', JSON.stringify(meals));
  }, [meals]);

  useEffect(() => {
    localStorage.setItem('recipes', JSON.stringify(recipes));
  }, [recipes]);

  const getWeekDates = () => {
    const curr = new Date(selectedDate);
    const week = [];
    curr.setDate(curr.getDate() - curr.getDay());
    for (let i = 0; i < 7; i++) {
      const date = new Date(curr);
      date.setDate(date.getDate() + i);
      week.push(date.toISOString().split('T')[0]);
    }
    return week;
  };

  const addMealToPlan = (recipeId, date, mealType) => {
    const recipe = recipes.find(r => r.id === recipeId);
    const key = `${date}-${mealType}`;
    
    setMeals(prev => {
      const existingMeals = prev[key] || [];
      return {
        ...prev,
        [key]: [...existingMeals, recipe]
      };
    });
    setShowAddMeal(false);
  };

  const removeMealFromPlan = (date, mealType, index) => {
    const key = `${date}-${mealType}`;
    setMeals(prev => {
      const existingMeals = prev[key] || [];
      const updated = { ...prev };
      const newMeals = existingMeals.filter((_, i) => i !== index);
      if (newMeals.length === 0) {
        delete updated[key];
      } else {
        updated[key] = newMeals;
      }
      return updated;
    });
  };

  const addRecipe = (recipe) => {
    const newRecipe = { ...recipe, id: Date.now(), favorite: false };
    setRecipes(prev => [...prev, newRecipe]);
    setShowAddRecipe(false);
  };

  const toggleFavorite = (recipeId) => {
    setRecipes(prev => prev.map(r => 
      r.id === recipeId ? { ...r, favorite: !r.favorite } : r
    ));
  };

  const deleteRecipe = (recipeId) => {
    setRecipes(prev => prev.filter(r => r.id !== recipeId));
  };

  const getShoppingList = () => {
    const weekDates = getWeekDates();
    const ingredients = new Set();
    weekDates.forEach(date => {
      ['breakfast', 'lunch', 'dinner', 'snack'].forEach(mealType => {
        const mealList = meals[`${date}-${mealType}`] || [];
        mealList.forEach(meal => {
          meal.ingredients.forEach(ing => ingredients.add(ing));
        });
      });
    });
    return Array.from(ingredients);
  };

  const getDailyNutrition = (date) => {
    const totals = { calories: 0, protein: 0, carbs: 0, fats: 0 };
    ['breakfast', 'lunch', 'dinner', 'snack'].forEach(mealType => {
      const mealList = meals[`${date}-${mealType}`] || [];
      mealList.forEach(meal => {
        totals.calories += meal.calories;
        totals.protein += meal.protein;
        totals.carbs += meal.carbs;
        totals.fats += meal.fats;
      });
    });
    return totals;
  };

  const getWeeklyStats = () => {
    const weekDates = getWeekDates();
    const weekTotals = { calories: 0, protein: 0, carbs: 0, fats: 0 };
    const dailyData = weekDates.map(date => {
      const nutrition = getDailyNutrition(date);
      weekTotals.calories += nutrition.calories;
      weekTotals.protein += nutrition.protein;
      weekTotals.carbs += nutrition.carbs;
      weekTotals.fats += nutrition.fats;
      return { date, ...nutrition };
    });
    
    const avgCalories = Math.round(weekTotals.calories / 7);
    const avgProtein = Math.round(weekTotals.protein / 7);
    const daysOnTrack = dailyData.filter(d => d.protein >= dailyGoals.protein * 0.9).length;
    const streak = calculateStreak(weekDates);
    
    return { dailyData, avgCalories, avgProtein, daysOnTrack, streak };
  };

  const calculateStreak = (weekDates) => {
    let streak = 0;
    for (let i = weekDates.length - 1; i >= 0; i--) {
      const nutrition = getDailyNutrition(weekDates[i]);
      if (nutrition.protein >= dailyGoals.protein * 0.9) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const filteredRecipes = recipes.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.ingredients.some(ing => ing.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const AppleRing = ({ percentage, size, strokeWidth, gradient, icon: Icon }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;
    const uniqueId = `gradient-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <defs>
            <linearGradient id={uniqueId} x1="0%" y1="0%" x2="100%" y2="100%">
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
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#${uniqueId})`}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ 
              transition: 'stroke-dashoffset 1s ease-out',
              filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.5))'
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon size={size * 0.25} className="text-white" />
        </div>
      </div>
    );
  };

  const CircularProgress = ({ percentage, size, strokeWidth, color, label, value, goal }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex flex-col items-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dy="0.3em"
            className="transform rotate-90"
            style={{ fontSize: size > 150 ? '24px' : '18px', fontWeight: 'bold', fill: '#1f2937' }}
          >
            {Math.round(percentage)}%
          </text>
        </svg>
        <div className="mt-2 text-center">
          <div className="font-semibold text-gray-700">{label}</div>
          <div className="text-sm text-gray-500">{value} / {goal}</div>
        </div>
      </div>
    );
  };

  const GoalsModal = ({ onClose, currentGoals, onSave }) => {
    const [goals, setGoals] = useState(currentGoals);

    const handleSave = () => {
      onSave(goals);
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Set Daily Goals</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
              <input
                type="number"
                value={goals.calories}
                onChange={(e) => setGoals({...goals, calories: Number(e.target.value)})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
              <input
                type="number"
                value={goals.protein}
                onChange={(e) => setGoals({...goals, protein: Number(e.target.value)})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
              <input
                type="number"
                value={goals.carbs}
                onChange={(e) => setGoals({...goals, carbs: Number(e.target.value)})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fats (g)</label>
              <input
                type="number"
                value={goals.fats}
                onChange={(e) => setGoals({...goals, fats: Number(e.target.value)})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600">
                Save Goals
              </button>
              <button onClick={onClose} className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const RecipeForm = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
      name: '', ingredients: '', prep: '', calories: '', protein: '', carbs: '', fats: ''
    });

    const handleSubmit = () => {
      if (!formData.name || !formData.ingredients || !formData.prep || !formData.calories || !formData.protein || !formData.carbs || !formData.fats) {
        alert('Please fill in all fields');
        return;
      }
      onSubmit({
        ...formData,
        ingredients: formData.ingredients.split(',').map(i => i.trim()),
        calories: Number(formData.calories),
        protein: Number(formData.protein),
        carbs: Number(formData.carbs),
        fats: Number(formData.fats)
      });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Add New Recipe</h3>
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Recipe Name"
              className="w-full p-2 border rounded"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
            <textarea
              placeholder="Ingredients (comma separated)"
              className="w-full p-2 border rounded"
              value={formData.ingredients}
              onChange={(e) => setFormData({...formData, ingredients: e.target.value})}
            />
            <input
              type="text"
              placeholder="Prep Time (e.g., 15 min)"
              className="w-full p-2 border rounded"
              value={formData.prep}
              onChange={(e) => setFormData({...formData, prep: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Calories"
                className="p-2 border rounded"
                value={formData.calories}
                onChange={(e) => setFormData({...formData, calories: e.target.value})}
              />
              <input
                type="number"
                placeholder="Protein (g)"
                className="p-2 border rounded"
                value={formData.protein}
                onChange={(e) => setFormData({...formData, protein: e.target.value})}
              />
              <input
                type="number"
                placeholder="Carbs (g)"
                className="p-2 border rounded"
                value={formData.carbs}
                onChange={(e) => setFormData({...formData, carbs: e.target.value})}
              />
              <input
                type="number"
                placeholder="Fats (g)"
                className="p-2 border rounded"
                value={formData.fats}
                onChange={(e) => setFormData({...formData, fats: e.target.value})}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSubmit} className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600">
                Add Recipe
              </button>
              <button onClick={onCancel} className="flex-1 bg-gray-300 py-2 rounded hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const MealSelector = ({ date, mealType, onClose }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">Select a Recipe for {mealType}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          <div className="grid gap-3">
            {recipes.map(recipe => (
              <div
                key={recipe.id}
                onClick={() => addMealToPlan(recipe.id, date, mealType)}
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{recipe.name}</h4>
                    <p className="text-sm text-gray-600">{recipe.prep}</p>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold">{recipe.calories} cal</div>
                    <div className="text-gray-600">P: {recipe.protein}g C: {recipe.carbs}g F: {recipe.fats}g</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-black bg-opacity-40 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white">Meal Planner & Tracker</h1>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-black bg-opacity-30 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            <button
              onClick={() => setView('today')}
              className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap ${view === 'today' ? 'border-b-2 border-green-400 text-green-400' : 'text-gray-400'}`}
            >
              <TrendingUp size={20} />
              Today
            </button>
            <button
              onClick={() => setView('planner')}
              className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap ${view === 'planner' ? 'border-b-2 border-green-400 text-green-400' : 'text-gray-400'}`}
            >
              <Calendar size={20} />
              Planner
            </button>
            <button
              onClick={() => setView('recipes')}
              className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap ${view === 'recipes' ? 'border-b-2 border-green-400 text-green-400' : 'text-gray-400'}`}
            >
              <Book size={20} />
              Recipes
            </button>
            <button
              onClick={() => setView('shopping')}
              className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap ${view === 'shopping' ? 'border-b-2 border-green-400 text-green-400' : 'text-gray-400'}`}
            >
              <ShoppingCart size={20} />
              Shopping
            </button>
            <button
              onClick={() => setView('nutrition')}
              className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap ${view === 'nutrition' ? 'border-b-2 border-green-400 text-green-400' : 'text-gray-400'}`}
            >
              <Award size={20} />
              Weekly Stats
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {view === 'today' && (
          <div className="pb-6">
            {(() => {
              const today = new Date().toISOString().split('T')[0];
              const todayNutrition = getDailyNutrition(today);
              const proteinPercent = Math.min((todayNutrition.protein / dailyGoals.protein) * 100, 100);
              const caloriesPercent = Math.min((todayNutrition.calories / dailyGoals.calories) * 100, 100);
              const carbsFatsPercent = Math.min(((todayNutrition.carbs / dailyGoals.carbs + todayNutrition.fats / dailyGoals.fats) / 2) * 100, 100);

              return (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Apple Rings */}
                  <div className="flex flex-col items-center justify-center min-h-[500px]">
                    <div className="mb-4 text-center">
                      <h2 className="text-3xl font-bold text-white mb-1">Today's Progress</h2>
                      <p className="text-gray-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                    </div>
                    
                    <div className="relative flex items-center justify-center" style={{ width: 320, height: 320 }}>
                      {/* Outer Ring - Protein */}
                      <div className="absolute">
                        <AppleRing
                          percentage={proteinPercent}
                          size={300}
                          strokeWidth={22}
                          gradient={['#7FFF00', '#00FF7F']}
                          icon={Target}
                        />
                      </div>
                      
                      {/* Middle Ring - Calories */}
                      <div className="absolute">
                        <AppleRing
                          percentage={caloriesPercent}
                          size={230}
                          strokeWidth={22}
                          gradient={['#FF006E', '#FFBE0B']}
                          icon={Flame}
                        />
                      </div>
                      
                      {/* Inner Ring - Carbs & Fats */}
                      <div className="absolute">
                        <AppleRing
                          percentage={carbsFatsPercent}
                          size={160}
                          strokeWidth={22}
                          gradient={['#00D9FF', '#7B2CBF']}
                          icon={Award}
                        />
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-6 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-400">{todayNutrition.protein}g</div>
                        <div className="text-sm text-gray-400">Protein</div>
                        <div className="text-xs text-gray-500">of {dailyGoals.protein}g</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-400">{todayNutrition.calories}</div>
                        <div className="text-sm text-gray-400">Calories</div>
                        <div className="text-xs text-gray-500">of {dailyGoals.calories}</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-400">{todayNutrition.carbs}g / {todayNutrition.fats}g</div>
                        <div className="text-sm text-gray-400">Carbs / Fats</div>
                        <div className="text-xs text-gray-500">{dailyGoals.carbs}g / {dailyGoals.fats}g</div>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowGoalsModal(true)}
                      className="mt-6 bg-green-500 text-white px-6 py-2 rounded-full hover:bg-green-600 transition-colors"
                    >
                      Edit Goals
                    </button>
                  </div>

                  {/* Right: Today's Meals */}
                  <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 max-h-[600px] overflow-y-auto">
                    <h3 className="text-xl font-bold text-white mb-4">Today's Meals</h3>
                    <div className="space-y-3">
                      {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
                        const mealList = meals[`${today}-${mealType}`] || [];
                        return (
                          <div key={mealType} className="bg-gray-800 bg-opacity-50 rounded-lg p-4 border border-gray-700">
                            <div className="font-semibold text-green-400 uppercase text-sm mb-2">
                              {mealType}
                            </div>
                            {mealList.length > 0 ? (
                              <div className="space-y-2">
                                {mealList.map((meal, idx) => (
                                  <div key={idx} className="flex items-center justify-between bg-gray-900 bg-opacity-50 p-2 rounded">
                                    <div className="flex-1">
                                      <div className="font-medium text-white text-sm">{meal.name}</div>
                                      <div className="text-xs text-gray-400">
                                        {meal.calories} cal • {meal.protein}g protein
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => removeMealFromPlan(today, mealType, idx)}
                                      className="text-red-400 hover:text-red-300 ml-2"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-gray-500 text-sm">No meals planned</div>
                            )}
                            <button
                              onClick={() => {
                                setSelectedDate(today);
                                setSelectedMealType(mealType);
                                setShowAddMeal(true);
                              }}
                              className="mt-2 w-full bg-green-500 bg-opacity-20 text-green-400 border border-green-500 px-3 py-2 rounded hover:bg-opacity-30 transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                              <Plus size={16} />
                              Add Meal
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {view === 'planner' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="p-2 border rounded bg-gray-800 text-white border-gray-700"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {getWeekDates().map(date => {
                const dateObj = new Date(date + 'T00:00:00');
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                const dayNum = dateObj.getDate();
                const nutrition = getDailyNutrition(date);
                
                return (
                  <div key={date} className="bg-black bg-opacity-30 backdrop-blur-sm rounded-lg shadow-sm p-4 border border-gray-700">
                    <div className="text-center mb-3">
                      <div className="font-semibold text-gray-300">{dayName}</div>
                      <div className="text-2xl font-bold text-white">{dayNum}</div>
                      <div className="text-xs text-gray-400 mt-1">{nutrition.calories} cal</div>
                    </div>
                    
                    {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
                      const mealList = meals[`${date}-${mealType}`] || [];
                      return (
                        <div key={mealType} className="mb-3 last:mb-0">
                          <div className="text-xs font-semibold text-gray-400 uppercase mb-1">
                            {mealType}
                          </div>
                          {mealList.length > 0 ? (
                            <div className="space-y-1">
                              {mealList.map((meal, idx) => (
                                <div key={idx} className="bg-green-500 bg-opacity-20 p-2 rounded text-sm relative group border border-green-500 border-opacity-30">
                                  <div className="font-medium text-white text-xs">{meal.name}</div>
                                  <div className="text-xs text-gray-400">{meal.calories} cal</div>
                                  <button
                                    onClick={() => removeMealFromPlan(date, mealType, idx)}
                                    className="absolute top-1 right-1 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : null}
                          <button
                            onClick={() => {
                              setSelectedDate(date);
                              setSelectedMealType(mealType);
                              setShowAddMeal(true);
                            }}
                            className="w-full mt-1 border-2 border-dashed border-gray-600 rounded p-2 text-gray-500 hover:border-green-400 hover:text-green-400 transition-colors"
                          >
                            <Plus size={16} className="mx-auto" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'recipes' && (
          <div>
            <div className="mb-6 flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search recipes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-800 text-white border-gray-700"
                />
              </div>
              <button
                onClick={() => setShowAddRecipe(true)}
                className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 flex items-center gap-2"
              >
                <Plus size={20} />
                Add Recipe
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecipes.map(recipe => (
                <div key={recipe.id} className="bg-black bg-opacity-30 backdrop-blur-sm rounded-lg shadow-sm p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-white">{recipe.name}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleFavorite(recipe.id)}
                        className={recipe.favorite ? 'text-yellow-400' : 'text-gray-500'}
                      >
                        <Star size={20} fill={recipe.favorite ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => deleteRecipe(recipe.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{recipe.prep}</p>
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 mb-1">Ingredients:</div>
                    <div className="text-sm text-gray-300">{recipe.ingredients.join(', ')}</div>
                  </div>
                  <div className="border-t border-gray-700 pt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Calories:</span>
                      <span className="font-semibold ml-1 text-white">{recipe.calories}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Protein:</span>
                      <span className="font-semibold ml-1 text-white">{recipe.protein}g</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Carbs:</span>
                      <span className="font-semibold ml-1 text-white">{recipe.carbs}g</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Fats:</span>
                      <span className="font-semibold ml-1 text-white">{recipe.fats}g</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'shopping' && (
          <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-lg shadow-sm p-6 border border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-white">Weekly Shopping List</h2>
            <div className="text-sm text-gray-400 mb-4">
              Based on your meal plan for the week
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {getShoppingList().map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 border border-gray-700 rounded bg-gray-800 bg-opacity-50">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="text-gray-300">{item}</span>
                </div>
              ))}
              {getShoppingList().length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-8">
                  No meals planned yet. Add meals to your planner to generate a shopping list.
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'nutrition' && (
          <div>
            {(() => {
              const { dailyData, avgCalories, avgProtein, daysOnTrack, streak } = getWeeklyStats();
              const maxCalories = Math.max(...dailyData.map(d => d.calories), dailyGoals.calories);
              
              return (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                      <div className="flex items-center gap-3 mb-2">
                        <Target size={32} />
                        <div>
                          <div className="text-sm opacity-90">Avg Protein</div>
                          <div className="text-3xl font-bold">{avgProtein}g</div>
                        </div>
                      </div>
                      <div className="text-sm opacity-75">Goal: {dailyGoals.protein}g</div>
                    </div>

                    <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white">
                      <div className="flex items-center gap-3 mb-2">
                        <Flame size={32} />
                        <div>
                          <div className="text-sm opacity-90">Avg Calories</div>
                          <div className="text-3xl font-bold">{avgCalories}</div>
                        </div>
                      </div>
                      <div className="text-sm opacity-75">Goal: {dailyGoals.calories}</div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl p-6 text-white">
                      <div className="flex items-center gap-3 mb-2">
                        <Award size={32} />
                        <div>
                          <div className="text-sm opacity-90">Days On Track</div>
                          <div className="text-3xl font-bold">{daysOnTrack}/7</div>
                        </div>
                      </div>
                      <div className="text-sm opacity-75">90%+ protein goal</div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl p-6 text-white">
                      <div className="flex items-center gap-3 mb-2">
                        <TrendingUp size={32} />
                        <div>
                          <div className="text-sm opacity-90">Current Streak</div>
                          <div className="text-3xl font-bold">{streak} days</div>
                        </div>
                      </div>
                      <div className="text-sm opacity-75">Keep it going!</div>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-6">Daily Calorie Intake</h3>
                    <div className="space-y-4">
                      {dailyData.map(day => {
                        const dateObj = new Date(day.date + 'T00:00:00');
                        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                        const barWidth = (day.calories / maxCalories) * 100;
                        const isOnTrack = day.protein >= dailyGoals.protein * 0.9;
                        
                        return (
                          <div key={day.date}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-300">{dayName}</span>
                              <span className="text-sm text-gray-400">{day.calories} cal</span>
                            </div>
                            <div className="relative h-8 bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isOnTrack ? 'bg-gradient-to-r from-green-500 to-green-400' : 'bg-gradient-to-r from-gray-600 to-gray-500'
                                }`}
                                style={{ width: `${barWidth}%` }}
                              />
                              {day.calories > 0 && (
                                <div className="absolute inset-0 flex items-center px-3 text-xs font-medium text-white">
                                  P: {day.protein}g • C: {day.carbs}g • F: {day.fats}g
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Goal Line */}
                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
                      <div className="w-3 h-3 border-2 border-dashed border-green-400 rounded"></div>
                      <span>Daily Goal: {dailyGoals.calories} cal</span>
                    </div>
                  </div>

                  {/* Macro Breakdown */}
                  <div className="bg-black bg-opacity-30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-bold text-white mb-6">Weekly Macro Breakdown</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {dailyData.map(day => {
                        const dateObj = new Date(day.date + 'T00:00:00');
                        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                        const total = day.protein + day.carbs + day.fats;
                        const proteinPercent = total > 0 ? (day.protein / total) * 100 : 0;
                        const carbsPercent = total > 0 ? (day.carbs / total) * 100 : 0;
                        const fatsPercent = total > 0 ? (day.fats / total) * 100 : 0;
                        
                        return (
                          <div key={day.date} className="text-center">
                            <div className="font-semibold text-white mb-2">{dayName}</div>
                            <div className="h-32 w-full bg-gray-800 rounded-lg overflow-hidden flex flex-col">
                              <div className="bg-green-500" style={{ height: `${proteinPercent}%` }}></div>
                              <div className="bg-orange-500" style={{ height: `${carbsPercent}%` }}></div>
                              <div className="bg-purple-500" style={{ height: `${fatsPercent}%` }}></div>
                            </div>
                            <div className="mt-2 text-xs space-y-1">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded"></div>
                                <span className="text-gray-400">P: {day.protein}g</span>
                              </div>
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                                <span className="text-gray-400">C: {day.carbs}g</span>
                              </div>
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                                <span className="text-gray-400">F: {day.fats}g</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddRecipe && <RecipeForm onSubmit={addRecipe} onCancel={() => setShowAddRecipe(false)} />}
      {showAddMeal && (
        <MealSelector
          date={selectedDate}
          mealType={selectedMealType}
          onClose={() => setShowAddMeal(false)}
        />
      )}
      {showGoalsModal && (
        <GoalsModal
          currentGoals={dailyGoals}
          onSave={setDailyGoals}
          onClose={() => setShowGoalsModal(false)}
        />
      )}
    </div>
  );
}