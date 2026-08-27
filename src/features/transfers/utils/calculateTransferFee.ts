export function calculateTransferFee(amount: number): number {
  if (typeof amount !== 'number' || Number.isNaN(amount) || amount < 1000) {
    return 0
  }

  const tranches = Math.ceil(amount / 5000)
  return tranches * 250
}
