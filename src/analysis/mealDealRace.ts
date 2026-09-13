import type {
  MealDealDataset,
} from '../types/data'

import {
  resolveMealDeals,
  type ResolvedMealDealRole,
} from './mealDeals'

export type RaceRole =
  ResolvedMealDealRole

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
    .map(
      ([productId, count]) => {
        const product =
          dataset.products[
            productId
          ]

        return {
          productId,

          name:
            product?.displayName ??
            product?.rawName ??
            productId,

          count,
        }
      },
    )
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count
      }

      return a.name.localeCompare(
        b.name,
      )
    })
}

export function getMonthlyRaceSnapshots(
  dataset: MealDealDataset,
  role: RaceRole,
): RaceSnapshot[] {
  const resolution =
    resolveMealDeals(dataset)

  const memberships =
    resolution.memberships
      .filter(
        (membership) =>
          membership.role === role,
      )
      .sort(
        (a, b) =>
          new Date(
            a.occurredAt,
          ).getTime() -
          new Date(
            b.occurredAt,
          ).getTime(),
      )

  if (memberships.length === 0) {
    return []
  }

  const firstDate = new Date(
    memberships[0].occurredAt,
  )

  const lastDate = new Date(
    memberships[
      memberships.length - 1
    ].occurredAt,
  )

  let year =
    firstDate.getUTCFullYear()

  let month =
    firstDate.getUTCMonth()

  const finalYear =
    lastDate.getUTCFullYear()

  const finalMonth =
    lastDate.getUTCMonth()

  const counts =
    new Map<string, number>()

  const snapshots:
    RaceSnapshot[] = []

  let membershipIndex = 0

  while (
    year < finalYear ||
    (
      year === finalYear &&
      month <= finalMonth
    )
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
      membershipIndex <
        memberships.length &&
      new Date(
        memberships[
          membershipIndex
        ].occurredAt,
      ) <= monthEnd
    ) {
      const membership =
        memberships[
          membershipIndex
        ]

      const currentCount =
        counts.get(
          membership.productId,
        ) ?? 0

      counts.set(
        membership.productId,
        currentCount + 1,
      )

      membershipIndex += 1
    }

    const snapshotDate =
      new Date(
        Date.UTC(
          year,
          month,
          1,
        ),
      )

    snapshots.push({
      date:
        snapshotDate.toISOString(),

      label:
        snapshotDate.toLocaleDateString(
          'en-GB',
          {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
          },
        ),

      entries:
        rankCounts(
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