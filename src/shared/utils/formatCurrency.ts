export function formatCurrency(amount: number): string {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return '0 FCFA'
  }

  return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`
}
