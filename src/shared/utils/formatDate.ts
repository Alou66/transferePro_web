export function formatDate(dateString: string): string {
  if (!dateString) {
    return '—'
  }

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
