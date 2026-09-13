export type MealDealPriceConfidence =
  | 'assumed'
  | 'verified'

export interface StandardMealDealPricePeriod {
  /*
   * Inclusive start date.
   *
   * YYYY-MM-DD keeps the table easy to
   * audit against historical sources.
   *
   * Undefined means "all earlier dates".
   */
  from?: string

  /*
   * Exclusive end date.
   *
   * Undefined means the period continues
   * to the present.
   */
  to?: string

  clubcardPence: number
  regularPence: number

  confidence:
    MealDealPriceConfidence

  note: string
}

/*
 * Historical Tesco STANDARD Meal Deal
 * prices only.
 *
 * Premium Meal Deals are deliberately
 * excluded for now.
 *
 * Before 11 May 2011 we use £2.00 as a
 * historical fallback. Contemporary
 * evidence confirms Tesco's Meal Deal
 * was £2.00 in 2010, but we do not yet
 * have an exact original start date.
 *
 * From 11 May 2011 onwards, the transition
 * dates below are treated as sufficiently
 * reliable for Meal Deal Wrapped analytics.
 */
export const standardMealDealPriceHistory:
  StandardMealDealPricePeriod[] = [
    {
      to: '2011-05-11',

      clubcardPence: 200,
      regularPence: 200,

      confidence: 'assumed',

      note:
        'Historical fallback. Tesco Meal Deals are known to have cost £2.00 in 2010 and immediately before the May 2011 rise.',
    },

    {
      from: '2011-05-11',
      to: '2012-09-12',

      clubcardPence: 250,
      regularPence: 250,

      confidence: 'verified',

      note:
        'Standard Meal Deal increased from £2.00 to £2.50 in May 2011.',
    },

    {
      from: '2012-09-12',
      to: '2022-02-28',

      clubcardPence: 300,
      regularPence: 300,

      confidence: 'verified',

      note:
        'Standard Meal Deal increased from £2.50 to £3.00 in September 2012.',
    },

    {
      from: '2022-02-28',
      to: '2022-10-24',

      clubcardPence: 300,
      regularPence: 350,

      confidence: 'verified',

      note:
        'Meal Deal moved to Clubcard Prices. Clubcard price remained £3.00 while the regular price increased to £3.50.',
    },

    {
      from: '2022-10-24',
      to: '2024-08-22',

      clubcardPence: 340,
      regularPence: 390,

      confidence: 'verified',

      note:
        'Clubcard price increased to £3.40 and regular price to £3.90.',
    },

    {
      from: '2024-08-22',
      to: '2025-08-21',

      clubcardPence: 360,
      regularPence: 400,

      confidence: 'verified',

      note:
        'Clubcard price increased to £3.60 and regular price to £4.00.',
    },

    {
      from: '2025-08-21',

      clubcardPence: 385,
      regularPence: 425,

      confidence: 'verified',

      note:
        'Clubcard price increased to £3.85 and regular price to £4.25.',
    },
  ]

export type MealDealPriceType =
  | 'clubcard'
  | 'regular'

function getPeriodStartTime(
  period:
    StandardMealDealPricePeriod,
): number {
  if (!period.from) {
    return Number.NEGATIVE_INFINITY
  }

  return new Date(
    `${period.from}T00:00:00Z`,
  ).getTime()
}

function getPeriodEndTime(
  period:
    StandardMealDealPricePeriod,
): number {
  if (!period.to) {
    return Number.POSITIVE_INFINITY
  }

  return new Date(
    `${period.to}T00:00:00Z`,
  ).getTime()
}

export function getStandardMealDealPricePeriod(
  occurredAt: string,
):
  | StandardMealDealPricePeriod
  | undefined {
  const timestamp =
    new Date(
      occurredAt,
    ).getTime()

  if (
    Number.isNaN(timestamp)
  ) {
    return undefined
  }

  return standardMealDealPriceHistory.find(
    (period) => {
      const from =
        getPeriodStartTime(
          period,
        )

      const to =
        getPeriodEndTime(
          period,
        )

      return (
        timestamp >= from &&
        timestamp < to
      )
    },
  )
}

export function getStandardMealDealPricePence(
  occurredAt: string,
  priceType:
    MealDealPriceType =
      'clubcard',
): number | undefined {
  const period =
    getStandardMealDealPricePeriod(
      occurredAt,
    )

  if (!period) {
    return undefined
  }

  return priceType ===
    'clubcard'
    ? period.clubcardPence
    : period.regularPence
}

export function getStandardMealDealPriceConfidence(
  occurredAt: string,
):
  | MealDealPriceConfidence
  | undefined {
  return getStandardMealDealPricePeriod(
    occurredAt,
  )?.confidence
}