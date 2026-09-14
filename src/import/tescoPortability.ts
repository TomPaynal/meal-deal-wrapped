import type {
  MealDealDataset,
  Product,
  PurchaseItem,
  Transaction,
} from '../types/data'

import {
  classifyTescoProduct,
} from './tescoProductRoles'

/*
 * Tesco's portability export contains much more data than
 * Meal Deal Wrapped needs.
 *
 * We deliberately import only:
 *
 * - purchase timestamps
 * - product names
 * - quantities
 * - item prices where their meaning can be established
 * - basket paid totals
 * - basket savings
 *
 * We intentionally ignore:
 *
 * - payment details
 * - delivery addresses
 * - phone numbers
 * - delivery notes
 * - request IDs
 */

interface TescoRawItem {
  name?: unknown
  quantity?: unknown
  weight?: unknown
  price?: unknown
  volume?: unknown
}

interface TescoRawPurchase {
  timestamp?: unknown
  type?: unknown

  basketValueGross?: unknown
  basketValueNet?: unknown
  overallBasketSavings?: unknown
  numberOfItems?: unknown

  items?: unknown
}

interface TescoPortabilityExport {
  requestId?: unknown
  purchases?: unknown
  orders?: unknown
}

type LinePriceMode =
  | 'paid'
  | 'shelf'
  | 'equal'
  | 'unresolved'

export interface TescoImportDiagnostics {
  purchaseCount: number
  importedTransactionCount: number
  productCount: number
  itemLineCount: number

  skippedPurchases: number
  unnamedItemLines: number

  basketTotalMismatchCount: number

  paidPriceBasketCount: number
  shelfPriceBasketCount: number
  equalPriceBasketCount: number
  unresolvedPriceBasketCount: number

  incompleteItemListCount: number

  mainProductCount: number
  sideProductCount: number
  drinkProductCount: number
  unknownProductCount: number
}

export interface TescoImportResult {
  dataset: MealDealDataset
  diagnostics: TescoImportDiagnostics
}


/* ---------------------------------------------------------
   SMALL TYPE HELPERS
--------------------------------------------------------- */

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function asFiniteNumber(
  value: unknown,
): number | undefined {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value)
  ) {
    return undefined
  }

  return value
}

function asPositiveNumber(
  value: unknown,
): number | undefined {
  const number =
    asFiniteNumber(value)

  if (
    number === undefined ||
    number <= 0
  ) {
    return undefined
  }

  return number
}

function moneyToPence(
  value: unknown,
): number | undefined {
  const number =
    asFiniteNumber(value)

  if (number === undefined) {
    return undefined
  }

  return Math.round(
    number * 100,
  )
}

function approximatelyEqualPence(
  left: number | undefined,
  right: number | undefined,
  tolerancePence = 1,
): boolean {
  if (
    left === undefined ||
    right === undefined
  ) {
    return false
  }

  return (
    Math.abs(
      left - right,
    ) <= tolerancePence
  )
}


/* ---------------------------------------------------------
   IDS
--------------------------------------------------------- */

function hashString(
  value: string,
): string {
  let hash = 2166136261

  for (
    let index = 0;
    index < value.length;
    index += 1
  ) {
    hash ^=
      value.charCodeAt(index)

    hash =
      Math.imul(
        hash,
        16777619,
      )
  }

  return (
    hash >>> 0
  ).toString(16)
}

function productIdForName(
  rawName: string,
): string {
  return (
    `tesco-product-${hashString(
      rawName,
    )}`
  )
}


/* ---------------------------------------------------------
   TIMESTAMPS
--------------------------------------------------------- */

function normaliseTimestamp(
  value: unknown,
): string | undefined {
  if (
    typeof value !== 'string'
  ) {
    return undefined
  }

  const trimmed =
    value.trim()

  if (!trimmed) {
    return undefined
  }

  return trimmed.replace(
    /^(\d{4}-\d{2}-\d{2})\s+/,
    '$1T',
  )
}


/* ---------------------------------------------------------
   RAW ITEM TOTALS
--------------------------------------------------------- */

function getLineMultiplier(
  item: TescoRawItem,
): number {
  const volume =
    asPositiveNumber(
      item.volume,
    )

  if (volume !== undefined) {
    return volume
  }

  const quantity =
    asPositiveNumber(
      item.quantity,
    )

  if (quantity !== undefined) {
    return quantity
  }

  return 1
}

function getCandidateLinePence(
  item: TescoRawItem,
): number | undefined {
  const price =
    asFiniteNumber(
      item.price,
    )

  if (price === undefined) {
    return undefined
  }

  return Math.round(
    price *
      getLineMultiplier(item) *
      100,
  )
}


/* ---------------------------------------------------------
   RAW PARSING
--------------------------------------------------------- */

function parseRawItem(
  value: unknown,
): TescoRawItem | null {
  if (!isRecord(value)) {
    return null
  }

  return {
    name: value.name,
    quantity: value.quantity,
    weight: value.weight,
    price: value.price,
    volume: value.volume,
  }
}

function parseRawPurchase(
  value: unknown,
): TescoRawPurchase | null {
  if (!isRecord(value)) {
    return null
  }

  return {
    timestamp:
      value.timestamp,

    type:
      value.type,

    basketValueGross:
      value.basketValueGross,

    basketValueNet:
      value.basketValueNet,

    overallBasketSavings:
      value.overallBasketSavings,

    numberOfItems:
      value.numberOfItems,

    items:
      value.items,
  }
}


/* ---------------------------------------------------------
   PRICING MODE
--------------------------------------------------------- */

function detectLinePriceMode(
  candidateItemTotalPence:
    number | undefined,

  paidTotalPence:
    number | undefined,

  savingPence:
    number | undefined,
): LinePriceMode {
  if (
    candidateItemTotalPence ===
      undefined ||
    paidTotalPence ===
      undefined
  ) {
    return 'unresolved'
  }

  const saving =
    savingPence ?? 0

  const shelfTotalPence =
    paidTotalPence +
    saving

  const matchesPaid =
    approximatelyEqualPence(
      candidateItemTotalPence,
      paidTotalPence,
    )

  const matchesShelf =
    approximatelyEqualPence(
      candidateItemTotalPence,
      shelfTotalPence,
    )

  if (
    matchesPaid &&
    matchesShelf
  ) {
    return 'equal'
  }

  if (matchesPaid) {
    return 'paid'
  }

  if (matchesShelf) {
    return 'shelf'
  }

  return 'unresolved'
}


/* ---------------------------------------------------------
   ITEM-LIST COMPLETENESS
--------------------------------------------------------- */

function countReportedItems(
  rawItems: TescoRawItem[],
): number {
  return rawItems.reduce(
    (
      total,
      item,
    ) =>
      total +
      (
        asPositiveNumber(
          item.quantity,
        ) ?? 1
      ),
    0,
  )
}


/* ---------------------------------------------------------
   PUBLIC IMPORTER
--------------------------------------------------------- */

export function importTescoPortability(
  input: unknown,
): TescoImportResult {
  if (!isRecord(input)) {
    throw new Error(
      'Tesco export must be a JSON object.',
    )
  }

  const exportData:
    TescoPortabilityExport = input

  if (
    !Array.isArray(
      exportData.purchases,
    )
  ) {
    throw new Error(
      'This does not look like a Tesco transaction export: purchases[] is missing.',
    )
  }

  const products:
    Record<string, Product> = {}

  const transactions:
    Transaction[] = []

  let itemLineCount = 0
  let skippedPurchases = 0
  let unnamedItemLines = 0

  let paidPriceBasketCount = 0
  let shelfPriceBasketCount = 0
  let equalPriceBasketCount = 0
  let unresolvedPriceBasketCount = 0

  let incompleteItemListCount = 0

  exportData.purchases.forEach(
    (
      rawPurchaseValue,
      purchaseIndex,
    ) => {
      const rawPurchase =
        parseRawPurchase(
          rawPurchaseValue,
        )

      if (!rawPurchase) {
        skippedPurchases += 1
        return
      }

      const occurredAt =
        normaliseTimestamp(
          rawPurchase.timestamp,
        )

      if (!occurredAt) {
        skippedPurchases += 1
        return
      }

      const parsedRawItems =
        Array.isArray(
          rawPurchase.items,
        )
          ? rawPurchase.items
              .map(
                parseRawItem,
              )
              .filter(
                (
                  item,
                ): item is TescoRawItem =>
                  item !== null,
              )
          : []

      const reportedNumberOfItems =
        asFiniteNumber(
          rawPurchase.numberOfItems,
        )

      if (
        reportedNumberOfItems !==
          undefined &&
        Math.abs(
          countReportedItems(
            parsedRawItems,
          ) -
            reportedNumberOfItems,
        ) > 0.001
      ) {
        incompleteItemListCount +=
          1
      }

      const candidateLinePence =
        parsedRawItems.map(
          getCandidateLinePence,
        )

      const allCandidatePricesKnown =
        candidateLinePence.every(
          (
            value,
          ): value is number =>
            value !== undefined,
        )

      const candidateItemTotalPence =
        allCandidatePricesKnown
          ? candidateLinePence.reduce(
              (
                total,
                value,
              ) =>
                total +
                value,
              0,
            )
          : undefined

      const paidTotalPence =
        moneyToPence(
          rawPurchase
            .basketValueNet,
        )

      const savingPence =
        moneyToPence(
          rawPurchase
            .overallBasketSavings,
        )

      const linePriceMode =
        detectLinePriceMode(
          candidateItemTotalPence,
          paidTotalPence,
          savingPence,
        )

      switch (
        linePriceMode
      ) {
        case 'paid':
          paidPriceBasketCount += 1
          break

        case 'shelf':
          shelfPriceBasketCount += 1
          break

        case 'equal':
          equalPriceBasketCount += 1
          break

        case 'unresolved':
          unresolvedPriceBasketCount +=
            1
          break
      }

      const items:
        PurchaseItem[] = []

      parsedRawItems.forEach(
        (
          rawItem,
          itemIndex,
        ) => {
          itemLineCount += 1

          let rawName: string

          if (
            typeof rawItem.name ===
              'string' &&
            rawItem.name.length > 0
          ) {
            rawName =
              rawItem.name
          } else {
            unnamedItemLines += 1

            rawName =
              `Unnamed Tesco item ${purchaseIndex + 1}-${itemIndex + 1}`
          }

          const productId =
            productIdForName(
              rawName,
            )

          if (!products[productId]) {
            const classification =
              classifyTescoProduct(
                rawName,
              )

            products[productId] = {
              id: productId,

              rawName,

              mealDealRole:
                classification
                  .mealDealRole,

              kind:
                classification.kind,
            }
          }

          const quantity =
            asPositiveNumber(
              rawItem.quantity,
            ) ?? 1

          const candidatePricePence =
            getCandidateLinePence(
              rawItem,
            )

          let paidPricePence:
            number | undefined

          let shelfPricePence:
            number | undefined

          if (
            candidatePricePence !==
            undefined
          ) {
            switch (
              linePriceMode
            ) {
              case 'paid':
                paidPricePence =
                  candidatePricePence
                break

              case 'shelf':
                shelfPricePence =
                  candidatePricePence
                break

              case 'equal':
                paidPricePence =
                  candidatePricePence

                shelfPricePence =
                  candidatePricePence
                break

              case 'unresolved':
                break
            }
          }

          items.push({
            productId,

            quantity,

            paidPricePence,
            shelfPricePence,
          })
        },
      )

      const shelfTotalPence =
        paidTotalPence !==
            undefined &&
        savingPence !==
            undefined
          ? paidTotalPence +
            savingPence
          : undefined

      transactions.push({
        id:
          `tesco-${hashString(
            `${occurredAt}:${purchaseIndex}`,
          )}`,

        occurredAt,

        items,

        totals: {
          shelfTotalPence,
          paidTotalPence,
          savingPence,
        },
      })
    },
  )

  const productValues =
    Object.values(
      products,
    )

  const mainProductCount =
    productValues.filter(
      product =>
        product.mealDealRole ===
        'main',
    ).length

  const sideProductCount =
    productValues.filter(
      product =>
        product.mealDealRole ===
        'side',
    ).length

  const drinkProductCount =
    productValues.filter(
      product =>
        product.mealDealRole ===
        'drink',
    ).length

  const unknownProductCount =
    productValues.filter(
      product =>
        product.mealDealRole ===
        'unknown',
    ).length

  return {
    dataset: {
      schemaVersion: 1,

      source:
        'tesco-portability',

      products,

      transactions,
    },

    diagnostics: {
      purchaseCount:
        exportData
          .purchases.length,

      importedTransactionCount:
        transactions.length,

      productCount:
        Object.keys(
          products,
        ).length,

      itemLineCount,

      skippedPurchases,

      unnamedItemLines,

      basketTotalMismatchCount:
        unresolvedPriceBasketCount,

      paidPriceBasketCount,
      shelfPriceBasketCount,
      equalPriceBasketCount,
      unresolvedPriceBasketCount,

      incompleteItemListCount,

      mainProductCount,
      sideProductCount,
      drinkProductCount,
      unknownProductCount,
    },
  }
}