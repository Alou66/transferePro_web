import { useCallback, useEffect, useState } from 'react'

export type InstallPlatform = 'android' | 'ios' | 'desktop' | 'unsupported'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

function detectPlatform(): InstallPlatform {
  if (typeof navigator === 'undefined') {
    return 'unsupported'
  }

  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1)

  if (isIOS) {
    return 'ios'
  }
  if (/Android/i.test(ua)) {
    return 'android'
  }
  if (!/Mobi/i.test(ua)) {
    return 'desktop'
  }
  return 'unsupported'
}

function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const nav = window.navigator as Navigator & { standalone?: boolean }
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
}

interface UseInstallPromptResult {
  canInstall: boolean
  platform: InstallPlatform
  promptInstall: () => Promise<void>
}

export function useInstallPrompt(): UseInstallPromptResult {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(isStandaloneDisplay)
  const [platform] = useState<InstallPlatform>(detectPlatform)

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return
    }

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
  }, [deferredPrompt])

  // On iOS there is no beforeinstallprompt event: the button still shows so it can open
  // the manual "Add to Home Screen" instructions instead of a native prompt.
  const canInstall = !isInstalled && (platform === 'ios' ? true : deferredPrompt !== null)

  return {
    canInstall,
    platform,
    promptInstall,
  }
}
