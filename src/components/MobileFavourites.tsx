import {
  useMemo,
  useState,
} from 'react'

import type {
  MealDealDataset,
} from '../types/data'

import {
  analyseFavouritesByPeriod,
  type FavouriteCategory,
  type FavouriteRankingEntry,
} from '../analysis/favouritesByPeriod'

import './MobileFavourites.css'

interface MobileFavouritesProps {
  dataset: MealDealDataset
  onBack: () => void
}

interface FavouriteOption {
  category: FavouriteCategory
  label: string
}

const options: FavouriteOption[] = [
  {
    category: 'meal',
    label: 'Meal',
  },
  {
    category: 'main',
    label: 'Main',
  },
  {
    category: 'side',
    label: 'Snack',
  },
  {
    category: 'drink',
    label: 'Drink',
  },
]

export function MobileFavourites({
  dataset,
  onBack,
}: MobileFavouritesProps) {
  const [
    category,
    setCategory,
  ] =
    useState<FavouriteCategory>(
      'meal',
    )

  const analysis =
    useMemo(
      () =>
        analyseFavouritesByPeriod(
          dataset,
          category,
          {},
        ),
      [
        dataset,
        category,
      ],
    )

  const topFive =
    analysis.rankings.slice(
      0,
      5,
    )

  const winner =
    topFive[0]

  const runnersUp =
    topFive.slice(1)

  return (
    <main className="mobile-favourites">
      <header className="mobile-favourites-header">
        <button
          className="mobile-favourites-back"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="mobile-favourites-heading">
          <p>
            YOUR FAVOURITES
          </p>

          <h1>
            And the winner is…
          </h1>
        </div>
      </header>

      <nav
        className="mobile-favourites-selector"
        aria-label="Choose favourite category"
      >
        {options.map(
          (option) => (
            <button
              key={
                option.category
              }
              className={
                category ===
                option.category
                  ? 'mobile-favourites-pill mobile-favourites-pill-active'
                  : 'mobile-favourites-pill'
              }
              onClick={() =>
                setCategory(
                  option.category,
                )
              }
            >
              {option.label}
            </button>
          ),
        )}
      </nav>

      {!winner ? (
        <section className="mobile-favourites-empty">
          No resolved Meal Deal
          history available.
        </section>
      ) : (
        <>
          <WinnerCard
            entry={winner}
            category={category}
          />

          <section className="mobile-favourites-runners">
            {runnersUp.map(
              (
                entry,
                index,
              ) => (
                <RunnerUpCard
                  key={
                    entry.key
                  }
                  entry={
                    entry
                  }
                  category={
                    category
                  }
                  rank={
                    index + 2
                  }
                />
              ),
            )}
          </section>
        </>
      )}
    </main>
  )
}

function WinnerCard({
  entry,
  category,
}: {
  entry:
    FavouriteRankingEntry
  category:
    FavouriteCategory
}) {
  return (
    <section className="mobile-favourites-winner">
      <span className="mobile-favourites-winner-rank">
        #1
      </span>

      {category ===
      'meal' ? (
        <MealChoice
          entry={entry}
          hero
        />
      ) : (
        <strong className="mobile-favourites-winner-name">
          {entry.name}
        </strong>
      )}

      <div className="mobile-favourites-winner-stats">
        <strong>
          {entry.count}
        </strong>

        <span>
          {category ===
          'meal'
            ? entry.count ===
              1
              ? 'time together'
              : 'times together'
            : entry.count ===
                1
              ? 'selection'
              : 'selections'}
        </span>
      </div>

      <small>
        {formatPercent(
          entry.share,
        )}{' '}
        of{' '}
        {shareLabel(
          category,
        )}
      </small>
    </section>
  )
}

function RunnerUpCard({
  entry,
  category,
  rank,
}: {
  entry:
    FavouriteRankingEntry
  category:
    FavouriteCategory
  rank: number
}) {
  return (
    <article className="mobile-favourites-runner">
      <span className="mobile-favourites-runner-rank">
        #{rank}
      </span>

      <div className="mobile-favourites-runner-choice">
        {category ===
        'meal' ? (
          <MealChoice
            entry={entry}
          />
        ) : (
          <strong>
            {entry.name}
          </strong>
        )}
      </div>

      <div className="mobile-favourites-runner-stat">
        <strong>
          {entry.count}
        </strong>

        <span>
          {formatPercent(
            entry.share,
          )}
        </span>
      </div>
    </article>
  )
}

function MealChoice({
  entry,
  hero = false,
}: {
  entry:
    FavouriteRankingEntry
  hero?: boolean
}) {
  return (
    <div
      className={
        hero
          ? 'mobile-favourites-meal mobile-favourites-meal-hero'
          : 'mobile-favourites-meal'
      }
    >
      <strong>
        {entry.mainName}
      </strong>

      <span>
        +
      </span>

      <strong>
        {entry.sideName}
      </strong>

      <span>
        +
      </span>

      <strong>
        {entry.drinkName}
      </strong>
    </div>
  )
}

function shareLabel(
  category:
    FavouriteCategory,
): string {
  if (
    category === 'meal'
  ) {
    return 'Meal Deals'
  }

  if (
    category === 'main'
  ) {
    return 'mains'
  }

  if (
    category === 'side'
  ) {
    return 'snacks'
  }

  return 'drinks'
}

function formatPercent(
  value: number,
): string {
  return new Intl.NumberFormat(
    'en-GB',
    {
      style: 'percent',
      maximumFractionDigits: 0,
    },
  ).format(value)
}