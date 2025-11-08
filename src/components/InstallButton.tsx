import { useState } from 'react'
import usePwaInstall from '../hooks/usePwaInstall'

export default function InstallButton({ variant = 'solid', size = 'md' }: { variant?: 'solid'|'ghost'; size?: 'sm'|'md' }) {
  const { canInstall, installed, isIOS, promptInstall } = usePwaInstall()
  const [showIosHowTo, setShowIosHowTo] = useState(false)

  if (installed) return null

  // iOS Safari doesn’t fire beforeinstallprompt. Show a small “Add to Home Screen” guide.
  if (isIOS && !canInstall) {
    return (
      <>
        <button
          onClick={() => setShowIosHowTo(true)}
          className={btnClass(variant, size)}
          aria-label="Add to Home Screen"
          title="Add to Home Screen"
        >
          Install App
        </button>

        {showIosHowTo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={() => setShowIosHowTo(false)}>
            <div className="bg-white rounded-2xl p-5 w-[92%] max-w-sm" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold">Install on iPhone</h3>
              <ol className="mt-3 text-sm text-gray-600 list-decimal pl-5 space-y-2">
                <li>Tap the <span className="font-medium">Share</span> icon in Safari.</li>
                <li>Choose <span className="font-medium">Add to Home Screen</span>.</li>
                <li>Tap <span className="font-medium">Add</span> to install.</li>
              </ol>
              <div className="mt-4 flex justify-end">
                <button className="px-3 py-1.5 rounded-md bg-gray-900 text-white" onClick={() => setShowIosHowTo(false)}>Done</button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // Standard flow (Android/desktop): show when beforeinstallprompt is available
  if (!canInstall) return null

  return (
    <button
      onClick={promptInstall}
      className={btnClass(variant, size)}
      aria-label="Install App"
      title="Install App"
    >
      Install App
    </button>
  )
}

function btnClass(variant: 'solid'|'ghost', size: 'sm'|'md') {
  const base = 'rounded-control transition-colors'
  const sizing = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2'
  const look =
    variant === 'solid'
      ? 'bg-primary text-white hover:bg-primary-600'
      : 'bg-primary/10 text-primary hover:bg-primary/15'
  return `${base} ${sizing} ${look}`
}
