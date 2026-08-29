import { useState } from 'react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import './InstallAppButton.css'

const DISMISS_KEY = 'installAppButtonDismissed'

export default function InstallAppButton() {
  const { canInstall, platform, promptInstall } = useInstallPrompt()
  const [showIosModal, setShowIosModal] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  if (!canInstall || dismissed) {
    return null
  }

  const handleInstallClick = () => {
    if (platform === 'ios') {
      setShowIosModal(true)
    } else {
      void promptInstall()
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Ignore storage errors (e.g. private browsing) — the button just won't stay dismissed.
    }
  }

  return (
    <>
      <div className="install-app-button">
        <button type="button" className="install-app-button-cta" onClick={handleInstallClick}>
          <span className="install-app-button-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12m0 0-4-4m4 4 4-4" />
              <path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
            </svg>
          </span>
          Installer l&apos;app
        </button>
        <button
          type="button"
          className="install-app-button-dismiss"
          onClick={handleDismiss}
          aria-label="Ignorer pour cette session"
        >
          ×
        </button>
      </div>

      {showIosModal && (
        <div className="install-app-modal-overlay" onClick={() => setShowIosModal(false)}>
          <div className="install-app-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Installer TransferePro</h2>
            <p className="install-app-modal-subtitle">
              Sur iPhone/iPad, l&apos;installation se fait depuis Safari en 3 étapes :
            </p>

            <ol className="install-app-modal-steps">
              <li>
                <span className="install-app-modal-step-icon" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 16V4m0 0-3.5 3.5M12 4l3.5 3.5" />
                    <path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
                  </svg>
                </span>
                Appuyez sur l&apos;icône <strong>Partager</strong> en bas de l&apos;écran Safari.
              </li>
              <li>
                <span className="install-app-modal-step-icon" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="4" width="16" height="16" rx="3" />
                    <path d="M12 8v8M8 12h8" />
                  </svg>
                </span>
                Faites défiler puis appuyez sur <strong>Sur l&apos;écran d&apos;accueil</strong>.
              </li>
              <li>
                <span className="install-app-modal-step-icon" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                Confirmez en appuyant sur <strong>Ajouter</strong>.
              </li>
            </ol>

            <button type="button" className="btn btn-secondary btn-full" onClick={() => setShowIosModal(false)}>
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  )
}
