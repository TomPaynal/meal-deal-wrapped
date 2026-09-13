import type {
  MealDealDataset,
  MealDealRole,
  PurchaseItem,
  Transaction,
} from '../types/data'

export type PromotionRole = Exclude<
  MealDealRole,
  'unknown'
>

export interface IndexedCandidate {
  item: PurchaseItem
  role: PromotionRole
  sourceIndex: number
}

export type RoleAllocationStatus =
  | 'resolved'
  | 'price-tie'
  | 'missing-price'

export interface RoleAllocation {
  role: PromotionRole

  requiredCount: number

  /*
   * Products we can say definitely
   * received Meal Deal membership.
   */
  selected: IndexedCandidate[]

  /*
   * Equal-price candidates crossing the
   * Tesco allocation boundary.
   *
   * Example:
   * 2 deals, drinks £2.15 / £1.89 / £1.89
   *
   * £2.15 is definitely selected.
   * One £1.89 drink is selected, but
   * without Tesco line-level promotion
   * data we don't know which.
   */
  tiedCandidates: IndexedCandidate[]

  unresolvedCount: number

  status: RoleAllocationStatus
}

export interface TescoPromotionAllocation {
  dealCount: number

  mains: RoleAllocation
  sides: RoleAllocation
  drinks: RoleAllocation
}

function getRole(
  dataset: MealDealDataset,
  item: PurchaseItem,
): PromotionRole | undefined {
  const role =
    dataset.products[
      item.productId
    ]?.mealDealRole

  if (
    role === 'main' ||
    role === 'side' ||
    role === 'drink'
  ) {
    return role
  }

  return undefined
}

export function getEligibleCandidates(
  dataset: MealDealDataset,
  transaction: Transaction,
): IndexedCandidate[] {
  return transaction.items
    .map((item, sourceIndex) => {
      const role =
        getRole(dataset, item)

      if (!role) {
        return undefined
      }

      return {
        item,
        role,
        sourceIndex,
      }
    })
    .filter(
      (
        candidate,
      ): candidate is IndexedCandidate =>
        candidate !== undefined,
    )
}

function allocateRole(
  role: PromotionRole,
  candidates: IndexedCandidate[],
  requiredCount: number,
): RoleAllocation {
  if (requiredCount === 0) {
    return {
      role,
      requiredCount,
      selected: [],
      tiedCandidates: [],
      unresolvedCount: 0,
      status: 'resolved',
    }
  }

  /*
   * If Tesco needs every candidate in
   * this role, price doesn't matter.
   *
   * Example:
   * 2 deals + exactly 2 mains.
   */
  if (
    candidates.length ===
    requiredCount
  ) {
    return {
      role,
      requiredCount,
      selected: [...candidates],
      tiedCandidates: [],
      unresolvedCount: 0,
      status: 'resolved',
    }
  }

  /*
   * If there are surplus candidates,
   * price is required to reproduce
   * Tesco's observed allocation rule.
   */
  if (
    candidates.some(
      ({ item }) =>
        item.shelfPricePence ===
        undefined,
    )
  ) {
    return {
      role,
      requiredCount,
      selected: [],
      tiedCandidates: [
        ...candidates,
      ],
      unresolvedCount:
        requiredCount,
      status: 'missing-price',
    }
  }

  const sorted =
    [...candidates].sort(
      (a, b) => {
        const priceDifference =
          (
            b.item
              .shelfPricePence ??
            0
          ) -
          (
            a.item
              .shelfPricePence ??
            0
          )

        if (
          priceDifference !== 0
        ) {
          return priceDifference
        }

        /*
         * Deliberately DO NOT emulate
         * Tesco's unknown equal-price
         * tie-break here.
         *
         * Our experiments prove that scan
         * order isn't the tie-break, but
         * don't prove whether Tesco uses
         * product ID, catalogue ordering,
         * alphabetical ordering, etc.
         */
        return (
          a.sourceIndex -
          b.sourceIndex
        )
      },
    )

  const boundaryPrice =
    sorted[
      requiredCount - 1
    ].item.shelfPricePence!

  const definitelySelected =
    sorted.filter(
      ({ item }) =>
        item.shelfPricePence! >
        boundaryPrice,
    )

  const boundaryCandidates =
    sorted.filter(
      ({ item }) =>
        item.shelfPricePence ===
        boundaryPrice,
    )

  const slotsAtBoundary =
    requiredCount -
    definitelySelected.length

  /*
   * If every item tied at the boundary
   * fits, there is no actual ambiguity.
   */
  if (
    boundaryCandidates.length ===
    slotsAtBoundary
  ) {
    return {
      role,
      requiredCount,

      selected: [
        ...definitelySelected,
        ...boundaryCandidates,
      ],

      tiedCandidates: [],
      unresolvedCount: 0,

      status: 'resolved',
    }
  }

  /*
   * Tesco definitely chooses some of the
   * tied products, but we cannot yet say
   * which ones from portability data.
   */
  return {
    role,
    requiredCount,

    selected:
      definitelySelected,

    tiedCandidates:
      boundaryCandidates,

    unresolvedCount:
      slotsAtBoundary,

    status: 'price-tie',
  }
}

export function allocateTescoMealDeals(
  dataset: MealDealDataset,
  transaction: Transaction,
): TescoPromotionAllocation {
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
   * Tesco automatically has enough
   * eligible components for this many
   * complete standard Meal Deals.
   *
   * Premium-tier logic will eventually
   * sit above this.
   */
  const dealCount =
    Math.min(
      mains.length,
      sides.length,
      drinks.length,
    )

  return {
    dealCount,

    mains:
      allocateRole(
        'main',
        mains,
        dealCount,
      ),

    sides:
      allocateRole(
        'side',
        sides,
        dealCount,
      ),

    drinks:
      allocateRole(
        'drink',
        drinks,
        dealCount,
      ),
  }
}

export function hasFullyResolvedMembership(
  allocation:
    TescoPromotionAllocation,
): boolean {
  return (
    allocation.dealCount > 0 &&
    allocation.mains.status ===
      'resolved' &&
    allocation.sides.status ===
      'resolved' &&
    allocation.drinks.status ===
      'resolved'
  )
}

export function pairByScanOrder(
  allocation:
    TescoPromotionAllocation,
): IndexedCandidate[][] | undefined {
  if (
    !hasFullyResolvedMembership(
      allocation,
    )
  ) {
    return undefined
  }

  const selected = [
    ...allocation.mains.selected,
    ...allocation.sides.selected,
    ...allocation.drinks.selected,
  ].sort(
    (a, b) =>
      a.sourceIndex -
      b.sourceIndex,
  )

  /*
   * After Tesco membership selection,
   * preserve original scan order and
   * divide into consecutive trios.
   *
   * We only accept this inference when
   * every trio contains exactly one
   * main, snack and drink.
   */
  const groups:
    IndexedCandidate[][] = []

  for (
    let index = 0;
    index < selected.length;
    index += 3
  ) {
    const group =
      selected.slice(
        index,
        index + 3,
      )

    if (group.length !== 3) {
      return undefined
    }

    const roles =
      new Set(
        group.map(
          (candidate) =>
            candidate.role,
        ),
      )

    if (
      roles.size !== 3 ||
      !roles.has('main') ||
      !roles.has('side') ||
      !roles.has('drink')
    ) {
      return undefined
    }

    groups.push(group)
  }

  if (
    groups.length !==
    allocation.dealCount
  ) {
    return undefined
  }

  return groups
}