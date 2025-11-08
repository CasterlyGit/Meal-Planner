import { motion } from "framer-motion"
import { Calendar, TrendingUp, Book, ShoppingCart, Award } from "lucide-react"

const TABS = [
  { id: 'today', icon: TrendingUp, label: 'Today' },
  { id: 'planner', icon: Calendar, label: 'Planner' },
  { id: 'recipes', icon: Book, label: 'Recipes' },
  { id: 'shopping', icon: ShoppingCart, label: 'Shopping' },
  { id: 'nutrition', icon: Award, label: 'Weekly' },
]

export default function TopTabs({
  view, setView
}: { view: string; setView: (v: string) => void }) {
  return (
    <div role="tablist" aria-label="Main" className="relative flex gap-2 overflow-x-auto">
      {TABS.map(t => {
        const Icon = t.icon
        const active = view === t.id
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => setView(t.id)}
            className="relative px-4 py-3 rounded-control focus:outline-none focus-visible:ring-[var(--ring)] focus-visible:ring-primary"
          >
            <span className={`flex items-center gap-2 ${active ? 'text-primary' : 'text-on-muted'}`}>
              <Icon size={18} />
              <span className="font-medium">{t.label}</span>
            </span>
            {active && (
              <motion.div
                layoutId="tab-underline"
                className="absolute left-2 right-2 -bottom-[2px] h-[2px] rounded-full bg-primary"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
