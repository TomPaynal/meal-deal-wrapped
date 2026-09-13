import { useState } from 'react'

import type {
  BeatMealDealAnalysis,
  HeistDeal,
  HeistItem,
} from '../analysis/beatMealDeal'

import './MobileBeatMealDeal.css'

interface MobileBeatMealDealProps {
  analysis: BeatMealDealAnalysis
  biggest: HeistDeal
  onBack: () => void
}

type MobileHeistPage =
  | 'lifetime'
  | 'biggest'

export function MobileBeatMealDeal({
  analysis,
  biggest,
  onBack,
}: MobileBeatMealDealProps) {
  const [
    page,
    setPage,
  ] =
    useState<MobileHeistPage>(
      'lifetime',
    )

  function handleBack() {
    if (
      page === 'biggest'
    ) {
      setPage('lifetime')
      return
    }

    onBack()
  }

  return (
    <main className="mobile-heist">
      <header className="mobile-heist-header">
        <button
          className="mobile-heist-back"
          onClick={handleBack}
        >
          ← Back
        </button>

        <div className="mobile-heist-heading">
          <p>
            {page ===
            'lifetime'
              ? 'BEAT THE MEAL DEAL'
              : 'YOUR BEST VALUE'}
          </p>

          <h1>
            {page ===
            'lifetime'
              ? 'Lifetime value'
              : 'Biggest saving'}
          </h1>
        </div>
      </header>

      {page ===
      'lifetime' ? (
        <LifetimeValuePage
          analysis={analysis}
          onNext={() =>
            setPage(
              'biggest',
            )
          }
        />
      ) : (
        <BiggestSavingPage
          biggest={biggest}
        />
      )}
    </main>
  )
}

function LifetimeValuePage({
  analysis,
  onNext,
}: {
  analysis:
    BeatMealDealAnalysis
  onNext: () => void
}) {
  return (
    <section className="mobile-heist-page">
      <div className="mobile-heist-count">
        <strong>
          {analysis.dealCount}
        </strong>

        <span>
          Meal Deals analysed
        </span>
      </div>

      <article className="mobile-heist-reveal">
        <span>
          Lifetime saving
        </span>

        <strong>
          {formatMoney(
            analysis
              .lifetimeSavingPence,
          )}
        </strong>
      </article>

      <div className="mobile-heist-stat-grid">
        <StatSticker
          label="Combined Shelf Value"
          value={formatMoney(
            analysis
              .lifetimeShelfValuePence,
          )}
        />

        <StatSticker
          label="Meal Deal Spend"
          value={formatMoney(
            analysis
              .lifetimeDealSpendPence,
          )}
        />

        <StatSticker
          label="Average Shelf Value Per Deal"
          value={formatMoney(
            analysis
              .averageShelfValuePence,
          )}
        />

        <StatSticker
          label="Average Saving Per Deal"
          value={formatMoney(
            analysis
              .averageSavingPence,
          )}
        />
      </div>

      <div className="mobile-heist-navigation">
        <button
          onClick={onNext}
        >
          Biggest saving →
        </button>
      </div>
    </section>
  )
}

function BiggestSavingPage({
  biggest,
}: {
  biggest: HeistDeal
}) {
  return (
    <section className="mobile-heist-page mobile-heist-biggest-page">
      <time
        className="mobile-heist-date"
        dateTime={
          biggest.occurredAt
        }
      >
        {formatDate(
          biggest.occurredAt,
        )}
      </time>

      <article className="mobile-heist-reveal mobile-heist-saving-reveal">
        <span>
          Saved on one
          Meal Deal
        </span>

        <strong>
          {formatMoney(
            biggest.savingPence,
          )}
        </strong>
      </article>

      <div className="mobile-heist-products">
        {biggest.items.map(
          (item) => (
            <ProductSticker
              key={
                item.productId
              }
              item={item}
            />
          ),
        )}
      </div>

      <div className="mobile-heist-price-summary">
        <div>
          <strong>
            {formatMoney(
              biggest
                .shelfTotalPence,
            )}
          </strong>

          <span>
            Shelf Value
          </span>
        </div>

        <span className="mobile-heist-arrow">
          →
        </span>

        <div>
          <strong>
            {formatMoney(
              biggest
                .dealPricePence,
            )}
          </strong>

          <span>
            Meal Deal
          </span>
        </div>
      </div>
    </section>
  )
}

function StatSticker({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="mobile-heist-stat">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  )
}

function ProductSticker({
  item,
}: {
  item: HeistItem
}) {
  return (
    <div className="mobile-heist-product">
      <span className="mobile-heist-product-role">
        {roleLabel(
          item.role,
        )}
      </span>

      <strong className="mobile-heist-product-name">
        {item.name}
      </strong>

      <strong className="mobile-heist-product-price">
        {formatMoney(
          item.shelfPricePence,
        )}
      </strong>
    </div>
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
    new Date(
      occurredAt,
    ),
  )
}

function roleLabel(
  role:
    HeistItem['role'],
): string {
  if (
    role === 'side'
  ) {
    return 'Snack'
  }

  return (
    role
      .charAt(0)
      .toUpperCase() +
    role.slice(1)
  )
}