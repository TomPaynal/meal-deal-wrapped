import type {
  MealDealDataset,
  PurchaseItem,
  Store,
} from '../types/data'

export interface DerivedMealDeal {
  transactionId: string
  occurredAt: string
  store?: Store

  mainProductId: string
  sideProductId: string
  drinkProductId: string

  shelfTotalPence?: number
  paidTotalPence?: number
  savingPence?: number
}

function getItemsForRole(
  dataset: MealDealDataset,
  items: PurchaseItem[],
  role: 'main' | 'side' | 'drink',
): PurchaseItem[] {
  return items.filter((item) => {
    const product =
      dataset.products[item.productId]

    return (
      product?.mealDealRole === role
    )
  })
}

export function deriveMealDeals(
  dataset: MealDealDataset,
): DerivedMealDeal[] {
  const mealDeals: DerivedMealDeal[] = []

  for (const transaction of dataset.transactions) {
    const mains = getItemsForRole(
      dataset,
      transaction.items,
      'main',
    )

    const sides = getItemsForRole(
      dataset,
      transaction.items,
      'side',
    )

    const drinks = getItemsForRole(
      dataset,
      transaction.items,
      'drink',
    )

    // V1 deliberately only accepts completely
    // unambiguous one-main / one-side / one-drink
    // transactions.
    if (
      mains.length !== 1 ||
      sides.length !== 1 ||
      drinks.length !== 1
    ) {
      continue
    }

    const main = mains[0]
    const side = sides[0]
    const drink = drinks[0]

    if (
      main.quantity !== 1 ||
      side.quantity !== 1 ||
      drink.quantity !== 1
    ) {
      continue
    }

    mealDeals.push({
      transactionId: transaction.id,
      occurredAt: transaction.occurredAt,
      store: transaction.store,

      mainProductId: main.productId,
      sideProductId: side.productId,
      drinkProductId: drink.productId,

      shelfTotalPence:
        transaction.totals
          .shelfTotalPence,

      paidTotalPence:
        transaction.totals
          .paidTotalPence,

      savingPence:
        transaction.totals
          .savingPence,
    })
  }

  return mealDeals
}