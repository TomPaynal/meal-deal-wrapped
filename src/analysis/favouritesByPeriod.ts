import type {
  MealDealDataset,
} from '../types/data'

import {
  deriveMealDeals,
  resolveMealDeals,
} from './mealDeals'

export type FavouriteCategory =
  | 'meal'
  | 'main'
  | 'side'
  | 'drink'

export interface FavouriteDateRange {
  from?: string
  to?: string
}

export interface FavouriteRankingEntry {
  key: string

  count: number
  share: number

  mainName?: string
  sideName?: string
  drinkName?: string

  name?: string
}

export interface FavouritePeriodAnalysis {
  totalSelections: number

  rankings:
    FavouriteRankingEntry[]

  topChoice?:
    FavouriteRankingEntry
}

function rangeStart(
  value?: string,
): number {
  if (!value) {
    return Number.NEGATIVE_INFINITY
  }

  return new Date(
    `${value}T00:00:00Z`,
  ).getTime()
}

function rangeEnd(
  value?: string,
): number {
  if (!value) {
    return Number.POSITIVE_INFINITY
  }

  return new Date(
    `${value}T23:59:59.999Z`,
  ).getTime()
}

function inRange(
  occurredAt: string,
  range: FavouriteDateRange,
): boolean {
  const timestamp =
    new Date(
      occurredAt,
    ).getTime()

  return (
    timestamp >=
      rangeStart(range.from) &&
    timestamp <=
      rangeEnd(range.to)
  )
}

function productName(
  dataset: MealDealDataset,
  productId: string,
): string {
  const product =
    dataset.products[
      productId
    ]

  return (
    product?.displayName ??
    product?.rawName ??
    productId
  )
}

export function analyseFavouritesByPeriod(
  dataset: MealDealDataset,
  category: FavouriteCategory,
  range: FavouriteDateRange,
): FavouritePeriodAnalysis {
  if (category === 'meal') {
    const deals =
      deriveMealDeals(dataset)
        .filter(
          (deal) =>
            inRange(
              deal.occurredAt,
              range,
            ),
        )

    const counts =
      new Map<
        string,
        {
          count: number
          mainName: string
          sideName: string
          drinkName: string
        }
      >()

    for (const deal of deals) {
      const key = [
        deal.mainProductId,
        deal.sideProductId,
        deal.drinkProductId,
      ].join('|')

      const existing =
        counts.get(key)

      if (existing) {
        existing.count += 1
        continue
      }

      counts.set(
        key,
        {
          count: 1,

          mainName:
            productName(
              dataset,
              deal.mainProductId,
            ),

          sideName:
            productName(
              dataset,
              deal.sideProductId,
            ),

          drinkName:
            productName(
              dataset,
              deal.drinkProductId,
            ),
        },
      )
    }

    const totalSelections =
      deals.length

    const rankings =
      [...counts.entries()]
        .map(
          ([
            key,
            value,
          ]) => ({
            key,

            count:
              value.count,

            share:
              totalSelections > 0
                ? value.count /
                  totalSelections
                : 0,

            mainName:
              value.mainName,

            sideName:
              value.sideName,

            drinkName:
              value.drinkName,
          }),
        )
        .sort(
          (a, b) => {
            if (
              b.count !==
              a.count
            ) {
              return (
                b.count -
                a.count
              )
            }

            return a.key.localeCompare(
              b.key,
            )
          },
        )

    return {
      totalSelections,
      rankings,
      topChoice:
        rankings[0],
    }
  }

  const resolution =
    resolveMealDeals(dataset)

  const memberships =
    resolution.memberships
      .filter(
        (membership) =>
          membership.role ===
            category &&
          inRange(
            membership.occurredAt,
            range,
          ),
      )

  const counts =
    new Map<
      string,
      number
    >()

  for (
    const membership
    of memberships
  ) {
    counts.set(
      membership.productId,
      (
        counts.get(
          membership.productId,
        ) ?? 0
      ) + 1,
    )
  }

  const totalSelections =
    memberships.length

  const rankings =
    [...counts.entries()]
      .map(
        ([
          productId,
          count,
        ]) => ({
          key: productId,

          name:
            productName(
              dataset,
              productId,
            ),

          count,

          share:
            totalSelections > 0
              ? count /
                totalSelections
              : 0,
        }),
      )
      .sort(
        (a, b) => {
          if (
            b.count !==
            a.count
          ) {
            return (
              b.count -
              a.count
            )
          }

          return (
            a.name ??
            ''
          ).localeCompare(
            b.name ??
            '',
          )
        },
      )

  return {
    totalSelections,
    rankings,
    topChoice:
      rankings[0],
  }
}