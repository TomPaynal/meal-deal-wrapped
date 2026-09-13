import type {
  MealDealDataset,
} from '../types/data'

import {
  deriveMealDeals,
  type DerivedMealDeal,
} from './mealDeals'

export type StreakRole =
  | 'main'
  | 'side'
  | 'drink'

export interface StreakRun {
  productId: string
  productName: string

  count: number

  startedAt: string
  endedAt: string
}

export interface LongestStreakAnalysis {
  role: StreakRole

  maxCount: number

  /*
   * More than one run can tie
   * for the record.
   *
   * Newest tied run comes first.
   */
  streaks: StreakRun[]
}

interface IndexedDeal {
  deal: DerivedMealDeal
  originalIndex: number
}

export function analyseLongestStreak(
  dataset: MealDealDataset,
  role: StreakRole,
): LongestStreakAnalysis {
  const deals =
    deriveMealDeals(dataset)

      /*
       * Keep original deal order as
       * the tie-breaker when multiple
       * Meal Deals share a timestamp.
       */
      .map(
        (
          deal,
          originalIndex,
        ): IndexedDeal => ({
          deal,
          originalIndex,
        }),
      )

      .sort(
        (a, b) => {
          const dateDifference =
            new Date(
              a.deal.occurredAt,
            ).getTime() -
            new Date(
              b.deal.occurredAt,
            ).getTime()

          if (
            dateDifference !== 0
          ) {
            return dateDifference
          }

          return (
            a.originalIndex -
            b.originalIndex
          )
        },
      )

  if (
    deals.length === 0
  ) {
    return {
      role,
      maxCount: 0,
      streaks: [],
    }
  }

  const runs: StreakRun[] = []

  let currentProductId =
    productIdForRole(
      deals[0].deal,
      role,
    )

  let currentCount = 1

  let currentStartedAt =
    deals[0].deal.occurredAt

  let currentEndedAt =
    deals[0].deal.occurredAt

  for (
    let index = 1;
    index < deals.length;
    index += 1
  ) {
    const deal =
      deals[index].deal

    const productId =
      productIdForRole(
        deal,
        role,
      )

    if (
      productId ===
      currentProductId
    ) {
      currentCount += 1

      currentEndedAt =
        deal.occurredAt

      continue
    }

    runs.push(
      makeRun(
        dataset,
        currentProductId,
        currentCount,
        currentStartedAt,
        currentEndedAt,
      ),
    )

    currentProductId =
      productId

    currentCount = 1

    currentStartedAt =
      deal.occurredAt

    currentEndedAt =
      deal.occurredAt
  }

  runs.push(
    makeRun(
      dataset,
      currentProductId,
      currentCount,
      currentStartedAt,
      currentEndedAt,
    ),
  )

  const maxCount =
    Math.max(
      0,
      ...runs.map(
        (run) =>
          run.count,
      ),
    )

  const streaks =
    runs

      .filter(
        (run) =>
          run.count ===
          maxCount,
      )

      /*
       * If records are tied,
       * newest first.
       */
      .sort(
        (a, b) =>
          new Date(
            b.endedAt,
          ).getTime() -
          new Date(
            a.endedAt,
          ).getTime(),
      )

  return {
    role,
    maxCount,
    streaks,
  }
}

function productIdForRole(
  deal: DerivedMealDeal,
  role: StreakRole,
): string {
  if (
    role === 'main'
  ) {
    return deal.mainProductId
  }

  if (
    role === 'side'
  ) {
    return deal.sideProductId
  }

  return deal.drinkProductId
}

function makeRun(
  dataset: MealDealDataset,
  productId: string,
  count: number,
  startedAt: string,
  endedAt: string,
): StreakRun {
  const product =
    dataset.products[
      productId
    ]

  return {
    productId,

    productName:
      product?.displayName ??
      product?.rawName ??
      productId,

    count,

    startedAt,
    endedAt,
  }
}