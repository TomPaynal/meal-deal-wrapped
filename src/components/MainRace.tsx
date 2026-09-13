import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { demoDataset } from '../data/demoData'
import { getMonthlyMainRaceSnapshots } from '../analysis/mainRace'
import './MainRace.css'

interface MainRaceProps {
  onBack: () => void
}

interface AnimatedEntry {
  productId: string
  name: string
  count: number
}

const MS_PER_MONTH = 170
const MAX_VISIBLE = 8
const ROW_HEIGHT = 76

export function MainRace({ onBack }: MainRaceProps) {
  const snapshots = useMemo(
    () => getMonthlyMainRaceSnapshots(demoDataset),
    [],
  )

  const [started, setStarted] = useState(false)
  const [playing, setPlaying] = useState(false)

  // Unlike V1, this can now be a decimal:
  // 12.0 = snapshot 12
  // 12.5 = halfway between snapshot 12 and 13
  const [playhead, setPlayhead] = useState(0)

  const animationStartTime = useRef<number | null>(
    null,
  )

  const animationStartPlayhead = useRef(0)

  useEffect(() => {
    if (!started || !playing) {
      animationStartTime.current = null
      return
    }

    let animationFrameId = 0

    function animate(now: number) {
      if (animationStartTime.current === null) {
        animationStartTime.current = now
      }

      const elapsed =
        now - animationStartTime.current

      const monthsElapsed =
        elapsed / MS_PER_MONTH

      const nextPlayhead =
        animationStartPlayhead.current +
        monthsElapsed

      const finalPlayhead =
        snapshots.length - 1

      if (nextPlayhead >= finalPlayhead) {
        setPlayhead(finalPlayhead)
        setPlaying(false)
        return
      }

      setPlayhead(nextPlayhead)

      animationFrameId =
        window.requestAnimationFrame(animate)
    }

    animationFrameId =
      window.requestAnimationFrame(animate)

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
        <p>No demo race data is available.</p>

        <button
          className="race-back"
          onClick={onBack}
        >
          Back
        </button>
      </main>
    )
  }

  if (!started) {
    return (
      <main className="race-shell">
        <button
          className="race-back"
          onClick={onBack}
        >
          ← Back
        </button>

        <section className="race-ready">
          <p className="race-eyebrow">
            DEMO DATA
          </p>

          <h1 className="race-ready-title">
            The All-Time
            <span> Mains Race</span>
          </h1>

          <p className="race-ready-copy">
            Watch years of completely fictional
            Meal Deal history unfold month by
            month.
          </p>

          <button
            className="race-start"
            onClick={startRace}
          >
            Start race
          </button>

          <p className="race-warning">
            No final standings until you press
            the button.
          </p>
        </section>
      </main>
    )
  }

  const lowerIndex = Math.floor(playhead)

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
    lowerSnapshot.entries.map((entry) => [
      entry.productId,
      entry,
    ]),
  )

  const upperCounts = new Map(
    upperSnapshot.entries.map((entry) => [
      entry.productId,
      entry,
    ]),
  )

  // Because the data is cumulative, the final
  // snapshot contains every main ever encountered.
  const allProducts =
    snapshots[snapshots.length - 1].entries

  const animatedEntries: AnimatedEntry[] =
    allProducts
      .map((product) => {
        const lower =
          lowerCounts.get(product.productId)

        const upper =
          upperCounts.get(product.productId)

        const startCount =
          lower?.count ?? 0

        const endCount =
          upper?.count ?? startCount

        const count =
          startCount +
          (endCount - startCount) *
            fraction

        return {
          productId: product.productId,
          name: product.name,
          count,
        }
      })
      .filter((entry) => entry.count > 0)
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count
        }

        return a.name.localeCompare(b.name)
      })

  const finalMaximumCount = Math.max(
    1,
    ...snapshots[
      snapshots.length - 1
    ].entries.map((entry) => entry.count),
  )

  const visibleCount = Math.min(
    animatedEntries.length,
    MAX_VISIBLE,
  )

  const progress =
    snapshots.length > 1
      ? (playhead /
          (snapshots.length - 1)) *
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
    playhead >= snapshots.length - 1 &&
    !playing

  return (
    <main className="race-shell">
      <header className="race-header">
        <button
          className="race-back"
          onClick={onBack}
        >
          ← Back
        </button>

        <div>
          <p className="race-eyebrow">
            ALL-TIME MAINS
          </p>

          <h1 className="race-title">
            Meal Deal Race
          </h1>
        </div>

        <div className="race-date">
          {displayedSnapshot.label}
        </div>
      </header>

      <section
        className="race-track"
        style={{
          height: `${
            Math.max(visibleCount, 1) *
            ROW_HEIGHT
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
                key={entry.productId}
                className="race-row"
                style={{
                  transform: `translateY(${
                    rank * ROW_HEIGHT
                  }px)`,
                  opacity: visible ? 1 : 0,
                  zIndex:
                    MAX_VISIBLE - rank,
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
                  {Math.round(entry.count)}
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
            onClick={replayRace}
          >
            Replay race
          </button>
        )}
      </footer>
    </main>
  )
}