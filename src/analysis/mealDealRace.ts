import type {
  MealDealDataset,
  MealDealRole,
} from '../types/data'

export type RaceRole = Exclude<
  MealDealRole,
  'unknown'
>

export interface RaceEntry {
  productId: string
  name: string
  count: number
}

export interface RaceSnapshot {
  date: string
  label: string
  entries: RaceEntry[]
}

function rankCounts(
  dataset: MealDealDataset,
  counts: Map<string, number>,
): RaceEntry[] {
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

export function getMonthlyRaceSnapshots(
  dataset: MealDealDataset,
  role: RaceRole,
): RaceSnapshot[] {
  if (dataset.transactions.length === 0) {
    return []
  }

  const transactions = [
    ...dataset.transactions,
  ].sort(
    (a, b) =>
      new Date(a.occurredAt).getTime() -
      new Date(b.occurredAt).getTime(),
  )

  const firstDate = new Date(
    transactions[0].occurredAt,
  )

  const lastDate = new Date(
    transactions[
      transactions.length - 1
    ].occurredAt,
  )

  let year = firstDate.getUTCFullYear()
  let month = firstDate.getUTCMonth()

  const finalYear =
    lastDate.getUTCFullYear()

  const finalMonth =
    lastDate.getUTCMonth()

  const counts = new Map<string, number>()

  const snapshots: RaceSnapshot[] = []

  let transactionIndex = 0

  while (
    year < finalYear ||
    (year === finalYear &&
      month <= finalMonth)
  ) {
    const monthEnd = new Date(
      Date.UTC(
        year,
        month + 1,
        0,
        23,
        59,
        59,
        999,
      ),
    )

    while (
      transactionIndex <
        transactions.length &&
      new Date(
        transactions[
          transactionIndex
        ].occurredAt,
      ) <= monthEnd
    ) {
      const transaction =
        transactions[transactionIndex]

      for (const item of transaction.items) {
        const product =
          dataset.products[
            item.productId
          ]

        if (
          product &&
          product.mealDealRole === role
        ) {
          const currentCount =
            counts.get(item.productId) ??
            0

          counts.set(
            item.productId,
            currentCount +
              item.quantity,
          )
        }
      }

      transactionIndex += 1
    }

    const snapshotDate = new Date(
      Date.UTC(year, month, 1),
    )

    snapshots.push({
      date: snapshotDate.toISOString(),

      label:
        snapshotDate.toLocaleDateString(
          'en-GB',
          {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
          },
        ),

      entries: rankCounts(
        dataset,
        counts,
      ),
    })

    month += 1

    if (month === 12) {
      month = 0
      year += 1
    }
  }

  return snapshots
}