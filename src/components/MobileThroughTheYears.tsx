import {
  useMemo,
} from 'react'

import type {
  MealDealDataset,
} from '../types/data'

import {
  analyseThroughYears,
  getThroughYearsBounds,
} from '../analysis/throughYears'

import {
  deriveMealDeals,
} from '../analysis/mealDeals'

import './MobileThroughTheYears.css'

interface MobileThroughTheYearsProps {
  dataset: MealDealDataset
  onBack: () => void
}

export function MobileThroughTheYears({
  dataset,
  onBack,
}: MobileThroughTheYearsProps) {
  const bounds =
    useMemo(
      () =>
        getThroughYearsBounds(
          dataset,
        ),
      [dataset],
    )

  const analysis =
    useMemo(
      () =>
        analyseThroughYears(
          dataset,
          'month',
          'main',
          bounds
            ? {
                from:
                  bounds.from,
                to:
                  bounds.to,
              }
            : {},
        ),
      [
        dataset,
        bounds,
      ],
    )

  const firstDeal =
    useMemo(
      () =>
        [
          ...deriveMealDeals(
            dataset,
          ),
        ].sort(
          (a, b) =>
            new Date(
              a.occurredAt,
            ).getTime() -
            new Date(
              b.occurredAt,
            ).getTime(),
        )[0],
      [dataset],
    )

  if (!bounds) {
    return (
      <main className="mobile-history">
        <button
          className="mobile-history-back"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="mobile-history-empty">
          No Meal Deal history
          available.
        </div>
      </main>
    )
  }

  const firstDate =
    firstDeal?.occurredAt ??
    bounds.from

  const firstMain =
    firstDeal
      ? productName(
          dataset,
          firstDeal
            .mainProductId,
        )
      : undefined

  const firstSnack =
    firstDeal
      ? productName(
          dataset,
          firstDeal
            .sideProductId,
        )
      : undefined

  const firstDrink =
    firstDeal
      ? productName(
          dataset,
          firstDeal
            .drinkProductId,
        )
      : undefined

  const busiestMonth =
    analysis.summary
      .busiestMonth

  const busiestYear =
    analysis.summary
      .busiestYear

  const longestGap =
    analysis.summary
      .longestGap

  return (
    <main className="mobile-history">
      <header className="mobile-history-header">
        <button
          className="mobile-history-back"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="mobile-history-heading">
          <p>
            YOUR MEAL DEAL HISTORY
          </p>

          <h1>
            Through the years
          </h1>
        </div>
      </header>

      <section className="mobile-history-first">
        <span className="mobile-history-first-label">
          FIRST RECORDED MEAL DEAL
        </span>

        <strong className="mobile-history-first-date">
          {formatLongDate(
            firstDate,
          )}
        </strong>

        {firstMain &&
          firstSnack &&
          firstDrink && (
            <div className="mobile-history-first-meal">
              <strong>
                {firstMain}
              </strong>

              <span>
                +
              </span>

              <strong>
                {firstSnack}
              </strong>

              <span>
                +
              </span>

              <strong>
                {firstDrink}
              </strong>
            </div>
          )}
      </section>

      <section className="mobile-history-stats">
        <HistorySticker
          label="Busiest Month"
          value={
            busiestMonth
              ?.label ??
            '—'
          }
          detail={
            busiestMonth
              ? `${busiestMonth.count} Meal Deals`
              : undefined
          }
        />

        <HistorySticker
          label="Busiest Year"
          value={
            busiestYear
              ?.label ??
            '—'
          }
          detail={
            busiestYear
              ? `${busiestYear.count} Meal Deals`
              : undefined
          }
        />

        <HistorySticker
          className="mobile-history-gap"
          label="Longest Gap"
          value={
            longestGap
              ? `${longestGap.days} days`
              : '—'
          }
          detail={
            longestGap
              ? `${formatShortDate(
                  longestGap.from,
                )} → ${formatShortDate(
                  longestGap.to,
                )}`
              : undefined
          }
        />
      </section>
    </main>
  )
}

function HistorySticker({
  label,
  value,
  detail,
  className = '',
}: {
  label: string
  value: string
  detail?: string
  className?: string
}) {
  return (
    <article
      className={`mobile-history-sticker ${className}`}
    >
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

      {detail && (
        <small>
          {detail}
        </small>
      )}
    </article>
  )
}

function productName(
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

function formatLongDate(
  value: string,
): string {
  const date =
    value.length === 10
      ? new Date(
          `${value}T00:00:00Z`,
        )
      : new Date(value)

  return new Intl.DateTimeFormat(
    'en-GB',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    },
  ).format(date)
}

function formatShortDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    'en-GB',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    },
  ).format(
    new Date(value),
  )
}