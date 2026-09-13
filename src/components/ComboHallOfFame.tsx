import { useMemo } from 'react'

import type {
  MealDealDataset,
} from '../types/data'

import {
  getComboRankings,
  type ComboRankingEntry,
} from '../analysis/combos'

import {
  deriveMealDeals,
} from '../analysis/mealDeals'

import './ComboHallOfFame.css'

interface ComboHallOfFameProps {
  dataset: MealDealDataset
  onBack: () => void
}

export function ComboHallOfFame({
  dataset,
  onBack,
}: ComboHallOfFameProps) {
  const rankings = useMemo(
    () => getComboRankings(dataset),
    [dataset],
  )

  const mealDeals = useMemo(
    () => deriveMealDeals(dataset),
    [dataset],
  )

  if (rankings.length === 0) {
    return (
      <main className="combo-shell">
        <button
          className="combo-back"
          onClick={onBack}
        >
          ← Back
        </button>

        <p>No combo data is available.</p>
      </main>
    )
  }

  const winner = rankings[0]

  const podiumRunnersUp =
    rankings.slice(1, 3)

  const remainingTopTen =
    rankings.slice(3, 10)

  const dataLabel =
    dataset.source === 'demo'
      ? 'DEMO DATA'
      : 'YOUR DATA'

  return (
    <main className="combo-shell">
      <header className="combo-header">
        <button
          className="combo-back"
          onClick={onBack}
        >
          ← Back
        </button>

        <div className="combo-heading">
          <p className="combo-eyebrow">
            COMBO HALL OF FAME
          </p>

          <h1>
            Lifetime favourites
          </h1>
        </div>
      </header>

      <section className="combo-hero">
        <p className="combo-eyebrow">
          {dataLabel}
        </p>

        <p className="combo-winner-kicker">
          Your all-time favourite Meal Deal
        </p>

        <PodiumCard
          combo={winner}
          rank={1}
          size="first"
        />

        {podiumRunnersUp.length > 0 && (
          <div className="combo-podium-stack">
            {podiumRunnersUp.map(
              (combo, index) => (
                <PodiumCard
                  key={[
                    combo.mainProductId,
                    combo.sideProductId,
                    combo.drinkProductId,
                  ].join('|')}
                  combo={combo}
                  rank={index + 2}
                  size={
                    index === 0
                      ? 'second'
                      : 'third'
                  }
                />
              ),
            )}
          </div>
        )}

        <div className="combo-summary">
          <div>
            <strong>
              {mealDeals.length}
            </strong>

            <span>
              Meal Deals Analysed
            </span>
          </div>

          <div>
            <strong>
              {rankings.length}
            </strong>

            <span>
              Unique Combinations
            </span>
          </div>
        </div>
      </section>

      {remainingTopTen.length > 0 && (
        <section className="combo-ranking">
          <div className="combo-ranking-title">
            <p className="combo-eyebrow">
              THE REST OF THE TOP 10
            </p>

            <h2>
              Honourable mentions
            </h2>
          </div>

          <div className="combo-list">
            {remainingTopTen.map(
              (combo, index) => (
                <article
                  key={[
                    combo.mainProductId,
                    combo.sideProductId,
                    combo.drinkProductId,
                  ].join('|')}
                  className="combo-row"
                >
                  <div className="combo-row-rank">
                    #{index + 4}
                  </div>

                  <div className="combo-row-products">
                    <span>
                      {combo.mainName}
                    </span>

                    <span className="combo-row-plus">
                      +
                    </span>

                    <span>
                      {combo.sideName}
                    </span>

                    <span className="combo-row-plus">
                      +
                    </span>

                    <span>
                      {combo.drinkName}
                    </span>
                  </div>

                  <div className="combo-row-count">
                    {combo.count}×
                  </div>
                </article>
              ),
            )}
          </div>
        </section>
      )}
    </main>
  )
}

interface PodiumCardProps {
  combo: ComboRankingEntry
  rank: number
  size: 'first' | 'second' | 'third'
}

function PodiumCard({
  combo,
  rank,
  size,
}: PodiumCardProps) {
  return (
    <article
      className={`combo-podium-card combo-podium-${size}`}
    >
      <div className="combo-podium-topline">
        <span className="combo-podium-rank">
          #{rank}
        </span>

        <span className="combo-podium-count">
          <strong>
            {combo.count}
          </strong>

          <span>
            {combo.count === 1
              ? 'time together'
              : 'times together'}
          </span>
        </span>
      </div>

      <div className="combo-products">
        <ProductBlock
          role="Main"
          name={combo.mainName}
        />

        <div className="combo-plus">
          +
        </div>

        <ProductBlock
          role="Snack"
          name={combo.sideName}
        />

        <div className="combo-plus">
          +
        </div>

        <ProductBlock
          role="Drink"
          name={combo.drinkName}
        />
      </div>
    </article>
  )
}

interface ProductBlockProps {
  role: string
  name: string
}

function ProductBlock({
  role,
  name,
}: ProductBlockProps) {
  return (
    <div className="combo-product">
      <span className="combo-product-role">
        {role}
      </span>

      <strong>
        {name}
      </strong>
    </div>
  )
}