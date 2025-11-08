export default function Card({ children, className = "" }: {children: React.ReactNode; className?: string}) {
  return (
    <div className={`bg-surface-2 border border-on-outline/30 rounded-card shadow-e2 ${className}`}>
      {children}
    </div>
  )
}
