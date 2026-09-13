import type {
  MealDealDataset,
} from '../types/data'

import {
  deriveMealDeals,
} from './mealDeals'

export interface ComboRankingEntry {
  mainProductId: string
  sideProductId: string
  drinkProductId: string

  mainName: string
  sideName: string
  drinkName: string

  count: number
}

function getProductName(
  dataset: MealDealDataset,
  productId: string,
): string {
  const product =
    dataset.products[productId]

  return (
    product?.displayName ??
    product?.rawName ??
    productId
  )
}

export function getComboRankings(
  dataset: MealDealDataset,
): ComboRankingEntry[] {
  const mealDeals =
    deriveMealDeals(dataset)

  const counts = new Map<
    string,
    {
      mainProductId: string
      sideProductId: string
      drinkProductId: string
      count: number
    }
  >()

  for (const deal of mealDeals) {
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

    counts.set(key, {
      mainProductId:
        deal.mainProductId,

      sideProductId:
        deal.sideProductId,

      drinkProductId:
        deal.drinkProductId,

      count: 1,
    })
  }

  return [...counts.values()]
    .map((combo) => ({
      ...combo,

      mainName: getProductName(
        dataset,
        combo.mainProductId,
      ),

      sideName: getProductName(
        dataset,
        combo.sideProductId,
      ),

      drinkName: getProductName(
        dataset,
        combo.drinkProductId,
      ),
    }))
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count
      }

      return (
        a.mainName.localeCompare(
          b.mainName,
        ) ||
        a.sideName.localeCompare(
          b.sideName,
        ) ||
        a.drinkName.localeCompare(
          b.drinkName,
        )
      )
    })
}