import type {
  MealDealDataset,
  PurchaseItem,
  Transaction,
} from '../types/data'

type Role =
  | 'main'
  | 'side'
  | 'drink'

export type HeuristicStatus =
  | 'resolved'
  | 'ambiguous'
  | 'not-applicable'

export interface HeuristicDeal {
  mainProductId: string
  sideProductId: string
  drinkProductId: string
}

export interface HeuristicResult {
  status: HeuristicStatus
  summary: string
  deals: HeuristicDeal[]
}

export interface DiagnosticAnalysis {
  value: HeuristicResult
  scanOrder: HeuristicResult

  agreement:
    | 'agree'
    | 'conflict'
    | 'partial'
    | 'none'
}

interface EligibleItem {
  item: PurchaseItem
  role: Role
  sourceIndex: number
}

function getRole(
  dataset: MealDealDataset,
  item: PurchaseItem,
): Role | undefined {
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

function getEligibleItems(
  dataset: MealDealDataset,
  transaction: Transaction,
): EligibleItem[] {
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
        value,
      ): value is EligibleItem =>
        value !== undefined,
    )
}

function toDeal(
  items: EligibleItem[],
): HeuristicDeal {
  const main = items.find(
    (item) =>
      item.role === 'main',
  )

  const side = items.find(
    (item) =>
      item.role === 'side',
  )

  const drink = items.find(
    (item) =>
      item.role === 'drink',
  )

  if (
    !main ||
    !side ||
    !drink
  ) {
    throw new Error(
      'Cannot build a deal without one item from each role',
    )
  }

  return {
    mainProductId:
      main.item.productId,

    sideProductId:
      side.item.productId,

    drinkProductId:
      drink.item.productId,
  }
}

function uniqueHighestPriced(
  items: EligibleItem[],
): EligibleItem | undefined {
  if (items.length === 1) {
    return items[0]
  }

  if (
    items.some(
      ({ item }) =>
        item.shelfPricePence ===
        undefined,
    )
  ) {
    return undefined
  }

  const sorted = [...items].sort(
    (a, b) =>
      (b.item.shelfPricePence ?? 0) -
      (a.item.shelfPricePence ?? 0),
  )

  const firstPrice =
    sorted[0].item
      .shelfPricePence

  const secondPrice =
    sorted[1].item
      .shelfPricePence

  if (
    firstPrice ===
    secondPrice
  ) {
    return undefined
  }

  return sorted[0]
}

export function inferByHighestValue(
  dataset: MealDealDataset,
  transaction: Transaction,
): HeuristicResult {
  const eligible =
    getEligibleItems(
      dataset,
      transaction,
    )

  if (
    eligible.some(
      ({ item }) =>
        item.quantity !== 1,
    )
  ) {
    return {
      status: 'ambiguous',
      summary:
        'Quantities greater than one make this heuristic unsafe.',
      deals: [],
    }
  }

  const mains = eligible.filter(
    (item) =>
      item.role === 'main',
  )

  const sides = eligible.filter(
    (item) =>
      item.role === 'side',
  )

  const drinks = eligible.filter(
    (item) =>
      item.role === 'drink',
  )

  const potentialDealCount =
    Math.min(
      mains.length,
      sides.length,
      drinks.length,
    )

  if (potentialDealCount === 0) {
    return {
      status: 'not-applicable',
      summary:
        'Not enough eligible products for a complete Meal Deal.',
      deals: [],
    }
  }

  /*
   * Multiple Meal Deals:
   * price may identify membership,
   * but cannot tell us which items
   * belong together.
   */
  if (potentialDealCount > 1) {
    return {
      status: 'ambiguous',
      summary:
        `${potentialDealCount} complete Meal Deals may be present, but value alone cannot determine their pairings.`,
      deals: [],
    }
  }

  const main =
    uniqueHighestPriced(mains)

  const side =
    uniqueHighestPriced(sides)

  const drink =
    uniqueHighestPriced(drinks)

  if (
    !main ||
    !side ||
    !drink
  ) {
    return {
      status: 'ambiguous',
      summary:
        'At least one Meal Deal role has a highest-price tie or missing price.',
      deals: [],
    }
  }

  return {
    status: 'resolved',

    summary:
      'A unique highest-priced eligible main, snack and drink can be selected.',

    deals: [
      toDeal([
        main,
        side,
        drink,
      ]),
    ],
  }
}

/*
 * Scan-order inference
 *
 * We treat the transaction.items array
 * as the original scan order.
 *
 * A candidate Meal Deal is three
 * consecutive eligible items containing
 * exactly one main, one snack and one drink.
 *
 * We then find the maximum number of
 * non-overlapping three-item groups.
 *
 * If exactly one best grouping exists,
 * scan order gives us a unique answer.
 */
export function inferByScanOrder(
  dataset: MealDealDataset,
  transaction: Transaction,
): HeuristicResult {
  const eligible =
    getEligibleItems(
      dataset,
      transaction,
    )

  if (
    eligible.some(
      ({ item }) =>
        item.quantity !== 1,
    )
  ) {
    return {
      status: 'ambiguous',
      summary:
        'Quantities greater than one make scan grouping unsafe.',
      deals: [],
    }
  }

  function validWindow(
    start: number,
  ): boolean {
    if (
      start + 2 >=
      eligible.length
    ) {
      return false
    }

    const roles = new Set(
      eligible
        .slice(
          start,
          start + 3,
        )
        .map(
          (item) =>
            item.role,
        ),
    )

    return roles.size === 3
  }

  interface SearchResult {
    score: number
    paths: number[][]
  }

  const memo = new Map<
    number,
    SearchResult
  >()

  function dedupePaths(
    paths: number[][],
  ): number[][] {
    const unique =
      new Map<
        string,
        number[]
      >()

    for (const path of paths) {
      unique.set(
        path.join(','),
        path,
      )
    }

    /*
     * We only need to know whether
     * there is one solution or more
     * than one.
     */
    return [
      ...unique.values(),
    ].slice(0, 10)
  }

  function solve(
    index: number,
  ): SearchResult {
    if (
      index >=
      eligible.length
    ) {
      return {
        score: 0,
        paths: [[]],
      }
    }

    const cached =
      memo.get(index)

    if (cached) {
      return cached
    }

    const skipped =
      solve(index + 1)

    let bestScore =
      skipped.score

    let bestPaths =
      skipped.paths

    if (validWindow(index)) {
      const rest =
        solve(index + 3)

      const takeScore =
        rest.score + 1

      const takePaths =
        rest.paths.map(
          (path) => [
            index,
            ...path,
          ],
        )

      if (
        takeScore >
        bestScore
      ) {
        bestScore =
          takeScore

        bestPaths =
          takePaths
      } else if (
        takeScore ===
        bestScore
      ) {
        bestPaths = [
          ...bestPaths,
          ...takePaths,
        ]
      }
    }

    const result = {
      score:
        bestScore,

      paths:
        dedupePaths(
          bestPaths,
        ),
    }

    memo.set(
      index,
      result,
    )

    return result
  }

  const result =
    solve(0)

  if (result.score === 0) {
    return {
      status: 'not-applicable',
      summary:
        'No consecutive main + snack + drink group was found.',
      deals: [],
    }
  }

  if (
    result.paths.length !== 1
  ) {
    return {
      status: 'ambiguous',

      summary:
        `${result.score} Meal Deal group${result.score === 1 ? '' : 's'} can be formed, but more than one equally good scan-order interpretation exists.`,

      deals: [],
    }
  }

  const starts =
    result.paths[0]

  const deals =
    starts.map(
      (start) =>
        toDeal(
          eligible.slice(
            start,
            start + 3,
          ),
        ),
    )

  return {
    status: 'resolved',

    summary:
      `${deals.length} unique consecutive Meal Deal group${deals.length === 1 ? '' : 's'} found from scan order.`,

    deals,
  }
}

function canonicalDeal(
  deal: HeuristicDeal,
): string {
  return [
    deal.mainProductId,
    deal.sideProductId,
    deal.drinkProductId,
  ].join('|')
}

function sameDeals(
  a: HeuristicDeal[],
  b: HeuristicDeal[],
): boolean {
  if (
    a.length !==
    b.length
  ) {
    return false
  }

  const first = a
    .map(canonicalDeal)
    .sort()

  const second = b
    .map(canonicalDeal)
    .sort()

  return first.every(
    (value, index) =>
      value ===
      second[index],
  )
}

export function analyseResolverHeuristics(
  dataset: MealDealDataset,
  transaction: Transaction,
): DiagnosticAnalysis {
  const value =
    inferByHighestValue(
      dataset,
      transaction,
    )

  const scanOrder =
    inferByScanOrder(
      dataset,
      transaction,
    )

  let agreement:
    DiagnosticAnalysis['agreement'] =
      'none'

  if (
    value.status === 'resolved' &&
    scanOrder.status ===
      'resolved'
  ) {
    agreement =
      sameDeals(
        value.deals,
        scanOrder.deals,
      )
        ? 'agree'
        : 'conflict'
  } else if (
    value.status === 'resolved' ||
    scanOrder.status ===
      'resolved'
  ) {
    agreement = 'partial'
  }

  return {
    value,
    scanOrder,
    agreement,
  }
}