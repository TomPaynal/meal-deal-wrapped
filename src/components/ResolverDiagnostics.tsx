import { useMemo } from 'react'

import type {
  MealDealDataset,
} from '../types/data'

import type {
  DemoDiagnosticCase,
} from '../data/demoEdgeCases'

import {
  resolveMealDeals,
} from '../analysis/mealDeals'

import {
  analyseResolverHeuristics,
  type HeuristicResult,
} from '../analysis/resolverDiagnostics'

import './ResolverDiagnostics.css'

interface ResolverDiagnosticsProps {
  dataset: MealDealDataset
  cases: DemoDiagnosticCase[]
  onBack: () => void
}

export function ResolverDiagnostics({
  dataset,
  cases,
  onBack,
}: ResolverDiagnosticsProps) {
  const resolution =
    useMemo(
      () =>
        resolveMealDeals(
          dataset,
        ),
      [dataset],
    )

  return (
    <main className="diagnostics-shell">
      <header className="diagnostics-header">
        <button
          className="diagnostics-back"
          onClick={onBack}
        >
          ← Back
        </button>

        <div>
          <p className="diagnostics-eyebrow">
            DEVELOPMENT TOOL
          </p>

          <h1>
            Resolver diagnostics
          </h1>
        </div>
      </header>

      <section className="diagnostics-summary">
        <Summary
          value={
            resolution.deals.length
          }
          label="Strictly resolved deals"
        />

        <Summary
          value={
            resolution
              .ambiguousBaskets
              .length
          }
          label="Ambiguous baskets"
        />

        <Summary
          value={
            resolution
              .memberships
              .length
          }
          label="Resolved memberships"
        />
      </section>

      <section className="diagnostics-cases">
        {cases.map(
          (diagnosticCase) => {
            const transaction =
              dataset.transactions.find(
                (candidate) =>
                  candidate.id ===
                  diagnosticCase.transactionId,
              )

            if (!transaction) {
              return null
            }

            const analysis =
              analyseResolverHeuristics(
                dataset,
                transaction,
              )

            const strict =
              resolution
                .ambiguousBaskets
                .find(
                  (basket) =>
                    basket.transactionId ===
                    transaction.id,
                )

            return (
              <article
                key={
                  diagnosticCase.transactionId
                }
                className="diagnostic-card"
              >
                <div className="diagnostic-case-heading">
                  <div>
                    <p className="diagnostics-eyebrow">
                      {
                        diagnosticCase.transactionId
                      }
                    </p>

                    <h2>
                      {
                        diagnosticCase.title
                      }
                    </h2>

                    <p>
                      {
                        diagnosticCase.description
                      }
                    </p>
                  </div>

                  <AgreementBadge
                    agreement={
                      analysis.agreement
                    }
                  />
                </div>

                <h3>
                  Source item order
                </h3>

                <div className="scan-order">
                  {transaction.items.map(
                    (item, index) => {
                      const product =
                        dataset.products[
                          item.productId
                        ]

                      return (
                        <div
                          key={`${item.productId}-${index}`}
                          className="scan-item"
                        >
                          <span className="scan-number">
                            {index + 1}
                          </span>

                          <span className="scan-role">
                            {
                              product
                                ?.mealDealRole ??
                              'other'
                            }
                          </span>

                          <strong>
                            {
                              product
                                ?.displayName ??
                              product
                                ?.rawName ??
                              item.productId
                            }
                          </strong>

                          <span className="scan-price">
                            {formatMoney(
                              item.shelfPricePence,
                            )}
                          </span>
                        </div>
                      )
                    },
                  )}
                </div>

                <div className="heuristic-grid">
                  <HeuristicPanel
                    title="Strict resolver"
                    result={{
                      status: strict
                        ? 'ambiguous'
                        : 'resolved',

                      summary: strict
                        ? `Rejected safely: ${strict.reason}.`
                        : 'Accepted by the production resolver.',

                      deals: [],
                    }}
                  />

                  <HeuristicPanel
                    title="Highest-value heuristic"
                    result={
                      analysis.value
                    }
                  />

                  <HeuristicPanel
                    title="Scan-order heuristic"
                    result={
                      analysis.scanOrder
                    }
                  />
                </div>
              </article>
            )
          },
        )}
      </section>
    </main>
  )
}

function Summary({
  value,
  label,
}: {
  value: number
  label: string
}) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function HeuristicPanel({
  title,
  result,
}: {
  title: string
  result: HeuristicResult
}) {
  return (
    <div className="heuristic-panel">
      <div className="heuristic-heading">
        <strong>
          {title}
        </strong>

        <span
          className={`heuristic-status heuristic-${result.status}`}
        >
          {result.status}
        </span>
      </div>

      <p>
        {result.summary}
      </p>

      {result.deals.map(
        (deal, index) => (
          <div
            key={[
              deal.mainProductId,
              deal.sideProductId,
              deal.drinkProductId,
              index,
            ].join('|')}
            className="heuristic-deal"
          >
            Deal {index + 1}:{' '}
            {deal.mainProductId}
            {' + '}
            {deal.sideProductId}
            {' + '}
            {deal.drinkProductId}
          </div>
        ),
      )}
    </div>
  )
}

function AgreementBadge({
  agreement,
}: {
  agreement:
    | 'agree'
    | 'conflict'
    | 'partial'
    | 'none'
}) {
  const labels = {
    agree: 'Heuristics agree',
    conflict: 'HEURISTIC CONFLICT',
    partial: 'One usable signal',
    none: 'No usable inference',
  }

  return (
    <span
      className={`agreement-badge agreement-${agreement}`}
    >
      {labels[agreement]}
    </span>
  )
}

function formatMoney(
  value:
    | number
    | undefined,
): string {
  if (value === undefined) {
    return '—'
  }

  return `£${(
    value / 100
  ).toFixed(2)}`
}