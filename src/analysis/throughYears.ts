import type {
  MealDealDataset,
} from '../types/data'

import {
  resolveMealDeals,
  type ResolvedMealDealRole,
} from './mealDeals'

export type TimeGrouping =
  | 'month'
  | 'year'

export type ThroughYearsRole =
  ResolvedMealDealRole

export interface ThroughYearsRange {
  from?: string
  to?: string
}

export interface DatasetDateBounds {
  from: string
  to: string
}

export interface TimelinePoint {
  key: string
  label: string
  shortLabel: string
  count: number
}

export interface PeriodFavourite {
  key: string
  label: string

  leaderNames: string[]

  count: number
  total: number
  share: number
}

export interface BusiestPeriod {
  key: string
  label: string
  count: number
}

export interface LongestGap {
  days: number
  from: string
  to: string
}

export interface ThroughYearsSummary {
  totalDeals: number

  busiestMonth?:
    BusiestPeriod

  busiestYear?:
    BusiestPeriod

  longestGap?:
    LongestGap
}

export interface ThroughYearsAnalysis {
  timeline: TimelinePoint[]

  favourites:
    PeriodFavourite[]

  summary:
    ThroughYearsSummary
}

function parseRangeStart(
  value?: string,
): number {
  if (!value) {
    return Number.NEGATIVE_INFINITY
  }

  return new Date(
    `${value}T00:00:00Z`,
  ).getTime()
}

function parseRangeEnd(
  value?: string,
): number {
  if (!value) {
    return Number.POSITIVE_INFINITY
  }

  return new Date(
    `${value}T23:59:59.999Z`,
  ).getTime()
}

function isInRange(
  occurredAt: string,
  range: ThroughYearsRange,
): boolean {
  const timestamp =
    new Date(
      occurredAt,
    ).getTime()

  if (
    Number.isNaN(timestamp)
  ) {
    return false
  }

  return (
    timestamp >=
      parseRangeStart(
        range.from,
      ) &&
    timestamp <=
      parseRangeEnd(
        range.to,
      )
  )
}

function dateToInputValue(
  occurredAt: string,
): string {
  return new Date(
    occurredAt,
  )
    .toISOString()
    .slice(0, 10)
}

function getBucketKey(
  occurredAt: string,
  grouping: TimeGrouping,
): string {
  const date =
    new Date(
      occurredAt,
    )

  const year =
    date.getUTCFullYear()

  if (
    grouping === 'year'
  ) {
    return String(year)
  }

  const month =
    String(
      date.getUTCMonth() + 1,
    ).padStart(
      2,
      '0',
    )

  return `${year}-${month}`
}

function getBucketLabel(
  key: string,
  grouping: TimeGrouping,
): string {
  if (
    grouping === 'year'
  ) {
    return key
  }

  const [
    yearText,
    monthText,
  ] = key.split('-')

  const date =
    new Date(
      Date.UTC(
        Number(yearText),
        Number(monthText) - 1,
        1,
      ),
    )

  return date.toLocaleDateString(
    'en-GB',
    {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    },
  )
}

function getBucketShortLabel(
  key: string,
  grouping: TimeGrouping,
): string {
  if (
    grouping === 'year'
  ) {
    return key
  }

  const [
    yearText,
    monthText,
  ] = key.split('-')

  const date =
    new Date(
      Date.UTC(
        Number(yearText),
        Number(monthText) - 1,
        1,
      ),
    )

  return date.toLocaleDateString(
    'en-GB',
    {
      month: 'short',
      year: '2-digit',
      timeZone: 'UTC',
    },
  )
}

function getBucketStart(
  date: Date,
  grouping: TimeGrouping,
): Date {
  if (
    grouping === 'year'
  ) {
    return new Date(
      Date.UTC(
        date.getUTCFullYear(),
        0,
        1,
      ),
    )
  }

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      1,
    ),
  )
}

function nextBucket(
  date: Date,
  grouping: TimeGrouping,
): Date {
  if (
    grouping === 'year'
  ) {
    return new Date(
      Date.UTC(
        date.getUTCFullYear() + 1,
        0,
        1,
      ),
    )
  }

  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      1,
    ),
  )
}

function makeBucketKey(
  date: Date,
  grouping: TimeGrouping,
): string {
  const year =
    date.getUTCFullYear()

  if (
    grouping === 'year'
  ) {
    return String(year)
  }

  const month =
    String(
      date.getUTCMonth() + 1,
    ).padStart(
      2,
      '0',
    )

  return `${year}-${month}`
}

function createContinuousBuckets(
  start: Date,
  end: Date,
  grouping: TimeGrouping,
): string[] {
  if (
    start.getTime() >
    end.getTime()
  ) {
    return []
  }

  const keys: string[] = []

  let current =
    getBucketStart(
      start,
      grouping,
    )

  const finalBucket =
    getBucketStart(
      end,
      grouping,
    )

  while (
    current.getTime() <=
    finalBucket.getTime()
  ) {
    keys.push(
      makeBucketKey(
        current,
        grouping,
      ),
    )

    current =
      nextBucket(
        current,
        grouping,
      )
  }

  return keys
}

function findBusiest(
  counts:
    Map<string, number>,
  grouping: TimeGrouping,
): BusiestPeriod | undefined {
  let winner:
    [string, number]
    | undefined

  for (
    const entry
    of counts.entries()
  ) {
    if (
      !winner ||
      entry[1] > winner[1]
    ) {
      winner = entry
    }
  }

  if (!winner) {
    return undefined
  }

  return {
    key: winner[0],

    label:
      getBucketLabel(
        winner[0],
        grouping,
      ),

    count:
      winner[1],
  }
}

function getLongestGap(
  dates: string[],
): LongestGap | undefined {
  if (
    dates.length < 2
  ) {
    return undefined
  }

  const sorted =
    [...dates].sort(
      (a, b) =>
        new Date(
          a,
        ).getTime() -
        new Date(
          b,
        ).getTime(),
    )

  let longest:
    LongestGap | undefined

  for (
    let index = 1;
    index < sorted.length;
    index += 1
  ) {
    const previous =
      new Date(
        sorted[
          index - 1
        ],
      )

    const current =
      new Date(
        sorted[index],
      )

    const difference =
      current.getTime() -
      previous.getTime()

    const days =
      Math.floor(
        difference /
          (
            1000 *
            60 *
            60 *
            24
          ),
      )

    if (
      !longest ||
      days >
        longest.days
    ) {
      longest = {
        days,

        from:
          sorted[
            index - 1
          ],

        to:
          sorted[index],
      }
    }
  }

  return longest
}

export function getThroughYearsBounds(
  dataset: MealDealDataset,
): DatasetDateBounds | undefined {
  const resolution =
    resolveMealDeals(
      dataset,
    )

  const dates = [
    ...resolution.deals.map(
      (deal) =>
        deal.occurredAt,
    ),

    ...resolution.memberships.map(
      (membership) =>
        membership.occurredAt,
    ),
  ]

  if (
    dates.length === 0
  ) {
    return undefined
  }

  const sorted =
    dates.sort(
      (a, b) =>
        new Date(
          a,
        ).getTime() -
        new Date(
          b,
        ).getTime(),
    )

  return {
    from:
      dateToInputValue(
        sorted[0],
      ),

    to:
      dateToInputValue(
        sorted[
          sorted.length - 1
        ],
      ),
  }
}

export function analyseThroughYears(
  dataset: MealDealDataset,
  grouping: TimeGrouping,
  role: ThroughYearsRole,
  range:
    ThroughYearsRange = {},
): ThroughYearsAnalysis {
  const resolution =
    resolveMealDeals(
      dataset,
    )

  const filteredDeals =
    resolution.deals.filter(
      (deal) =>
        isInRange(
          deal.occurredAt,
          range,
        ),
    )

  const filteredMemberships =
    resolution.memberships.filter(
      (membership) =>
        membership.role === role &&
        isInRange(
          membership.occurredAt,
          range,
        ),
    )

  const dealDates =
    filteredDeals.map(
      (deal) =>
        deal.occurredAt,
    )

  const overallDates = [
    ...dealDates,

    ...filteredMemberships.map(
      (membership) =>
        membership.occurredAt,
    ),
  ]

  let timeline:
    TimelinePoint[] = []

  if (
    overallDates.length > 0 ||
    range.from ||
    range.to
  ) {
    const availableDates =
      overallDates.length > 0
        ? overallDates
        : [
            range.from ??
              range.to!,
            range.to ??
              range.from!,
          ]

    const earliest =
      range.from
        ? new Date(
            `${range.from}T00:00:00Z`,
          )
        : new Date(
            [...availableDates].sort(
              (a, b) =>
                new Date(
                  a,
                ).getTime() -
                new Date(
                  b,
                ).getTime(),
            )[0],
          )

    const latest =
      range.to
        ? new Date(
            `${range.to}T23:59:59.999Z`,
          )
        : new Date(
            [...availableDates].sort(
              (a, b) =>
                new Date(
                  b,
                ).getTime() -
                new Date(
                  a,
                ).getTime(),
            )[0],
          )

    const counts =
      new Map<
        string,
        number
      >()

    for (
      const deal
      of filteredDeals
    ) {
      const key =
        getBucketKey(
          deal.occurredAt,
          grouping,
        )

      counts.set(
        key,
        (
          counts.get(key) ??
          0
        ) + 1,
      )
    }

    timeline =
      createContinuousBuckets(
        earliest,
        latest,
        grouping,
      ).map(
        (key) => ({
          key,

          label:
            getBucketLabel(
              key,
              grouping,
            ),

          shortLabel:
            getBucketShortLabel(
              key,
              grouping,
            ),

          count:
            counts.get(
              key,
            ) ?? 0,
        }),
      )
  }

  const favouriteCounts =
    new Map<
      string,
      Map<string, number>
    >()

  for (
    const membership
    of filteredMemberships
  ) {
    const key =
      getBucketKey(
        membership.occurredAt,
        grouping,
      )

    const productCounts =
      favouriteCounts.get(
        key,
      ) ??
      new Map<
        string,
        number
      >()

    productCounts.set(
      membership.productId,
      (
        productCounts.get(
          membership.productId,
        ) ?? 0
      ) + 1,
    )

    favouriteCounts.set(
      key,
      productCounts,
    )
  }

  const favourites:
    PeriodFavourite[] = [
      ...favouriteCounts.entries(),
    ]
      .sort(
        (a, b) =>
          a[0].localeCompare(
            b[0],
          ),
      )
      .map(
        ([
          key,
          productCounts,
        ]) => {
          const entries =
            [
              ...productCounts.entries(),
            ].sort(
              (a, b) => {
                if (
                  b[1] !==
                  a[1]
                ) {
                  return (
                    b[1] -
                    a[1]
                  )
                }

                const firstName =
                  dataset.products[
                    a[0]
                  ]?.displayName ??
                  dataset.products[
                    a[0]
                  ]?.rawName ??
                  a[0]

                const secondName =
                  dataset.products[
                    b[0]
                  ]?.displayName ??
                  dataset.products[
                    b[0]
                  ]?.rawName ??
                  b[0]

                return firstName.localeCompare(
                  secondName,
                )
              },
            )

          const topCount =
            entries[0]?.[1] ??
            0

          const leaders =
            entries.filter(
              ([, count]) =>
                count ===
                topCount,
            )

          const total =
            entries.reduce(
              (
                sum,
                [, count],
              ) =>
                sum +
                count,
              0,
            )

          return {
            key,

            label:
              getBucketLabel(
                key,
                grouping,
              ),

            leaderNames:
              leaders.map(
                ([
                  productId,
                ]) =>
                  dataset
                    .products[
                      productId
                    ]
                    ?.displayName ??
                  dataset
                    .products[
                      productId
                    ]
                    ?.rawName ??
                  productId,
              ),

            count:
              topCount,

            total,

            share:
              total > 0
                ? topCount /
                  total
                : 0,
          }
        },
      )

  const monthlyCounts =
    new Map<
      string,
      number
    >()

  const yearlyCounts =
    new Map<
      string,
      number
    >()

  for (
    const deal
    of filteredDeals
  ) {
    const monthKey =
      getBucketKey(
        deal.occurredAt,
        'month',
      )

    const yearKey =
      getBucketKey(
        deal.occurredAt,
        'year',
      )

    monthlyCounts.set(
      monthKey,
      (
        monthlyCounts.get(
          monthKey,
        ) ?? 0
      ) + 1,
    )

    yearlyCounts.set(
      yearKey,
      (
        yearlyCounts.get(
          yearKey,
        ) ?? 0
      ) + 1,
    )
  }

  return {
    timeline,

    favourites,

    summary: {
      totalDeals:
        filteredDeals.length,

      busiestMonth:
        findBusiest(
          monthlyCounts,
          'month',
        ),

      busiestYear:
        findBusiest(
          yearlyCounts,
          'year',
        ),

      longestGap:
        getLongestGap(
          dealDates,
        ),
    },
  }
}