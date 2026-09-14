import type {
  MealDealDataset,
  MealDealRole,
  PurchaseItem,
  Transaction,
} from '../types/data'

export interface TescoMealDealCandidate {
  transactionId: string

  mainCount: number
  sideCount: number
  drinkCount: number
  unknownCount: number

  possibleDealCount: number

  isExactThreeItemCandidate: boolean
  hasExtraItems: boolean
  isMultiDealCandidate: boolean
}

export interface TescoMealDealCandidateDiagnostics {
  /*
   * Transactions containing at least:
   *
   * 1 main
   * 1 snack
   * 1 drink
   */
  candidateTransactionCount: number

  /*
   * Cleanest possible candidate:
   *
   * exactly one main
   * exactly one snack
   * exactly one drink
   * no unknown extras
   */
  exactThreeItemCandidateCount: number

  /*
   * Complete role set plus something else.
   */
  candidateWithExtrasCount: number

  /*
   * Enough classified products for
   * at least two possible complete sets.
   */
  multiDealCandidateTransactionCount: number

  /*
   * Theoretical number of complete sets
   * available across all candidates.
   *
   * Still NOT a final Meal Deal count.
   */
  possibleDealCapacity: number

  /*
   * Any transaction containing at least
   * one recognised Meal Deal-like role,
   * but not all three.
   */
  partialRoleTransactionCount: number

  /*
   * Two-role partials.
   *
   * These are the really useful diagnostics
   * for finding holes in our classifier.
   */
  mainAndSideNoDrinkCount: number
  mainAndDrinkNoSideCount: number
  sideAndDrinkNoMainCount: number

  /*
   * Transactions where only one of the
   * three roles was recognised at all.
   */
  singleRoleOnlyTransactionCount: number

  mainOnlyTransactionCount: number
  sideOnlyTransactionCount: number
  drinkOnlyTransactionCount: number
}

export interface TescoMealDealCandidateResult {
  candidates: TescoMealDealCandidate[]

  diagnostics:
    TescoMealDealCandidateDiagnostics
}


/* ---------------------------------------------------------
   ROLE HELPERS
--------------------------------------------------------- */

function getRole(
  dataset: MealDealDataset,
  item: PurchaseItem,
): MealDealRole {
  return (
    dataset.products[
      item.productId
    ]?.mealDealRole ??
    'unknown'
  )
}

function getUnitCount(
  item: PurchaseItem,
): number {
  if (
    !Number.isFinite(
      item.quantity,
    ) ||
    item.quantity <= 0
  ) {
    return 1
  }

  return Math.max(
    1,
    Math.floor(
      item.quantity,
    ),
  )
}


/* ---------------------------------------------------------
   TRANSACTION ROLE COUNTS
--------------------------------------------------------- */

interface TransactionRoleCounts {
  mainCount: number
  sideCount: number
  drinkCount: number
  unknownCount: number
}

function countTransactionRoles(
  dataset: MealDealDataset,
  transaction: Transaction,
): TransactionRoleCounts {
  const counts:
    TransactionRoleCounts = {
      mainCount: 0,
      sideCount: 0,
      drinkCount: 0,
      unknownCount: 0,
    }

  transaction.items.forEach(
    item => {
      const role =
        getRole(
          dataset,
          item,
        )

      const units =
        getUnitCount(item)

      switch (role) {
        case 'main':
          counts.mainCount +=
            units
          break

        case 'side':
          counts.sideCount +=
            units
          break

        case 'drink':
          counts.drinkCount +=
            units
          break

        case 'unknown':
          counts.unknownCount +=
            units
          break
      }
    },
  )

  return counts
}


/* ---------------------------------------------------------
   PUBLIC DETECTOR
--------------------------------------------------------- */

export function detectTescoMealDealCandidates(
  dataset: MealDealDataset,
): TescoMealDealCandidateResult {
  const candidates:
    TescoMealDealCandidate[] = []

  let partialRoleTransactionCount =
    0

  let mainAndSideNoDrinkCount =
    0

  let mainAndDrinkNoSideCount =
    0

  let sideAndDrinkNoMainCount =
    0

  let singleRoleOnlyTransactionCount =
    0

  let mainOnlyTransactionCount =
    0

  let sideOnlyTransactionCount =
    0

  let drinkOnlyTransactionCount =
    0

  dataset.transactions.forEach(
    transaction => {
      const counts =
        countTransactionRoles(
          dataset,
          transaction,
        )

      const {
        mainCount,
        sideCount,
        drinkCount,
        unknownCount,
      } = counts

      const hasMain =
        mainCount > 0

      const hasSide =
        sideCount > 0

      const hasDrink =
        drinkCount > 0

      const representedRoleCount =
        [
          hasMain,
          hasSide,
          hasDrink,
        ].filter(Boolean).length


      /* -----------------------------------
         PARTIAL ROLE DIAGNOSTICS
      ----------------------------------- */

      if (
        representedRoleCount > 0 &&
        representedRoleCount < 3
      ) {
        partialRoleTransactionCount +=
          1

        if (
          hasMain &&
          hasSide &&
          !hasDrink
        ) {
          mainAndSideNoDrinkCount +=
            1
        }

        if (
          hasMain &&
          !hasSide &&
          hasDrink
        ) {
          mainAndDrinkNoSideCount +=
            1
        }

        if (
          !hasMain &&
          hasSide &&
          hasDrink
        ) {
          sideAndDrinkNoMainCount +=
            1
        }

        if (
          representedRoleCount === 1
        ) {
          singleRoleOnlyTransactionCount +=
            1

          if (hasMain) {
            mainOnlyTransactionCount +=
              1
          }

          if (hasSide) {
            sideOnlyTransactionCount +=
              1
          }

          if (hasDrink) {
            drinkOnlyTransactionCount +=
              1
          }
        }

        return
      }


      /* -----------------------------------
         NOT A COMPLETE CANDIDATE
      ----------------------------------- */

      if (
        !hasMain ||
        !hasSide ||
        !hasDrink
      ) {
        return
      }


      /* -----------------------------------
         COMPLETE ROLE SET
      ----------------------------------- */

      const possibleDealCount =
        Math.min(
          mainCount,
          sideCount,
          drinkCount,
        )

      const totalUnits =
        mainCount +
        sideCount +
        drinkCount +
        unknownCount

      const isExactThreeItemCandidate =
        mainCount === 1 &&
        sideCount === 1 &&
        drinkCount === 1 &&
        unknownCount === 0 &&
        totalUnits === 3

      const hasExtraItems =
        !isExactThreeItemCandidate

      const isMultiDealCandidate =
        possibleDealCount >= 2

      candidates.push({
        transactionId:
          transaction.id,

        mainCount,
        sideCount,
        drinkCount,
        unknownCount,

        possibleDealCount,

        isExactThreeItemCandidate,
        hasExtraItems,
        isMultiDealCandidate,
      })
    },
  )


  /* -------------------------------------------------------
     SUMMARY COUNTS
  ------------------------------------------------------- */

  const exactThreeItemCandidateCount =
    candidates.filter(
      candidate =>
        candidate
          .isExactThreeItemCandidate,
    ).length

  const candidateWithExtrasCount =
    candidates.filter(
      candidate =>
        candidate.hasExtraItems,
    ).length

  const multiDealCandidateTransactionCount =
    candidates.filter(
      candidate =>
        candidate
          .isMultiDealCandidate,
    ).length

  const possibleDealCapacity =
    candidates.reduce(
      (
        total,
        candidate,
      ) =>
        total +
        candidate
          .possibleDealCount,
      0,
    )


  return {
    candidates,

    diagnostics: {
      candidateTransactionCount:
        candidates.length,

      exactThreeItemCandidateCount,

      candidateWithExtrasCount,

      multiDealCandidateTransactionCount,

      possibleDealCapacity,

      partialRoleTransactionCount,

      mainAndSideNoDrinkCount,

      mainAndDrinkNoSideCount,

      sideAndDrinkNoMainCount,

      singleRoleOnlyTransactionCount,

      mainOnlyTransactionCount,

      sideOnlyTransactionCount,

      drinkOnlyTransactionCount,
    },
  }
}