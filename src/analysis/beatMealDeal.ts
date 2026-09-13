import type {
  MealDealDataset,
  MealDealRole,
} from '../types/data'

import {
  deriveMealDeals,
  type DerivedMealDeal,
} from './mealDeals'

import {
  getStandardMealDealPriceConfidence,
  getStandardMealDealPricePence,
  type MealDealPriceConfidence,
} from '../data/standardMealDealPrices'

type HeistRole = Exclude<
  MealDealRole,
  'unknown'
>

export interface HeistItem {
  productId: string
  role: HeistRole
  name: string
  shelfPricePence: number
}

export interface HeistDeal {
  id: string
  transactionId: string

  occurredAt: string

  items: HeistItem[]

  shelfTotalPence: number
  dealPricePence: number
  savingPence: number

  savingRatio: number
  valueMultiple: number

  priceConfidence:
    MealDealPriceConfidence

  inferenceSource:
    DerivedMealDeal['inferenceSource']
}

export interface BeatMealDealAnalysis {
  deals: HeistDeal[]

  biggestSaving?:
    HeistDeal

  topSavings:
    HeistDeal[]

  dealCount: number

  lifetimeShelfValuePence:
    number

  lifetimeDealSpendPence:
    number

  lifetimeSavingPence:
    number

  averageShelfValuePence:
    number

  averageSavingPence:
    number

  averageSavingRatio:
    number

  averageValueMultiple:
    number

  assumedPriceDealCount:
    number
}

function getProductName(
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

function getShelfPrice(
  dataset: MealDealDataset,
  deal: DerivedMealDeal,
  productId: string,
): number | undefined {
  const transaction =
    dataset.transactions.find(
      (candidate) =>
        candidate.id ===
        deal.transactionId,
    )

  if (!transaction) {
    return undefined
  }

  const item =
    transaction.items.find(
      (candidate) =>
        candidate.productId ===
        productId,
    )

  return item?.shelfPricePence
}

function makeHeistItem(
  dataset: MealDealDataset,
  deal: DerivedMealDeal,
  productId: string,
  role: HeistRole,
): HeistItem | undefined {
  const shelfPricePence =
    getShelfPrice(
      dataset,
      deal,
      productId,
    )

  if (
    shelfPricePence ===
    undefined
  ) {
    return undefined
  }

  return {
    productId,
    role,

    name:
      getProductName(
        dataset,
        productId,
      ),

    shelfPricePence,
  }
}

function createHeistDeal(
  dataset: MealDealDataset,
  deal: DerivedMealDeal,
): HeistDeal | undefined {
  const main =
    makeHeistItem(
      dataset,
      deal,
      deal.mainProductId,
      'main',
    )

  const side =
    makeHeistItem(
      dataset,
      deal,
      deal.sideProductId,
      'side',
    )

  const drink =
    makeHeistItem(
      dataset,
      deal,
      deal.drinkProductId,
      'drink',
    )

  if (
    !main ||
    !side ||
    !drink
  ) {
    return undefined
  }

  const dealPricePence =
    getStandardMealDealPricePence(
      deal.occurredAt,
    )

  const priceConfidence =
    getStandardMealDealPriceConfidence(
      deal.occurredAt,
    )

  if (
    dealPricePence ===
      undefined ||
    priceConfidence ===
      undefined
  ) {
    return undefined
  }

  const items = [
    main,
    side,
    drink,
  ]

  const shelfTotalPence =
    items.reduce(
      (total, item) =>
        total +
        item.shelfPricePence,
      0,
    )

  const savingPence =
    shelfTotalPence -
    dealPricePence

  /*
   * A negative saving would suggest that
   * the source data does not fit our
   * standard Meal Deal model.
   *
   * Exclude it rather than presenting a
   * misleading result.
   */
  if (savingPence < 0) {
    return undefined
  }

  return {
    id: deal.id,

    transactionId:
      deal.transactionId,

    occurredAt:
      deal.occurredAt,

    items,

    shelfTotalPence,
    dealPricePence,
    savingPence,

    savingRatio:
      shelfTotalPence > 0
        ? savingPence /
          shelfTotalPence
        : 0,

    valueMultiple:
      dealPricePence > 0
        ? shelfTotalPence /
          dealPricePence
        : 0,

    priceConfidence,

    inferenceSource:
      deal.inferenceSource,
  }
}

export function analyseBeatMealDeal(
  dataset: MealDealDataset,
): BeatMealDealAnalysis {
  const deals =
    deriveMealDeals(dataset)
      .map(
        (deal) =>
          createHeistDeal(
            dataset,
            deal,
          ),
      )
      .filter(
        (
          deal,
        ): deal is HeistDeal =>
          deal !== undefined,
      )

  const ranked =
    [...deals].sort(
      (a, b) => {
        if (
          b.savingPence !==
          a.savingPence
        ) {
          return (
            b.savingPence -
            a.savingPence
          )
        }

        if (
          b.savingRatio !==
          a.savingRatio
        ) {
          return (
            b.savingRatio -
            a.savingRatio
          )
        }

        return (
          new Date(
            b.occurredAt,
          ).getTime() -
          new Date(
            a.occurredAt,
          ).getTime()
        )
      },
    )

  const lifetimeShelfValuePence =
    deals.reduce(
      (total, deal) =>
        total +
        deal.shelfTotalPence,
      0,
    )

  const lifetimeDealSpendPence =
    deals.reduce(
      (total, deal) =>
        total +
        deal.dealPricePence,
      0,
    )

  const lifetimeSavingPence =
    deals.reduce(
      (total, deal) =>
        total +
        deal.savingPence,
      0,
    )

  const dealCount =
    deals.length

  const averageShelfValuePence =
    dealCount > 0
      ? Math.round(
          lifetimeShelfValuePence /
            dealCount,
        )
      : 0

  const averageSavingPence =
    dealCount > 0
      ? Math.round(
          lifetimeSavingPence /
            dealCount,
        )
      : 0

  /*
   * Kept internally because it may still
   * be useful elsewhere, but no longer
   * displayed on the headline page.
   */
  const averageSavingRatio =
    lifetimeShelfValuePence > 0
      ? lifetimeSavingPence /
        lifetimeShelfValuePence
      : 0

  const averageValueMultiple =
    lifetimeDealSpendPence > 0
      ? lifetimeShelfValuePence /
        lifetimeDealSpendPence
      : 0

  const assumedPriceDealCount =
    deals.filter(
      (deal) =>
        deal.priceConfidence ===
        'assumed',
    ).length

  return {
    deals,

    biggestSaving:
      ranked[0],

    topSavings:
      ranked.slice(0, 5),

    dealCount,

    lifetimeShelfValuePence,
    lifetimeDealSpendPence,
    lifetimeSavingPence,

    averageShelfValuePence,
    averageSavingPence,
    averageSavingRatio,
    averageValueMultiple,

    assumedPriceDealCount,
  }
}