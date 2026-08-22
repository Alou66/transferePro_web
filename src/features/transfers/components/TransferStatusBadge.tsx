import { TransferStatus } from '../../../types/index'
import './TransferStatusBadge.css'

interface TransferStatusBadgeProps {
  status: TransferStatus
}

const STATUS_LABELS: Record<TransferStatus, string> = {
  [TransferStatus.CREATED]: 'Créé',
  [TransferStatus.READY_FOR_PAYMENT]: 'Prêt au paiement',
  [TransferStatus.PAID]: 'Payé',
  [TransferStatus.CANCELLED]: 'Annulé',
}

export default function TransferStatusBadge({ status }: TransferStatusBadgeProps) {
  return (
    <span className={`transfer-status-badge transfer-status-badge--${status.toLowerCase()}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}
