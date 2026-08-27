import './PageLoader.css'

export default function PageLoader() {
  return (
    <div className="loading-page">
      <div className="loading-card">
        <div className="loading-spinner" />
        <p>Chargement...</p>
      </div>
    </div>
  )
}
