export default function LayoutShell({
  title, actions, children
}: { title: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-0 text-on-surface">
      <header className="sticky top-0 z-40 border-b border-on-outline/40 backdrop-blur bg-surface-0/70">
        <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold">{title}</h1>
          <div className="flex items-center gap-2">{actions}</div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  )
}
