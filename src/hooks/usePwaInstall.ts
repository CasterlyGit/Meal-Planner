// src/hooks/usePwaInstall.ts
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'

type BIP = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function isStandaloneNow() {
  if (typeof window === 'undefined') return false
  // iOS Safari standalone
  // @ts-ignore
  if (window.navigator?.standalone) return true
  // Others
  return window.matchMedia?.('(display-mode: standalone)').matches ?? false
}

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export default function usePwaInstall() {
  const [installed, setInstalled] = useState(isStandaloneNow())
  const [canInstall, setCanInstall] = useState(false)
  const deferredRef = useRef<BIP | null>(null)

  const iOS = useMemo(isIOS, [])

  useEffect(() => {
    let cancelled = false

    const onBIP = (e: Event) => {
      if (cancelled) return
      e.preventDefault?.()
      deferredRef.current = e as BIP
      setCanInstall(!installed && !iOS)
    }

    const onInstalled = () => {
      deferredRef.current = null
      setCanInstall(false)
      setInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', onBIP as EventListener)
    window.addEventListener('appinstalled', onInstalled)

    // Keep in sync when display-mode flips (Chrome 110+)
    const mq = window.matchMedia?.('(display-mode: standalone)')
    const onMQ = () => setInstalled(isStandaloneNow())
    mq?.addEventListener?.('change', onMQ)

    return () => {
      cancelled = true
      window.removeEventListener('beforeinstallprompt', onBIP as EventListener)
      window.removeEventListener('appinstalled', onInstalled)
      mq?.removeEventListener?.('change', onMQ)
    }
  }, [installed, iOS])

  const promptInstall = useCallback(async () => {
    const evt = deferredRef.current
    if (!evt) return false
    await evt.prompt()
    const { outcome } = await evt.userChoice
    deferredRef.current = null
    setCanInstall(false)
    return outcome === 'accepted'
  }, [])

  return { canInstall, installed, isIOS: iOS, promptInstall }
}
