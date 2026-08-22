export function calculateTransferFee(amount: number): number {
  if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
    return 0
  }

  if (amount <= 10000) {
    return 250
  }

  if (amount <= 50000) {
    return 500
  }

  if (amount <= 100000) {
    return 1000
  }

  return 2000
}
