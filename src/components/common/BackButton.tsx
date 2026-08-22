import { useNavigate } from 'react-router-dom'
import './BackButton.css'

interface BackButtonProps {
  to?: string
  label?: string
}

export default function BackButton({ to, label = 'Retour' }: BackButtonProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (to) {
      navigate(to, { replace: true })
    } else {
      navigate(-1)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="back-button"
    >
      <span className="back-button-icon" aria-hidden="true">←</span>
      <span className="back-button-label">{label}</span>
    </button>
  )
}
