import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { demoDataset } from '../data/demoData'

import {
  getMonthlyRaceSnapshots,
  type RaceRole,
} from '../analysis/mealDealRace'

import './MealDealRace.css'

interface MealDealRaceProps {
  onBack: () => void
}

interface AnimatedEntry {
  productId: string
  name: string
  count: number
}

interface RaceOption {
  role: RaceRole
  label: string
  heading: string
}

const raceOptions: RaceOption[] = [
  {
    role: 'main',
    label: 'Mains',
    heading: 'All-Time Mains',
  },
  {
    role: 'side',
    label: 'Snacks',
    heading: 'All-Time Snacks',
  },
  {
    role: 'drink',
    label: 'Drinks',
    heading: 'All-Time Drinks',
  },
]

const MS_PER_MONTH = 170
const MAX_VISIBLE = 8
const ROW_HEIGHT = 76

export function MealDealRace({
  onBack,
}: MealDealRaceProps) {
  const [selectedRole, setSelectedRole] =
    useState<RaceRole>('main')

  const [started, setStarted] =
    useState(false)

  const [playing, setPlaying] =
    useState(false)

  const [playhead, setPlayhead] =
    useState(0)

  const animationStartTime =
    useRef<number | null>(null)

  const animationStartPlayhead =
    useRef(0)

  const snapshots = useMemo(
    () =>
      getMonthlyRaceSnapshots(
        demoDataset,
        selectedRole,
      ),
    [selectedRole],
  )

  const selectedOption =
    raceOptions.find(
      (option) =>
        option.role === selectedRole,
    ) ?? raceOptions[0]

  useEffect(() => {
    if (!started || !playing) {
      animationStartTime.current =
        null

      return
    }

    let animationFrameId = 0

    function animate(now: number) {
      if (
        animationStartTime.current ===
        null
      ) {
        animationStartTime.current =
          now
      }

      const elapsed =
        now -
        animationStartTime.current

      const monthsElapsed =
        elapsed / MS_PER_MONTH

      const nextPlayhead =
        animationStartPlayhead.current +
        monthsElapsed

      const finalPlayhead =
        snapshots.length - 1

      if (
        nextPlayhead >= finalPlayhead
      ) {
        setPlayhead(finalPlayhead)
        setPlaying(false)
        return
      }

      setPlayhead(nextPlayhead)

      animationFrameId =
        window.requestAnimationFrame(
          animate,
        )
    }

    animationFrameId =
      window.requestAnimationFrame(
        animate,
      )

    return () => {
      window.cancelAnimationFrame(
        animationFrameId,
      )
    }
  }, [
    started,
    playing,
    snapshots.length,
  ])

  function selectRace(
    role: RaceRole,
  ) {
    setSelectedRole(role)

    setStarted(false)
    setPlaying(false)
    setPlayhead(0)

    animationStartTime.current = null
    animationStartPlayhead.current = 0
  }

  function startRace() {
    animationStartPlayhead.current = 0
    animationStartTime.current = null

    setPlayhead(0)
    setStarted(true)
    setPlaying(true)
  }

  function replayRace() {
    animationStartPlayhead.current = 0
    animationStartTime.current = null

    setPlayhead(0)
    setPlaying(true)
  }

  if (snapshots.length === 0) {
    return (
      <main className="race-shell">
        <p>
          No demo race data is
          available.
        </p>

        <button
          className="race-back"
          onClick={onBack}
        >
          Back
        </button>
      </main>
    )
  }

  return (
    <main className="race-shell">
      <header className="race-page-header">
        <button
          className="race-back"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="race-page-heading">
          <p className="race-eyebrow">
            MEAL DEAL RACE
          </p>

          <h1 className="race-title">
            Lifetime rankings
          </h1>
        </div>
      </header>

      <nav
        className="race-selector"
        aria-label="Choose race"
      >
        {raceOptions.map(
          (option) => (
            <button
              key={option.role}
              className={
                option.role ===
                selectedRole
                  ? 'race-selector-button active'
                  : 'race-selector-button'
              }
              onClick={() =>
                selectRace(
                  option.role,
                )
              }
            >
              {option.label}
            </button>
          ),
        )}
      </nav>

      {!started ? (
        <section className="race-ready">
          <p className="race-eyebrow">
            DEMO DATA
          </p>

          <h2 className="race-ready-title">
            The
            <span>
              {' '}
              {selectedOption.heading}
            </span>
          </h2>

          <p className="race-ready-copy">
            Watch years of completely
            fictional Meal Deal history
            unfold month by month.
          </p>

          <button
            className="race-start"
            onClick={startRace}
          >
            Start {selectedOption.label.toLowerCase()} race
          </button>

          <p className="race-warning">
            Final standings stay hidden
            until you start.
          </p>
        </section>
      ) : (
        <RaceAnimation
          snapshots={snapshots}
          playhead={playhead}
          playing={playing}
          selectedOption={
            selectedOption
          }
          onReplay={replayRace}
        />
      )}
    </main>
  )
}

interface RaceAnimationProps {
  snapshots: ReturnType<
    typeof getMonthlyRaceSnapshots
  >
  playhead: number
  playing: boolean
  selectedOption: RaceOption
  onReplay: () => void
}

function RaceAnimation({
  snapshots,
  playhead,
  playing,
  selectedOption,
  onReplay,
}: RaceAnimationProps) {
  const lowerIndex =
    Math.floor(playhead)

  const upperIndex = Math.min(
    lowerIndex + 1,
    snapshots.length - 1,
  )

  const fraction =
    playhead - lowerIndex

  const lowerSnapshot =
    snapshots[lowerIndex]

  const upperSnapshot =
    snapshots[upperIndex]

  const lowerCounts = new Map(
    lowerSnapshot.entries.map(
      (entry) => [
        entry.productId,
        entry,
      ],
    ),
  )

  const upperCounts = new Map(
    upperSnapshot.entries.map(
      (entry) => [
        entry.productId,
        entry,
      ],
    ),
  )

  const allProducts =
    snapshots[
      snapshots.length - 1
    ].entries

  const animatedEntries: AnimatedEntry[] =
    allProducts
      .map((product) => {
        const lower =
          lowerCounts.get(
            product.productId,
          )

        const upper =
          upperCounts.get(
            product.productId,
          )

        const startCount =
          lower?.count ?? 0

        const endCount =
          upper?.count ??
          startCount

        const count =
          startCount +
          (endCount -
            startCount) *
            fraction

        return {
          productId:
            product.productId,

          name: product.name,

          count,
        }
      })
      .filter(
        (entry) =>
          entry.count > 0,
      )
      .sort((a, b) => {
        if (
          b.count !== a.count
        ) {
          return (
            b.count - a.count
          )
        }

        return a.name.localeCompare(
          b.name,
        )
      })

  const finalMaximumCount =
    Math.max(
      1,
      ...snapshots[
        snapshots.length - 1
      ].entries.map(
        (entry) => entry.count,
      ),
    )

  const visibleCount =
    Math.min(
      animatedEntries.length,
      MAX_VISIBLE,
    )

  const progress =
    snapshots.length > 1
      ? (playhead /
          (snapshots.length -
            1)) *
        100
      : 100

  const displayedSnapshot =
    snapshots[
      Math.min(
        Math.floor(playhead),
        snapshots.length - 1,
      )
    ]

  const finished =
    playhead >=
      snapshots.length - 1 &&
    !playing

  return (
    <>
      <div className="race-live-heading">
        <div>
          <p className="race-eyebrow">
            {selectedOption.heading.toUpperCase()}
          </p>

          <h2 className="race-live-title">
            Meal Deal Race
          </h2>
        </div>

        <div className="race-date">
          {displayedSnapshot.label}
        </div>
      </div>

      <section
        className="race-track"
        style={{
          height: `${
            Math.max(
              visibleCount,
              1,
            ) * ROW_HEIGHT
          }px`,
        }}
      >
        {animatedEntries.map(
          (entry, rank) => {
            const width =
              (entry.count /
                finalMaximumCount) *
              100

            const visible =
              rank < MAX_VISIBLE

            return (
              <div
                key={
                  entry.productId
                }
                className="race-row"
                style={{
                  transform: `translateY(${
                    rank *
                    ROW_HEIGHT
                  }px)`,

                  opacity:
                    visible
                      ? 1
                      : 0,

                  zIndex:
                    MAX_VISIBLE -
                    rank,
                }}
              >
                <div className="race-rank">
                  {rank + 1}
                </div>

                <div className="race-bar-zone">
                  <div
                    className="race-bar"
                    style={{
                      width: `${width}%`,
                    }}
                  />

                  <span className="race-name">
                    {entry.name}
                  </span>
                </div>

                <div className="race-count">
                  {Math.round(
                    entry.count,
                  )}
                </div>
              </div>
            )
          },
        )}
      </section>

      <footer className="race-footer">
        <div className="race-progress">
          <div
            className="race-progress-fill"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        {finished && (
          <button
            className="race-replay"
            onClick={onReplay}
          >
            Replay race
          </button>
        )}
      </footer>
    </>
  )
}