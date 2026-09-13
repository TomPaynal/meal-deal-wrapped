import { useMemo } from 'react'

import type {
  MealDealDataset,
} from '../types/data'

import {
  analyseBeatMealDeal,
  type HeistDeal,
  type HeistItem,
} from '../analysis/beatMealDeal'

import './BeatMealDeal.css'

interface BeatMealDealProps {
  dataset: MealDealDataset
  onBack: () => void
}

export function BeatMealDeal({
  dataset,
  onBack,
}: BeatMealDealProps) {
  const analysis =
    useMemo(
      () =>
        analyseBeatMealDeal(
          dataset,
        ),
      [dataset],
    )

  const biggest =
    analysis.biggestSaving

  const dataLabel =
    dataset.source === 'demo'
      ? 'DEMO DATA'
      : 'YOUR DATA'

  if (!biggest) {
    return (
      <main className="heist-shell">
        <button
          className="heist-back"
          onClick={onBack}
        >
          ← Back
        </button>

        <section className="heist-empty">
          <p className="heist-eyebrow">
            BEAT THE MEAL DEAL
          </p>

          <h1>
            No savings data available
          </h1>

          <p>
            Complete shelf-price data is
            needed to calculate Meal Deal
            savings.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="heist-shell">
      <header className="heist-header">
        <button
          className="heist-back"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="heist-heading">
          <p className="heist-eyebrow">
            BEAT THE MEAL DEAL
          </p>

          <h1>
            Lifetime value
          </h1>
        </div>
      </header>

      <section className="heist-hero">
        <p className="heist-eyebrow">
          {dataLabel}
        </p>

        <p className="heist-intro">
          What standard Meal Deals have
          saved you over time
        </p>

        <article className="heist-lifetime-hero">
          <div className="heist-lifetime-top">
            <div>
              <span className="heist-winner-label">
                Lifetime saving
              </span>

              <strong className="heist-lifetime-saving">
                {formatMoney(
                  analysis
                    .lifetimeSavingPence,
                )}
              </strong>
            </div>

            <div className="heist-lifetime-count">
              <strong>
                {analysis.dealCount}
              </strong>

              <span>
                Meal Deals analysed
              </span>
            </div>
          </div>

          <div className="heist-lifetime-equation">
            <LifetimeFigure
              label="Combined Shelf Value"
              value={
                analysis
                  .lifetimeShelfValuePence
              }
            />

            <div className="heist-lifetime-operator">
              −
            </div>

            <LifetimeFigure
              label="Meal Deal Spend"
              value={
                analysis
                  .lifetimeDealSpendPence
              }
            />

            <div className="heist-lifetime-operator">
              =
            </div>

            <LifetimeFigure
              label="Lifetime Saving"
              value={
                analysis
                  .lifetimeSavingPence
              }
              featured
            />
          </div>
        </article>

        <div className="heist-lifetime-metrics">
          <MetricCard
            value={formatMoney(
              analysis
                .averageShelfValuePence,
            )}
            label="Average Shelf Value Per Deal"
          />

          <MetricCard
            value={formatMoney(
              analysis
                .averageSavingPence,
            )}
            label="Average Saving Per Deal"
          />

          <MetricCard
            value={formatValuePerPound(
              analysis
                .averageValueMultiple,
            )}
            label="Shelf Value For Every £1 Spent"
          />
        </div>

        <p className="heist-coverage">
          Based on{' '}
          <strong>
            {analysis.dealCount}
          </strong>{' '}
          standard Meal Deals with
          complete shelf-price data.
        </p>
      </section>

      <section className="heist-biggest">
        <div className="heist-section-heading">
          <p className="heist-eyebrow">
            YOUR BEST VALUE
          </p>

          <h2>
            Biggest saving
          </h2>
        </div>

        <article className="heist-winner">
          <div className="heist-winner-top">
            <div>
              <span className="heist-winner-label">
                Biggest saving
              </span>

              <strong className="heist-winner-saving">
                {formatMoney(
                  biggest.savingPence,
                )}
              </strong>
            </div>

            <time
              className="heist-winner-date"
              dateTime={
                biggest.occurredAt
              }
            >
              {formatDate(
                biggest.occurredAt,
              )}
            </time>
          </div>

          <div className="heist-products">
            {biggest.items.map(
              (item) => (
                <ProductCard
                  key={`${biggest.id}-${item.role}`}
                  item={item}
                />
              ),
            )}
          </div>

          <div className="heist-price-strip">
            <PriceFigure
              label="Shelf Total"
              value={
                biggest.shelfTotalPence
              }
            />

            <div className="heist-maths">
              −
            </div>

            <PriceFigure
              label="Meal Deal"
              value={
                biggest.dealPricePence
              }
            />

            <div className="heist-maths">
              =
            </div>

            <PriceFigure
              label="Saved"
              value={
                biggest.savingPence
              }
              emphasised
            />
          </div>
        </article>
      </section>

      <section className="heist-top-five">
        <div className="heist-section-heading">
          <p className="heist-eyebrow">
            TOP FIVE
          </p>

          <h2>
            Biggest savings
          </h2>
        </div>

        <div className="heist-ranking">
          {analysis.topSavings.map(
            (deal, index) => (
              <TopSaving
                key={deal.id}
                deal={deal}
                rank={index + 1}
              />
            ),
          )}
        </div>
      </section>
    </main>
  )
}

function ProductCard({
  item,
}: {
  item: HeistItem
}) {
  return (
    <div className="heist-product">
      <span className="heist-product-role">
        {roleLabel(
          item.role,
        )}
      </span>

      <strong>
        {item.name}
      </strong>

      <span className="heist-product-price">
        {formatMoney(
          item.shelfPricePence,
        )}
      </span>
    </div>
  )
}

function LifetimeFigure({
  label,
  value,
  featured = false,
}: {
  label: string
  value: number
  featured?: boolean
}) {
  return (
    <div
      className={
        featured
          ? 'heist-lifetime-figure heist-lifetime-figure-featured'
          : 'heist-lifetime-figure'
      }
    >
      <span>
        {label}
      </span>

      <strong>
        {formatMoney(value)}
      </strong>
    </div>
  )
}

function PriceFigure({
  label,
  value,
  emphasised = false,
}: {
  label: string
  value: number
  emphasised?: boolean
}) {
  return (
    <div
      className={
        emphasised
          ? 'heist-price-figure heist-price-figure-featured'
          : 'heist-price-figure'
      }
    >
      <span>
        {label}
      </span>

      <strong>
        {formatMoney(value)}
      </strong>
    </div>
  )
}

function MetricCard({
  value,
  label,
}: {
  value: string
  label: string
}) {
  return (
    <div className="heist-metric">
      <strong>
        {value}
      </strong>

      <span>
        {label}
      </span>
    </div>
  )
}

function TopSaving({
  deal,
  rank,
}: {
  deal: HeistDeal
  rank: number
}) {
  return (
    <article className="heist-rank-row">
      <div className="heist-rank-number">
        #{rank}
      </div>

      <div className="heist-rank-main">
        <time
          dateTime={deal.occurredAt}
          className="heist-rank-date"
        >
          {formatDate(
            deal.occurredAt,
          )}
        </time>

        <div className="heist-rank-products">
          {deal.items.map(
            (item, index) => (
              <span
                key={`${deal.id}-${item.role}`}
              >
                {index > 0 && (
                  <span className="heist-rank-plus">
                    {' + '}
                  </span>
                )}

                {item.name}
              </span>
            ),
          )}
        </div>
      </div>

      <div className="heist-rank-stat">
        <strong>
          {formatMoney(
            deal.savingPence,
          )}
        </strong>

        <span>
          saved
        </span>
      </div>

      <div className="heist-rank-stat">
        <strong>
          {formatPercent(
            deal.savingRatio,
          )}
        </strong>

        <span>
          of shelf value
        </span>
      </div>

      <div className="heist-rank-stat">
        <strong>
          {formatMoney(
            deal.shelfTotalPence,
          )}
        </strong>

        <span>
          shelf total
        </span>
      </div>
    </article>
  )
}

function formatMoney(
  pence: number,
): string {
  return new Intl.NumberFormat(
    'en-GB',
    {
      style: 'currency',
      currency: 'GBP',
    },
  ).format(
    pence / 100,
  )
}

function formatValuePerPound(
  multiple: number,
): string {
  return new Intl.NumberFormat(
    'en-GB',
    {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(multiple)
}

function formatPercent(
  ratio: number,
): string {
  return new Intl.NumberFormat(
    'en-GB',
    {
      style: 'percent',
      maximumFractionDigits: 1,
    },
  ).format(ratio)
}

function formatDate(
  occurredAt: string,
): string {
  return new Intl.DateTimeFormat(
    'en-GB',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    },
  ).format(
    new Date(occurredAt),
  )
}

function roleLabel(
  role: HeistItem['role'],
): string {
  if (role === 'side') {
    return 'Snack'
  }

  return (
    role.charAt(0).toUpperCase() +
    role.slice(1)
  )
}