import {
  useMemo,
  useState,
} from 'react'

import type {
  MealDealDataset,
} from '../types/data'

import {
  analyseThroughYears,
  getThroughYearsBounds,
  type TimeGrouping,
  type ThroughYearsRole,
  type TimelinePoint,
} from '../analysis/throughYears'

import './ThroughTheYears.css'

interface ThroughTheYearsProps {
  dataset: MealDealDataset
  onBack: () => void
}

const roleOptions: {
  role: ThroughYearsRole
  label: string
}[] = [
  {
    role: 'main',
    label: 'Mains',
  },
  {
    role: 'side',
    label: 'Snacks',
  },
  {
    role: 'drink',
    label: 'Drinks',
  },
]

export function ThroughTheYears({
  dataset,
  onBack,
}: ThroughTheYearsProps) {
  const bounds =
    useMemo(
      () =>
        getThroughYearsBounds(
          dataset,
        ),
      [dataset],
    )

  const [
    grouping,
    setGrouping,
  ] = useState<TimeGrouping>(
    'month',
  )

  const [
    selectedRole,
    setSelectedRole,
  ] = useState<ThroughYearsRole>(
    'main',
  )

  const analysis =
    useMemo(
      () =>
        analyseThroughYears(
          dataset,
          grouping,
          selectedRole,
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
        grouping,
        selectedRole,
        bounds,
      ],
    )

  const favouritesNewestFirst =
    useMemo(
      () =>
        [
          ...analysis.favourites,
        ].reverse(),
      [
        analysis.favourites,
      ],
    )

  if (!bounds) {
    return (
      <main className="history-shell">
        <button
          className="history-back"
          onClick={onBack}
        >
          ← Back
        </button>

        <section className="history-empty">
          <p className="history-eyebrow">
            THROUGH THE YEARS
          </p>

          <h1>
            No timeline data available
          </h1>
        </section>
      </main>
    )
  }

  const dataLabel =
    dataset.source === 'demo'
      ? 'DEMO DATA'
      : 'YOUR DATA'

  return (
    <main className="history-shell">
      <header className="history-header">
        <button
          className="history-back"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="history-heading">
          <p className="history-eyebrow">
            YOUR MEAL DEAL HISTORY
          </p>

          <h1>
            Through the years
          </h1>
        </div>
      </header>

      <section className="history-intro">
        <p className="history-eyebrow">
          {dataLabel}
        </p>

        <p>
          See how your Meal Deal habits
          changed over time.
        </p>
      </section>

      <section className="history-controls">
        <div className="history-control-group">
          <span>
            Group by
          </span>

          <div>
            <ControlButton
              active={
                grouping ===
                'month'
              }
              onClick={() =>
                setGrouping(
                  'month',
                )
              }
            >
              Monthly
            </ControlButton>

            <ControlButton
              active={
                grouping ===
                'year'
              }
              onClick={() =>
                setGrouping(
                  'year',
                )
              }
            >
              Yearly
            </ControlButton>
          </div>
        </div>
      </section>

      <section className="history-chart-card">
        <div className="history-chart-heading">
          <div>
            <p className="history-chart-kicker">
              {
                grouping ===
                  'month'
                  ? 'MONTH BY MONTH'
                  : 'YEAR BY YEAR'
              }
            </p>

            <h2>
              Meal Deals over time
            </h2>
          </div>

          <div className="history-chart-total">
            <strong>
              {
                analysis
                  .summary
                  .totalDeals
              }
            </strong>

            <span>
              Meal Deals
            </span>
          </div>
        </div>

        <TimelineChart
          points={
            analysis.timeline
          }
          grouping={
            grouping
          }
        />
      </section>

      <section className="history-summary-grid">
        <SummaryCard
          value={
            analysis
              .summary
              .busiestMonth
              ?.label ??
            '—'
          }
          label="Busiest Month"
          detail={
            analysis
              .summary
              .busiestMonth
              ? `${analysis.summary.busiestMonth.count} Meal Deals`
              : undefined
          }
        />

        <SummaryCard
          value={
            analysis
              .summary
              .busiestYear
              ?.label ??
            '—'
          }
          label="Busiest Year"
          detail={
            analysis
              .summary
              .busiestYear
              ? `${analysis.summary.busiestYear.count} Meal Deals`
              : undefined
          }
        />

        <SummaryCard
          value={
            analysis
              .summary
              .longestGap
              ? `${analysis.summary.longestGap.days} days`
              : '—'
          }
          label="Longest Gap"
          detail={
            analysis
              .summary
              .longestGap
              ? `${formatShortDate(
                  analysis
                    .summary
                    .longestGap
                    .from,
                )} to ${formatShortDate(
                  analysis
                    .summary
                    .longestGap
                    .to,
                )}`
              : undefined
          }
        />
      </section>

      <section className="history-favourites">
        <div className="history-favourites-header">
          <div>
            <p className="history-eyebrow">
              FAVOURITES BY PERIOD
            </p>

            <h2>
              What you were choosing
            </h2>
          </div>

          <div className="history-role-selector">
            {roleOptions.map(
              (option) => (
                <button
                  key={
                    option.role
                  }
                  className={
                    selectedRole ===
                    option.role
                      ? 'history-role-pill history-role-pill-active'
                      : 'history-role-pill'
                  }
                  onClick={() =>
                    setSelectedRole(
                      option.role,
                    )
                  }
                >
                  {
                    option.label
                  }
                </button>
              ),
            )}
          </div>
        </div>

        {favouritesNewestFirst
          .length === 0 ? (
          <div className="history-no-favourites">
            No selections available.
          </div>
        ) : (
          <div className="history-favourite-list">
            {favouritesNewestFirst.map(
              (period) => (
                <article
                  key={
                    period.key
                  }
                  className="history-favourite-row"
                >
                  <div className="history-period">
                    {
                      period.label
                    }
                  </div>

                  <div className="history-period-winner">
                    <span className="history-period-label">
                      {period
                        .leaderNames
                        .length > 1
                        ? 'Tied favourite'
                        : 'Favourite'}
                    </span>

                    <strong>
                      {period
                        .leaderNames
                        .join(
                          ' / ',
                        )}
                    </strong>
                  </div>

                  <div className="history-period-stat">
                    <strong>
                      {
                        period.count
                      }
                    </strong>

                    <span>
                      {period.count ===
                      1
                        ? 'selection'
                        : 'selections'}
                    </span>
                  </div>

                  <div className="history-period-stat">
                    <strong>
                      {formatPercent(
                        period.share,
                      )}
                    </strong>

                    <span>
                      of choices
                    </span>
                  </div>
                </article>
              ),
            )}
          </div>
        )}
      </section>
    </main>
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
          ? 'history-control-button history-control-button-active'
          : 'history-control-button'
      }
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function SummaryCard({
  value,
  label,
  detail,
}: {
  value: string
  label: string
  detail?: string
}) {
  return (
    <div className="history-summary-card">
      <strong>
        {value}
      </strong>

      <span>
        {label}
      </span>

      {detail && (
        <small>
          {detail}
        </small>
      )}
    </div>
  )
}

function TimelineChart({
  points,
  grouping,
}: {
  points: TimelinePoint[]
  grouping: TimeGrouping
}) {
  if (
    points.length === 0
  ) {
    return (
      <div className="history-chart-empty">
        No Meal Deals available.
      </div>
    )
  }

  const width = 1000
  const height = 320

  const left = 45
  const right = 25
  const top = 20
  const bottom = 55

  const chartWidth =
    width -
    left -
    right

  const chartHeight =
    height -
    top -
    bottom

  const baseline =
    top +
    chartHeight

  const maxCount =
    Math.max(
      1,
      ...points.map(
        (point) =>
          point.count,
      ),
    )

  function getX(
    index: number,
  ) {
    if (
      points.length === 1
    ) {
      return (
        left +
        chartWidth / 2
      )
    }

    return (
      left +
      (
        index /
        (
          points.length -
          1
        )
      ) *
        chartWidth
    )
  }

  function getY(
    count: number,
  ) {
    return (
      baseline -
      (
        count /
        maxCount
      ) *
        chartHeight
    )
  }

  const linePath =
    points
      .map(
        (
          point,
          index,
        ) => {
          const command =
            index === 0
              ? 'M'
              : 'L'

          return `${command} ${getX(
            index,
          )} ${getY(
            point.count,
          )}`
        },
      )
      .join(' ')

  const areaPath =
    `${linePath} ` +
    `L ${getX(
      points.length - 1,
    )} ${baseline} ` +
    `L ${getX(
      0,
    )} ${baseline} Z`

  const desiredTicks =
    grouping === 'year'
      ? Math.min(
          points.length,
          13,
        )
      : Math.min(
          points.length,
          7,
        )

  const tickIndexes =
    [
      ...new Set(
        Array.from(
          {
            length:
              desiredTicks,
          },
          (
            _,
            index,
          ) => {
            if (
              desiredTicks ===
              1
            ) {
              return 0
            }

            return Math.round(
              (
                index *
                (
                  points.length -
                  1
                )
              ) /
                (
                  desiredTicks -
                  1
                ),
            )
          },
        ),
      ),
    ]

  const gridLines =
    [
      0,
      0.25,
      0.5,
      0.75,
      1,
    ]

  return (
    <svg
      className="history-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Meal Deals over time"
    >
      {gridLines.map(
        (ratio) => {
          const y =
            baseline -
            ratio *
              chartHeight

          return (
            <line
              key={ratio}
              className="history-chart-grid"
              x1={left}
              x2={
                width -
                right
              }
              y1={y}
              y2={y}
            />
          )
        },
      )}

      <text
        className="history-chart-y-label"
        x={
          left - 10
        }
        y={
          top + 5
        }
        textAnchor="end"
      >
        {maxCount}
      </text>

      <text
        className="history-chart-y-label"
        x={
          left - 10
        }
        y={
          baseline + 5
        }
        textAnchor="end"
      >
        0
      </text>

      <path
        className="history-chart-area"
        d={areaPath}
      />

      <path
        className="history-chart-line"
        d={linePath}
      />

      {grouping ===
        'year' &&
        points.map(
          (
            point,
            index,
          ) => (
            <circle
              key={
                point.key
              }
              className="history-chart-point"
              cx={
                getX(
                  index,
                )
              }
              cy={
                getY(
                  point.count,
                )
              }
              r={3.5}
            >
              <title>
                {point.label}:{' '}
                {point.count}{' '}
                Meal Deals
              </title>
            </circle>
          ),
        )}

      {tickIndexes.map(
        (index) => (
          <text
            key={
              points[index]
                .key
            }
            className="history-chart-x-label"
            x={
              getX(
                index,
              )
            }
            y={
              height - 18
            }
            textAnchor="middle"
          >
            {
              points[index]
                .shortLabel
            }
          </text>
        ),
      )}
    </svg>
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