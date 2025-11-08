import { ComponentType } from "react"

export default function EmptyState({
  icon: Icon, title, hint, cta
}: {icon: ComponentType<{size?: number}>, title: string, hint?: string, cta?: React.ReactNode}) {
  return (
    <div className="text-center py-14">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-surface-3 shadow-e1 mb-3">
        <Icon size={22} className="text-on-muted" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {hint && <p className="text-on-muted mt-1">{hint}</p>}
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  )
}
