import {
  useMemo,
  useState,
} from 'react'

import type {
  MealDealDataset,
} from '../types/data'

import {
  analyseLongestStreak,
  type StreakRole,
} from '../analysis/longestStreak'

import './LongestStreak.css'

interface LongestStreakProps {
  dataset: MealDealDataset
  onBack: () => void
}

interface StreakOption {
  role: StreakRole
  label: string
  singular: string
}

const options: StreakOption[] = [
  {
    role: 'main',
    label: 'Mains',
    singular: 'Main',
  },
  {
    role: 'side',
    label: 'Snacks',
    singular: 'Snack',
  },
  {
    role: 'drink',
    label: 'Drinks',
    singular: 'Drink',
  },
]

export function LongestStreak({
  dataset,
  onBack,
}: LongestStreakProps) {
  const [
    selectedRole,
    setSelectedRole,
  ] =
    useState<StreakRole>(
      'main',
    )

  const analysis =
    useMemo(
      () =>
        analyseLongestStreak(
          dataset,
          selectedRole,
        ),
      [
        dataset,
        selectedRole,
      ],
    )

  const selectedOption =
    options.find(
      (option) =>
        option.role ===
        selectedRole,
    ) ?? options[0]

  const streak =
    analysis.streaks[0]

  const tied =
    analysis.streaks.length >
    1

  return (
    <main className="streak-shell">
      <div className="streak-content">
        <header className="streak-header">
          <button
            className="streak-back"
            onClick={onBack}
          >
            ← Back
          </button>

          <div className="streak-heading">
            <p>
              CREATURE OF HABIT
            </p>

            <h1>
              Longest streak
            </h1>
          </div>
        </header>

        <nav
          className="streak-selector"
          aria-label="Choose streak category"
        >
          {options.map(
            (option) => (
              <button
                key={
                  option.role
                }
                className={
                  option.role ===
                  selectedRole
                    ? 'streak-pill streak-pill-active'
                    : 'streak-pill'
                }
                onClick={() =>
                  setSelectedRole(
                    option.role,
                  )
                }
              >
                {option.label}
              </button>
            ),
          )}
        </nav>

        {!streak ? (
          <section className="streak-empty">
            No resolved Meal Deal
            history available.
          </section>
        ) : (
          <>
            <section className="streak-reveal">
              <span>
                LONGEST{' '}
                {selectedOption.singular.toUpperCase()}{' '}
                STREAK
              </span>

              <strong>
                {analysis.maxCount}
              </strong>

              <em>
                IN A ROW
              </em>
            </section>

            <section className="streak-product">
              <span>
                {
                  selectedOption.singular
                }
              </span>

              <strong>
                {
                  streak.productName
                }
              </strong>

              <small>
                {formatRange(
                  streak.startedAt,
                  streak.endedAt,
                )}
              </small>
            </section>

            <p className="streak-copy">
              You chose it for{' '}
              <strong>
                {analysis.maxCount}
              </strong>{' '}
              consecutive Meal Deals.
            </p>

            {tied && (
              <p className="streak-tie">
                Tied record —{' '}
                {
                  analysis
                    .streaks
                    .length
                }{' '}
                streaks reached{' '}
                {
                  analysis.maxCount
                }{' '}
                in a row.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  )
}

function formatRange(
  startedAt: string,
  endedAt: string,
): string {
  const start =
    new Date(
      startedAt,
    )

  const end =
    new Date(
      endedAt,
    )

  const sameDay =
    start.getTime() ===
    end.getTime()

  if (sameDay) {
    return formatDate(
      start,
      true,
    )
  }

  return `${formatDate(
    start,
    false,
  )} → ${formatDate(
    end,
    true,
  )}`
}

function formatDate(
  date: Date,
  includeYear: boolean,
): string {
  return new Intl.DateTimeFormat(
    'en-GB',
    {
      day: 'numeric',
      month: 'short',

      ...(includeYear
        ? {
            year:
              'numeric',
          }
        : {}),

      timeZone: 'UTC',
    },
  ).format(date)
}