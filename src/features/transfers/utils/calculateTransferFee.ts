// Dupliquée côté back (transfertPro_api/src/utils/feeCalculator.ts) :
// aucun mécanisme de code partagé entre les deux projets, garder les deux formules synchronisées.
export function calculateTransferFee(amount: number): number {
  if (typeof amount !== 'number' || Number.isNaN(amount) || amount < 1000) {
    return 0
  }

  const tranches = Math.ceil(amount / 5000)
  return tranches * 250
}
