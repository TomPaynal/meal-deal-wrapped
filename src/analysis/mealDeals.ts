import type {
  MealDealDataset,
  MealDealRole,
  PurchaseItem,
  Store,
  Transaction,
} from '../types/data'

export type ResolvedMealDealRole = Exclude<
  MealDealRole,
  'unknown'
>

export type MealDealTier =
  | 'standard'
  | 'premium'
  | 'unknown'

export type MealDealCertainty =
  | 'confirmed'
  | 'unambiguous'
  | 'inferred'

export type MealDealSavingSource =
  | 'tesco'
  | 'derived-standard'
  | 'derived-premium'
  | 'estimated'
  | 'unknown'

export interface ResolvedMealDealMembership {
  transactionId: string

  /*
   * Present when we know exactly which
   * three products belonged together.
   */
  dealId?: string

  occurredAt: string
  store?: Store

  productId: string
  role: ResolvedMealDealRole

  tier: MealDealTier
  certainty: MealDealCertainty
}

export interface DerivedMealDeal {
  id: string
  transactionId: string

  occurredAt: string
  store?: Store

  mainProductId: string
  sideProductId: string
  drinkProductId: string

  tier: MealDealTier

  /*
   * Membership = are these definitely
   * Meal Deal products?
   *
   * Pairing = are we sure these exact
   * three products belonged together?
   */
  membershipCertainty:
    MealDealCertainty

  pairingCertainty:
    MealDealCertainty

  shelfTotalPence?: number
  paidTotalPence?: number
  savingPence?: number

  savingSource:
    MealDealSavingSource
}

export type AmbiguousMealDealReason =
  | 'multiple-candidates'
  | 'multiple-quantity'

export interface AmbiguousMealDealBasket {
  transactionId: string

  occurredAt: string
  store?: Store

  reason: AmbiguousMealDealReason

  candidateMainProductIds: string[]
  candidateSideProductIds: string[]
  candidateDrinkProductIds: string[]
}

export interface MealDealResolutionResult {
  /*
   * Exact main + side + drink combinations.
   * Safe for combo analysis.
   */
  deals: DerivedMealDeal[]

  /*
   * Individual products we know were
   * Meal Deal members.
   *
   * These can eventually contain products
   * from baskets where membership is known
   * but exact pairing is not.
   *
   * Safe for mains/snacks/drinks races.
   */
  memberships:
    ResolvedMealDealMembership[]

  /*
   * Potential Meal Deal baskets where
   * we refuse to guess.
   */
  ambiguousBaskets:
    AmbiguousMealDealBasket[]
}

function getItemsForRole(
  dataset: MealDealDataset,
  items: PurchaseItem[],
  role: ResolvedMealDealRole,
): PurchaseItem[] {
  return items.filter((item) => {
    const product =
      dataset.products[item.productId]

    return (
      product?.mealDealRole === role
    )
  })
}

function getCandidateProductIds(
  items: PurchaseItem[],
): string[] {
  return items.map(
    (item) => item.productId,
  )
}

function getSelectedShelfTotal(
  items: PurchaseItem[],
): number | undefined {
  if (
    items.some(
      (item) =>
        item.shelfPricePence ===
        undefined,
    )
  ) {
    return undefined
  }

  return items.reduce(
    (total, item) =>
      total +
      (item.shelfPricePence ?? 0),
    0,
  )
}

function isPureThreeItemBasket(
  transaction: Transaction,
): boolean {
  return (
    transaction.items.length === 3 &&
    transaction.items.every(
      (item) => item.quantity === 1,
    )
  )
}

export function resolveMealDeals(
  dataset: MealDealDataset,
): MealDealResolutionResult {
  const deals: DerivedMealDeal[] = []

  const memberships:
    ResolvedMealDealMembership[] = []

  const ambiguousBaskets:
    AmbiguousMealDealBasket[] = []

  for (
    const transaction
    of dataset.transactions
  ) {
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

    /*
     * If any role is completely absent,
     * this is not even a candidate complete
     * Meal Deal.
     *
     * A standalone Pepsi, sandwich, etc.
     * therefore disappears here.
     */
    if (
      mains.length === 0 ||
      sides.length === 0 ||
      drinks.length === 0
    ) {
      continue
    }

    const allCandidates = [
      ...mains,
      ...sides,
      ...drinks,
    ]

    const hasMultipleQuantity =
      allCandidates.some(
        (item) => item.quantity !== 1,
      )

    const hasExactlyOneCandidatePerRole =
      mains.length === 1 &&
      sides.length === 1 &&
      drinks.length === 1

    /*
     * V1 refuses to guess whenever more
     * than one candidate exists.
     *
     * Later this is where our historical
     * Meal Deal pricing / highest-value
     * inference engine will slot in.
     */
    if (
      hasMultipleQuantity ||
      !hasExactlyOneCandidatePerRole
    ) {
      ambiguousBaskets.push({
        transactionId:
          transaction.id,

        occurredAt:
          transaction.occurredAt,

        store:
          transaction.store,

        reason:
          hasMultipleQuantity
            ? 'multiple-quantity'
            : 'multiple-candidates',

        candidateMainProductIds:
          getCandidateProductIds(
            mains,
          ),

        candidateSideProductIds:
          getCandidateProductIds(
            sides,
          ),

        candidateDrinkProductIds:
          getCandidateProductIds(
            drinks,
          ),
      })

      continue
    }

    const main = mains[0]
    const side = sides[0]
    const drink = drinks[0]

    const dealId =
      `${transaction.id}:deal-1`

    const selectedItems = [
      main,
      side,
      drink,
    ]

    const shelfTotalPence =
      getSelectedShelfTotal(
        selectedItems,
      )

    /*
     * Basket-level paid/saving values are
     * only safe to attribute directly to
     * the Meal Deal when the basket itself
     * consists solely of those three items.
     *
     * If toothpaste etc. was also bought,
     * we leave these undefined rather than
     * silently misattribute basket savings.
     */
    const pureThreeItemBasket =
      isPureThreeItemBasket(
        transaction,
      )

    const paidTotalPence =
      pureThreeItemBasket
        ? transaction.totals
            .paidTotalPence
        : undefined

    const savingPence =
      pureThreeItemBasket
        ? transaction.totals
            .savingPence
        : undefined

    const savingSource:
      MealDealSavingSource =
        savingPence !== undefined
          ? 'tesco'
          : 'unknown'

    const deal: DerivedMealDeal = {
      id: dealId,

      transactionId:
        transaction.id,

      occurredAt:
        transaction.occurredAt,

      store:
        transaction.store,

      mainProductId:
        main.productId,

      sideProductId:
        side.productId,

      drinkProductId:
        drink.productId,

      /*
       * We cannot infer tier yet.
       * That comes once we have historical
       * standard/premium pricing rules.
       */
      tier: 'unknown',

      membershipCertainty:
        'unambiguous',

      pairingCertainty:
        'unambiguous',

      shelfTotalPence,
      paidTotalPence,
      savingPence,

      savingSource,
    }

    deals.push(deal)

    memberships.push(
      {
        transactionId:
          transaction.id,

        dealId,

        occurredAt:
          transaction.occurredAt,

        store:
          transaction.store,

        productId:
          main.productId,

        role: 'main',

        tier: 'unknown',

        certainty:
          'unambiguous',
      },
      {
        transactionId:
          transaction.id,

        dealId,

        occurredAt:
          transaction.occurredAt,

        store:
          transaction.store,

        productId:
          side.productId,

        role: 'side',

        tier: 'unknown',

        certainty:
          'unambiguous',
      },
      {
        transactionId:
          transaction.id,

        dealId,

        occurredAt:
          transaction.occurredAt,

        store:
          transaction.store,

        productId:
          drink.productId,

        role: 'drink',

        tier: 'unknown',

        certainty:
          'unambiguous',
      },
    )
  }

  return {
    deals,
    memberships,
    ambiguousBaskets,
  }
}

/*
 * Backwards-compatible convenience
 * function for analyses that only care
 * about exact three-item combinations.
 */
export function deriveMealDeals(
  dataset: MealDealDataset,
): DerivedMealDeal[] {
  return resolveMealDeals(
    dataset,
  ).deals
}