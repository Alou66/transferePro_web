import { useLocation } from 'react-router-dom'
import './PendingValidationPage.css'

export default function PendingValidationPage() {
  const location = useLocation()
  const agent = location.state?.agent

  return (
    <div className="pending-page">
      <div className="pending-card">
        <div className="pending-icon">⏳</div>
        <h1>Inscription en cours de validation</h1>
        <p className="pending-message">
          Votre compte a été créé avec succès. Il est actuellement en attente de validation par un administrateur.
        </p>
        {agent && (
          <div className="pending-info">
            <p>
              <strong>Nom complet :</strong> {agent.firstName} {agent.lastName}
            </p>
            <p>
              <strong>Email :</strong> {agent.email}
            </p>
            <p>
              <strong>Ville :</strong> {agent.city}
            </p>
          </div>
        )}
        <p className="pending-submessage">
          Vous recevrez une notification dès que votre compte sera activé.
        </p>
      </div>
    </div>
  )
}
