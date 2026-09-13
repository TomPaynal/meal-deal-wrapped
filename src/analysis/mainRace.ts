import type { MealDealDataset } from '../types/data'

export interface MainRaceEntry {
  productId: string
  name: string
  count: number
}

export function getCumulativeMainCounts(
  dataset: MealDealDataset,
  cutoffDate: Date,
): MainRaceEntry[] {
  const counts = new Map<string, number>()

  for (const transaction of dataset.transactions) {
    const transactionDate = new Date(transaction.occurredAt)

    if (transactionDate > cutoffDate) {
      continue
    }

    for (const item of transaction.items) {
      const product = dataset.products[item.productId]

      if (!product || product.mealDealRole !== 'main') {
        continue
      }

      const currentCount = counts.get(item.productId) ?? 0

      counts.set(
        item.productId,
        currentCount + item.quantity,
      )
    }
  }

  return [...counts.entries()]
    .map(([productId, count]) => {
      const product = dataset.products[productId]

      return {
        productId,
        name:
          product.displayName ??
          product.rawName,
        count,
      }
    })
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count
      }

      return a.name.localeCompare(b.name)
    })
}