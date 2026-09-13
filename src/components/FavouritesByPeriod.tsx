import {
  useMemo,
  useState,
} from 'react'

import type {
  MealDealDataset,
} from '../types/data'

import {
  getThroughYearsBounds,
} from '../analysis/throughYears'

import {
  analyseFavouritesByPeriod,
  type FavouriteCategory,
  type FavouriteDateRange,
  type FavouriteRankingEntry,
} from '../analysis/favouritesByPeriod'

import './FavouritesByPeriod.css'

interface FavouritesByPeriodProps {
  dataset: MealDealDataset
  onBack: () => void
}

type PeriodPreset =
  | 'month'
  | 'year'
  | 'all'
  | 'custom'

type PodiumSize =
  | 'first'
  | 'second'
  | 'third'

const categoryOptions: {
  value: FavouriteCategory
  label: string
}[] = [
  {
    value: 'meal',
    label: 'Meal',
  },
  {
    value: 'main',
    label: 'Main',
  },
  {
    value: 'side',
    label: 'Snack',
  },
  {
    value: 'drink',
    label: 'Drink',
  },
]

export function FavouritesByPeriod({
  dataset,
  onBack,
}: FavouritesByPeriodProps) {
  const bounds =
    useMemo(
      () =>
        getThroughYearsBounds(
          dataset,
        ),
      [dataset],
    )

  const [
    category,
    setCategory,
  ] = useState<FavouriteCategory>(
    'meal',
  )

  const [
    preset,
    setPreset,
  ] = useState<PeriodPreset>(
    'all',
  )

  const [
    customFrom,
    setCustomFrom,
  ] = useState(
    bounds?.from ?? '',
  )

  const [
    customTo,
    setCustomTo,
  ] = useState(
    bounds?.to ?? '',
  )

  const range =
    useMemo<FavouriteDateRange>(
      () => {
        if (!bounds) {
          return {}
        }

        if (
          preset === 'all'
        ) {
          return {
            from: bounds.from,
            to: bounds.to,
          }
        }

        const now =
          new Date()

        if (
          preset === 'month'
        ) {
          const year =
            now.getFullYear()

          const month =
            now.getMonth()

          const first =
            new Date(
              Date.UTC(
                year,
                month,
                1,
              ),
            )

          const last =
            new Date(
              Date.UTC(
                year,
                month + 1,
                0,
              ),
            )

          return {
            from:
              inputDate(
                first,
              ),

            to:
              inputDate(
                last,
              ),
          }
        }

        if (
          preset === 'year'
        ) {
          const year =
            now.getFullYear()

          return {
            from:
              `${year}-01-01`,

            to:
              `${year}-12-31`,
          }
        }

        return {
          from:
            customFrom ||
            undefined,

          to:
            customTo ||
            undefined,
        }
      },
      [
        bounds,
        preset,
        customFrom,
        customTo,
      ],
    )

  const analysis =
    useMemo(
      () =>
        analyseFavouritesByPeriod(
          dataset,
          category,
          range,
        ),
      [
        dataset,
        category,
        range.from,
        range.to,
      ],
    )

  const topTen =
    analysis.rankings.slice(
      0,
      10,
    )

  const podium =
    topTen.slice(
      0,
      3,
    )

  const remaining =
    topTen.slice(
      3,
      10,
    )

  const dataLabel =
    dataset.source === 'demo'
      ? 'DEMO DATA'
      : 'YOUR DATA'

  return (
    <main className="favourites-shell">
      <header className="favourites-header">
        <button
          className="favourites-back"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="favourites-heading">
          <p className="favourites-eyebrow">
            YOUR TOP PICKS
          </p>

          <h1>
            Your favourites
          </h1>
        </div>
      </header>

      <section className="favourites-intro">
        <p className="favourites-eyebrow">
          {dataLabel}
        </p>

        <p>
          See what came out on top
          across any part of your
          Meal Deal history.
        </p>
      </section>

      <section className="favourites-controls">
        <ControlGroup
          label="Show"
        >
          {categoryOptions.map(
            (option) => (
              <ControlButton
                key={
                  option.value
                }
                active={
                  category ===
                  option.value
                }
                onClick={() =>
                  setCategory(
                    option.value,
                  )
                }
              >
                {option.label}
              </ControlButton>
            ),
          )}
        </ControlGroup>

        <ControlGroup
          label="Period"
        >
          <ControlButton
            active={
              preset ===
              'month'
            }
            onClick={() =>
              setPreset(
                'month',
              )
            }
          >
            This month
          </ControlButton>

          <ControlButton
            active={
              preset ===
              'year'
            }
            onClick={() =>
              setPreset(
                'year',
              )
            }
          >
            This year
          </ControlButton>

          <ControlButton
            active={
              preset ===
              'all'
            }
            onClick={() =>
              setPreset(
                'all',
              )
            }
          >
            All time
          </ControlButton>

          <ControlButton
            active={
              preset ===
              'custom'
            }
            onClick={() =>
              setPreset(
                'custom',
              )
            }
          >
            Custom
          </ControlButton>
        </ControlGroup>

        {preset ===
          'custom' &&
          bounds && (
            <div className="favourites-date-range">
              <label>
                From

                <input
                  type="date"
                  value={
                    customFrom
                  }
                  min={
                    bounds.from
                  }
                  max={
                    customTo ||
                    bounds.to
                  }
                  onChange={(
                    event,
                  ) =>
                    setCustomFrom(
                      event
                        .target
                        .value,
                    )
                  }
                />
              </label>

              <label>
                To

                <input
                  type="date"
                  value={
                    customTo
                  }
                  min={
                    customFrom ||
                    bounds.from
                  }
                  max={
                    bounds.to
                  }
                  onChange={(
                    event,
                  ) =>
                    setCustomTo(
                      event
                        .target
                        .value,
                    )
                  }
                />
              </label>
            </div>
          )}
      </section>

      {topTen.length === 0 ? (
        <section className="favourites-empty-result">
          <p className="favourites-eyebrow">
            {periodKicker(
              preset,
              range,
            )}
          </p>

          <h2>
            No choices found
          </h2>

          <p>
            There are no resolved
            Meal Deal selections in
            this period.
          </p>
        </section>
      ) : (
        <>
          <section className="favourites-podium-section">
            <div className="favourites-period-heading">
              <p className="favourites-eyebrow">
                {periodKicker(
                  preset,
                  range,
                )}
              </p>

              <h2>
                {periodTitle(
                  preset,
                  range,
                )}
              </h2>
            </div>

            <div className="favourites-podium-stack">
              {podium.map(
                (
                  entry,
                  index,
                ) => (
                  <PodiumCard
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
                      index + 1
                    }
                    size={
                      index === 0
                        ? 'first'
                        : index ===
                            1
                          ? 'second'
                          : 'third'
                    }
                  />
                ),
              )}
            </div>

            <div className="favourites-summary">
              <SummaryCard
                value={
                  analysis
                    .totalSelections
                }
                label={
                  totalLabel(
                    category,
                  )
                }
              />

              <SummaryCard
                value={
                  analysis
                    .rankings
                    .length
                }
                label={
                  uniqueLabel(
                    category,
                  )
                }
              />
            </div>
          </section>

          {remaining.length >
            0 && (
            <section className="favourites-ranking">
              <div className="favourites-ranking-title">
                <p className="favourites-eyebrow">
                  THE REST OF THE TOP 10
                </p>

                <h2>
                  Honourable mentions
                </h2>
              </div>

              <div className="favourites-list">
                {remaining.map(
                  (
                    entry,
                    index,
                  ) => (
                    <RankingRow
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
                        index + 4
                      }
                    />
                  ),
                )}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  )
}

function PodiumCard({
  entry,
  category,
  rank,
  size,
}: {
  entry:
    FavouriteRankingEntry
  category:
    FavouriteCategory
  rank: number
  size: PodiumSize
}) {
  return (
    <article
      className={`favourites-podium-card favourites-podium-${size}`}
    >
      <div className="favourites-podium-topline">
        <span className="favourites-podium-rank">
          #{rank}
        </span>

        <div className="favourites-podium-count">
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

          <small>
            {formatPercent(
              entry.share,
            )}{' '}
            of choices
          </small>
        </div>
      </div>

      {category ===
      'meal' ? (
        <div className="favourites-meal-products">
          <ProductBlock
            role="Main"
            name={
              entry.mainName ??
              ''
            }
          />

          <div className="favourites-plus">
            +
          </div>

          <ProductBlock
            role="Snack"
            name={
              entry.sideName ??
              ''
            }
          />

          <div className="favourites-plus">
            +
          </div>

          <ProductBlock
            role="Drink"
            name={
              entry.drinkName ??
              ''
            }
          />
        </div>
      ) : (
        <div className="favourites-single-product">
          <ProductBlock
            role={
              categoryRoleLabel(
                category,
              )
            }
            name={
              entry.name ??
              ''
            }
          />
        </div>
      )}
    </article>
  )
}

function ProductBlock({
  role,
  name,
}: {
  role: string
  name: string
}) {
  return (
    <div className="favourites-product">
      <span className="favourites-product-role">
        {role}
      </span>

      <strong>
        {name}
      </strong>
    </div>
  )
}

function RankingRow({
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
    <article className="favourites-row">
      <div className="favourites-row-rank">
        #{rank}
      </div>

      <div className="favourites-row-choice">
        {category ===
        'meal' ? (
          <>
            <span>
              {entry.mainName}
            </span>

            <span className="favourites-row-plus">
              +
            </span>

            <span>
              {entry.sideName}
            </span>

            <span className="favourites-row-plus">
              +
            </span>

            <span>
              {entry.drinkName}
            </span>
          </>
        ) : (
          <span>
            {entry.name}
          </span>
        )}
      </div>

      <div className="favourites-row-count">
        <strong>
          {entry.count}×
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

function SummaryCard({
  value,
  label,
}: {
  value: number
  label: string
}) {
  return (
    <div>
      <strong>
        {value}
      </strong>

      <span>
        {label}
      </span>
    </div>
  )
}

function ControlGroup({
  label,
  children,
}: {
  label: string
  children:
    React.ReactNode
}) {
  return (
    <div className="favourites-control-group">
      <span>
        {label}
      </span>

      <div>
        {children}
      </div>
    </div>
  )
}

function ControlButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children:
    React.ReactNode
}) {
  return (
    <button
      className={
        active
          ? 'favourites-control-button favourites-control-button-active'
          : 'favourites-control-button'
      }
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function categoryRoleLabel(
  category:
    FavouriteCategory,
): string {
  if (
    category === 'side'
  ) {
    return 'Snack'
  }

  if (
    category === 'main'
  ) {
    return 'Main'
  }

  return 'Drink'
}

function totalLabel(
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
    return 'Main Selections'
  }

  if (
    category === 'side'
  ) {
    return 'Snack Selections'
  }

  return 'Drink Selections'
}

function uniqueLabel(
  category:
    FavouriteCategory,
): string {
  if (
    category === 'meal'
  ) {
    return 'Unique Combinations'
  }

  if (
    category === 'main'
  ) {
    return 'Unique Mains'
  }

  if (
    category === 'side'
  ) {
    return 'Unique Snacks'
  }

  return 'Unique Drinks'
}

function periodKicker(
  preset: PeriodPreset,
  range:
    FavouriteDateRange,
): string {
  if (
    preset === 'month'
  ) {
    return 'THIS MONTH'
  }

  if (
    preset === 'year'
  ) {
    return 'THIS YEAR'
  }

  if (
    preset === 'all'
  ) {
    return 'ALL TIME'
  }

  if (
    range.from &&
    range.to
  ) {
    return `${formatShortDate(
      range.from,
    )} – ${formatShortDate(
      range.to,
    )}`.toUpperCase()
  }

  return 'CUSTOM RANGE'
}

function periodTitle(
  preset: PeriodPreset,
  range:
    FavouriteDateRange,
): string {
  if (
    preset === 'all'
  ) {
    return 'Lifetime favourites'
  }

  if (
    preset === 'year'
  ) {
    return `${new Date().getFullYear()} favourites`
  }

  if (
    preset === 'month'
  ) {
    const month =
      new Intl.DateTimeFormat(
        'en-GB',
        {
          month: 'long',
          year: 'numeric',
        },
      ).format(
        new Date(),
      )

    return `${month} favourites`
  }

  if (
    range.from &&
    range.to
  ) {
    return 'Your favourites'
  }

  return 'Custom favourites'
}

function inputDate(
  value: Date,
): string {
  const year =
    value.getUTCFullYear()

  const month =
    String(
      value.getUTCMonth() + 1,
    ).padStart(
      2,
      '0',
    )

  const day =
    String(
      value.getUTCDate(),
    ).padStart(
      2,
      '0',
    )

  return `${year}-${month}-${day}`
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
    new Date(
      `${value}T00:00:00Z`,
    ),
  )
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