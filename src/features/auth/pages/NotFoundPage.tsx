import { Link } from 'react-router-dom'
import './NotFoundPage.css'

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <h1>404</h1>
        <h2>Page introuvable</h2>
        <p>La page que vous recherchez n'existe pas.</p>
        <Link to="/" className="not-found-button">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}
