import type {
  MealDealDataset,
  MealDealRole,
  Store,
  Transaction,
} from '../types/data'

import {
  allocateTescoMealDeals,
  getEligibleCandidates,
  pairByScanOrder,
  type IndexedCandidate,
} from './tescoPromotionModel'

export type ResolvedMealDealRole =
  Exclude<
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

export type MealDealInferenceSource =
  | 'tesco'
  | 'unambiguous'
  | 'tesco-allocation'
  | 'scan-order'

export interface ResolvedMealDealMembership {
  transactionId: string

  dealId?: string

  occurredAt: string
  store?: Store

  productId: string
  role: ResolvedMealDealRole

  tier: MealDealTier

  certainty:
    MealDealCertainty

  inferenceSource:
    MealDealInferenceSource
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

  membershipCertainty:
    MealDealCertainty

  pairingCertainty:
    MealDealCertainty

  inferenceSource:
    MealDealInferenceSource

  shelfTotalPence?: number
  paidTotalPence?: number
  savingPence?: number

  savingSource:
    MealDealSavingSource
}

export type AmbiguousMealDealReason =
  | 'multiple-quantity'
  | 'price-tie'
  | 'missing-price'
  | 'pairing-ambiguous'

export interface AmbiguousMealDealBasket {
  transactionId: string

  occurredAt: string
  store?: Store

  reason:
    AmbiguousMealDealReason

  inferredDealCount: number

  candidateMainProductIds:
    string[]

  candidateSideProductIds:
    string[]

  candidateDrinkProductIds:
    string[]
}

export interface MealDealResolutionResult {
  /*
   * Exact combos we are willing to use
   * in combo rankings.
   */
  deals: DerivedMealDeal[]

  /*
   * Individual products definitely
   * allocated to Meal Deals.
   *
   * Safe for category races.
   */
  memberships:
    ResolvedMealDealMembership[]

  /*
   * Baskets where some useful information
   * may exist, but exact resolution wasn't
   * possible.
   */
  ambiguousBaskets:
    AmbiguousMealDealBasket[]
}

function getCandidateIds(
  candidates:
    IndexedCandidate[],
  role:
    ResolvedMealDealRole,
): string[] {
  return candidates
    .filter(
      (candidate) =>
        candidate.role === role,
    )
    .map(
      (candidate) =>
        candidate.item.productId,
    )
}

function getShelfTotal(
  group:
    IndexedCandidate[],
): number | undefined {
  if (
    group.some(
      ({ item }) =>
        item.shelfPricePence ===
        undefined,
    )
  ) {
    return undefined
  }

  return group.reduce(
    (total, { item }) =>
      total +
      (
        item.shelfPricePence ??
        0
      ),
    0,
  )
}

function isPureSingleDealBasket(
  transaction: Transaction,
): boolean {
  return (
    transaction.items.length === 3 &&
    transaction.items.every(
      (item) =>
        item.quantity === 1,
    )
  )
}

function getCandidateForRole(
  group:
    IndexedCandidate[],
  role:
    ResolvedMealDealRole,
): IndexedCandidate {
  const candidate =
    group.find(
      (item) =>
        item.role === role,
    )

  if (!candidate) {
    throw new Error(
      `Missing ${role} in resolved Meal Deal`,
    )
  }

  return candidate
}

function createDerivedDeal(
  transaction: Transaction,
  group: IndexedCandidate[],
  dealIndex: number,
  certainty:
    MealDealCertainty,
  inferenceSource:
    MealDealInferenceSource,
): DerivedMealDeal {
  const main =
    getCandidateForRole(
      group,
      'main',
    )

  const side =
    getCandidateForRole(
      group,
      'side',
    )

  const drink =
    getCandidateForRole(
      group,
      'drink',
    )

  const pureSingleDealBasket =
    isPureSingleDealBasket(
      transaction,
    )

  const savingPence =
    pureSingleDealBasket
      ? transaction.totals
          .savingPence
      : undefined

  return {
    id:
      `${transaction.id}:deal-${dealIndex + 1}`,

    transactionId:
      transaction.id,

    occurredAt:
      transaction.occurredAt,

    store:
      transaction.store,

    mainProductId:
      main.item.productId,

    sideProductId:
      side.item.productId,

    drinkProductId:
      drink.item.productId,

    tier: 'unknown',

    membershipCertainty:
      certainty,

    pairingCertainty:
      certainty,

    inferenceSource,

    shelfTotalPence:
      getShelfTotal(group),

    paidTotalPence:
      pureSingleDealBasket
        ? transaction.totals
            .paidTotalPence
        : undefined,

    savingPence,

    savingSource:
      savingPence !== undefined
        ? 'tesco'
        : 'unknown',
  }
}

export function resolveMealDeals(
  dataset: MealDealDataset,
): MealDealResolutionResult {
  const deals:
    DerivedMealDeal[] = []

  const memberships:
    ResolvedMealDealMembership[] = []

  const ambiguousBaskets:
    AmbiguousMealDealBasket[] = []

  for (
    const transaction
    of dataset.transactions
  ) {
    const candidates =
      getEligibleCandidates(
        dataset,
        transaction,
      )

    const mains =
      candidates.filter(
        (candidate) =>
          candidate.role === 'main',
      )

    const sides =
      candidates.filter(
        (candidate) =>
          candidate.role === 'side',
      )

    const drinks =
      candidates.filter(
        (candidate) =>
          candidate.role === 'drink',
      )

    /*
     * Standalone eligible products never
     * become Meal Deal stats.
     */
    if (
      mains.length === 0 ||
      sides.length === 0 ||
      drinks.length === 0
    ) {
      continue
    }

    /*
     * Quantity > 1 needs unit expansion
     * before we can safely reason about
     * scan ordering.
     *
     * Keep this conservative for now.
     */
    if (
      candidates.some(
        ({ item }) =>
          item.quantity !== 1,
      )
    ) {
      ambiguousBaskets.push({
        transactionId:
          transaction.id,

        occurredAt:
          transaction.occurredAt,

        store:
          transaction.store,

        reason:
          'multiple-quantity',

        inferredDealCount:
          Math.min(
            mains.length,
            sides.length,
            drinks.length,
          ),

        candidateMainProductIds:
          getCandidateIds(
            candidates,
            'main',
          ),

        candidateSideProductIds:
          getCandidateIds(
            candidates,
            'side',
          ),

        candidateDrinkProductIds:
          getCandidateIds(
            candidates,
            'drink',
          ),
      })

      continue
    }

    const allocation =
      allocateTescoMealDeals(
        dataset,
        transaction,
      )

    if (
      allocation.dealCount === 0
    ) {
      continue
    }

    const exactlyOneCandidatePerRole =
      mains.length === 1 &&
      sides.length === 1 &&
      drinks.length === 1

    const membershipCertainty:
      MealDealCertainty =
        exactlyOneCandidatePerRole
          ? 'unambiguous'
          : 'inferred'

    const membershipSource:
      MealDealInferenceSource =
        exactlyOneCandidatePerRole
          ? 'unambiguous'
          : 'tesco-allocation'

    const allAllocations = [
      allocation.mains,
      allocation.sides,
      allocation.drinks,
    ]

    /*
     * Even when a basket isn't completely
     * resolvable, definitely-selected
     * products are still valid membership
     * stats.
     */
    for (
      const roleAllocation
      of allAllocations
    ) {
      for (
        const selected
        of roleAllocation.selected
      ) {
        memberships.push({
          transactionId:
            transaction.id,

          occurredAt:
            transaction.occurredAt,

          store:
            transaction.store,

          productId:
            selected.item.productId,

          role:
            selected.role,

          tier: 'unknown',

          certainty:
            membershipCertainty,

          inferenceSource:
            membershipSource,
        })
      }
    }

    const unresolvedAllocation =
      allAllocations.find(
        (roleAllocation) =>
          roleAllocation.status !==
          'resolved',
      )

    if (unresolvedAllocation) {
      ambiguousBaskets.push({
        transactionId:
          transaction.id,

        occurredAt:
          transaction.occurredAt,

        store:
          transaction.store,

        reason:
          unresolvedAllocation
            .status ===
          'missing-price'
            ? 'missing-price'
            : 'price-tie',

        inferredDealCount:
          allocation.dealCount,

        candidateMainProductIds:
          getCandidateIds(
            candidates,
            'main',
          ),

        candidateSideProductIds:
          getCandidateIds(
            candidates,
            'side',
          ),

        candidateDrinkProductIds:
          getCandidateIds(
            candidates,
            'drink',
          ),
      })

      continue
    }

    /*
     * One deal + fully resolved Tesco
     * allocation needs no scan-order leap.
     */
    if (
      allocation.dealCount === 1
    ) {
      const group = [
        allocation.mains
          .selected[0],

        allocation.sides
          .selected[0],

        allocation.drinks
          .selected[0],
      ]

      const deal =
        createDerivedDeal(
          transaction,
          group,
          0,
          membershipCertainty,
          membershipSource,
        )

      deals.push(deal)

      /*
       * Attach deal ID to these memberships.
       */
      for (
        let index =
          memberships.length - 1;
        index >= 0;
        index -= 1
      ) {
        const membership =
          memberships[index]

        if (
          membership.transactionId !==
          transaction.id
        ) {
          break
        }

        membership.dealId =
          deal.id
      }

      continue
    }

    /*
     * Multiple deals:
     *
     * Tesco's price model tells us WHICH
     * items participated.
     *
     * Original item order is then used to
     * infer WHICH THREE travelled together.
     *
     * We only accept the pairing if the
     * selected products form clean
     * main/snack/drink trios in scan order.
     */
    const scanOrderGroups =
      pairByScanOrder(
        allocation,
      )

    if (!scanOrderGroups) {
      ambiguousBaskets.push({
        transactionId:
          transaction.id,

        occurredAt:
          transaction.occurredAt,

        store:
          transaction.store,

        reason:
          'pairing-ambiguous',

        inferredDealCount:
          allocation.dealCount,

        candidateMainProductIds:
          getCandidateIds(
            candidates,
            'main',
          ),

        candidateSideProductIds:
          getCandidateIds(
            candidates,
            'side',
          ),

        candidateDrinkProductIds:
          getCandidateIds(
            candidates,
            'drink',
          ),
      })

      /*
       * Memberships remain valid and can
       * still appear in races.
       */
      continue
    }

    const transactionDeals =
      scanOrderGroups.map(
        (group, index) =>
          createDerivedDeal(
            transaction,
            group,
            index,
            'inferred',
            'scan-order',
          ),
      )

    deals.push(
      ...transactionDeals,
    )

    /*
     * Link each membership to its inferred
     * scan-order deal.
     *
     * Product IDs are sufficient for our
     * current quantity=1 baskets.
     */
    for (
      const deal
      of transactionDeals
    ) {
      const productIds =
        new Set([
          deal.mainProductId,
          deal.sideProductId,
          deal.drinkProductId,
        ])

      for (
        let index =
          memberships.length - 1;
        index >= 0;
        index -= 1
      ) {
        const membership =
          memberships[index]

        if (
          membership.transactionId !==
          transaction.id
        ) {
          break
        }

        if (
          productIds.has(
            membership.productId,
          )
        ) {
          membership.dealId =
            deal.id

          membership.certainty =
            'inferred'

          membership.inferenceSource =
            'scan-order'
        }
      }
    }
  }

  return {
    deals,
    memberships,
    ambiguousBaskets,
  }
}

export function deriveMealDeals(
  dataset: MealDealDataset,
): DerivedMealDeal[] {
  return resolveMealDeals(
    dataset,
  ).deals
}