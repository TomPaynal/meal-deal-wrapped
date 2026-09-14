import {
  useState,
} from 'react'

import type {
  ChangeEvent,
} from 'react'

import type {
  MealDealDataset,
} from './types/data'

import {
  demoDataset,
} from './data/demoData'

import {
  demoDiagnosticCases,
  demoDiagnosticDataset,
} from './data/demoEdgeCases'

import {
  importTescoPortability,
} from './import/tescoPortability'

import type {
  TescoImportDiagnostics,
} from './import/tescoPortability'

import {
  detectTescoMealDealCandidates,
} from './import/tescoMealDealCandidates'

import type {
  TescoMealDealCandidateDiagnostics,
} from './import/tescoMealDealCandidates'

import {
  MobileWrappedJourney,
} from './components/MobileWrappedJourney'

import {
  MealDealRace,
} from './components/MealDealRace'

import {
  ResolverDiagnostics,
} from './components/ResolverDiagnostics'

import {
  BeatMealDeal,
} from './components/BeatMealDeal'

import {
  ThroughTheYearsExperience,
} from './components/ThroughTheYearsExperience'

import {
  FavouritesExperience,
} from './components/FavouritesExperience'

import {
  LongestStreak,
} from './components/LongestStreak'

import './App.css'

type Screen =
  | 'home'
  | 'wrapped'
  | 'race'
  | 'heist'
  | 'history'
  | 'streaks'
  | 'favourites'
  | 'diagnostics'

function isMealDealDataset(
  value: unknown,
): value is MealDealDataset {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false
  }

  const candidate =
    value as Partial<MealDealDataset>

  return (
    candidate.schemaVersion === 1 &&
    typeof candidate.products ===
      'object' &&
    candidate.products !== null &&
    Array.isArray(
      candidate.transactions,
    )
  )
}

function App() {
  const [
    fileName,
    setFileName,
  ] = useState<
    string | null
  >(null)

  const [
    importedDataset,
    setImportedDataset,
  ] = useState<
    MealDealDataset | null
  >(null)

  const [
    importDiagnostics,
    setImportDiagnostics,
  ] = useState<
    TescoImportDiagnostics | null
  >(null)

  const [
    candidateDiagnostics,
    setCandidateDiagnostics,
  ] = useState<
    TescoMealDealCandidateDiagnostics | null
  >(null)

  const [
    importError,
    setImportError,
  ] = useState<
    string | null
  >(null)

  const [
    isImporting,
    setIsImporting,
  ] = useState(false)

  const [
    screen,
    setScreen,
  ] = useState<Screen>(
    'home',
  )

  const activeDataset =
    importedDataset ??
    demoDataset

  async function handleFileChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0]

    if (!file) {
      return
    }

    setFileName(
      file.name,
    )

    setImportedDataset(
      null,
    )

    setImportDiagnostics(
      null,
    )

    setCandidateDiagnostics(
      null,
    )

    setImportError(
      null,
    )

    setIsImporting(
      true,
    )

    try {
      const text =
        await file.text()

      const rawData:
        unknown =
          JSON.parse(text)

      /*
       * PERSONAL CLEANED DATASET
       *
       * If the JSON is already in our internal
       * MealDealDataset shape, use it directly.
       */
      if (
        isMealDealDataset(
          rawData,
        )
      ) {
        setImportedDataset(
          rawData,
        )

        return
      }

      /*
       * RAW TESCO EXPORT
       *
       * Otherwise use the normal importer and
       * diagnostic pipeline.
       */
      const result =
        importTescoPortability(
          rawData,
        )

      const candidateResult =
        detectTescoMealDealCandidates(
          result.dataset,
        )

      setImportedDataset(
        result.dataset,
      )

      setImportDiagnostics(
        result.diagnostics,
      )

      setCandidateDiagnostics(
        candidateResult.diagnostics,
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown import error.'

      setImportError(
        message,
      )
    } finally {
      setIsImporting(
        false,
      )
    }
  }

  if (
    screen === 'wrapped'
  ) {
    return (
      <MobileWrappedJourney
        dataset={
          activeDataset
        }
        onExit={() =>
          setScreen('home')
        }
      />
    )
  }

  if (
    screen === 'race'
  ) {
    return (
      <MealDealRace
        dataset={
          activeDataset
        }
        onBack={() =>
          setScreen('home')
        }
      />
    )
  }

  if (
    screen === 'heist'
  ) {
    return (
      <BeatMealDeal
        dataset={
          activeDataset
        }
        onBack={() =>
          setScreen('home')
        }
      />
    )
  }

  if (
    screen === 'history'
  ) {
    return (
      <ThroughTheYearsExperience
        dataset={
          activeDataset
        }
        onBack={() =>
          setScreen('home')
        }
      />
    )
  }

  if (
    screen === 'streaks'
  ) {
    return (
      <LongestStreak
        dataset={
          activeDataset
        }
        onBack={() =>
          setScreen('home')
        }
      />
    )
  }

  if (
    screen ===
    'favourites'
  ) {
    return (
      <FavouritesExperience
        dataset={
          activeDataset
        }
        onBack={() =>
          setScreen('home')
        }
      />
    )
  }

  if (
    screen ===
    'diagnostics'
  ) {
    return (
      <ResolverDiagnostics
        dataset={
          demoDiagnosticDataset
        }
        cases={
          demoDiagnosticCases
        }
        onBack={() =>
          setScreen('home')
        }
      />
    )
  }

  return (
    <main className="app">
      <section className="hero">
        <p className="eyebrow">
          ULTIMATE RATE MY MEAL DEAL
        </p>

        <h1>
          Meal Deal
          <span>
            {' '}
            Wrapped
          </span>
        </h1>

        <p className="intro">
          Discover an unnecessarily
          detailed history of your Tesco
          Meal Deal habits.
        </p>

        <div className="actions">
          <label className="file-button">
            {isImporting
              ? 'Reading Tesco JSON...'
              : 'Choose Tesco JSON'}

            <input
              type="file"
              accept=".json,application/json"
              onChange={
                handleFileChange
              }
            />
          </label>

          <button
            className="demo-button mobile-wrapped-button"
            onClick={() =>
              setScreen(
                'wrapped',
              )
            }
          >
            Start Wrapped
          </button>

          <button
            className="demo-button desktop-feature-button"
            onClick={() =>
              setScreen('race')
            }
          >
            Preview races
          </button>

          <button
            className="demo-button desktop-feature-button"
            onClick={() =>
              setScreen(
                'favourites',
              )
            }
          >
            Your favourites
          </button>

          <button
            className="demo-button desktop-feature-button"
            onClick={() =>
              setScreen('heist')
            }
          >
            Beat the Meal Deal
          </button>

          <button
            className="demo-button desktop-feature-button"
            onClick={() =>
              setScreen(
                'history',
              )
            }
          >
            Through the years
          </button>

          <button
            className="demo-button desktop-feature-button"
            onClick={() =>
              setScreen(
                'streaks',
              )
            }
          >
            Longest streak
          </button>

          <button
            className="demo-button desktop-feature-button"
            onClick={() =>
              setScreen(
                'diagnostics',
              )
            }
          >
            Resolver diagnostics
          </button>
        </div>

        {fileName && (
          <p className="selected-file">
            Selected:{' '}
            <strong>
              {fileName}
            </strong>
          </p>
        )}

        {importError && (
          <section className="import-diagnostics import-diagnostics-error">
            <strong>
              Couldn&apos;t import this file
            </strong>

            <p>
              {importError}
            </p>
          </section>
        )}

        {importedDataset &&
          !importDiagnostics && (
            <section className="import-diagnostics">
              <strong className="import-diagnostics-title">
                ✓ Cleaned Meal Deal data loaded
              </strong>

              <p className="import-ready">
                Ready for Wrapped.
              </p>
            </section>
          )}

        {importedDataset &&
          importDiagnostics && (
            <section className="import-diagnostics">
              <strong className="import-diagnostics-title">
                ✓ Tesco data loaded
              </strong>

              <div className="import-diagnostics-grid">
                <div>
                  <span>
                    Transactions imported
                  </span>

                  <strong>
                    {
                      importDiagnostics
                        .importedTransactionCount
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Products found
                  </span>

                  <strong>
                    {
                      importDiagnostics
                        .productCount
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Main-like products
                  </span>

                  <strong>
                    {
                      importDiagnostics
                        .mainProductCount
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Snack-like products
                  </span>

                  <strong>
                    {
                      importDiagnostics
                        .sideProductCount
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Drink-like products
                  </span>

                  <strong>
                    {
                      importDiagnostics
                        .drinkProductCount
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Unknown products
                  </span>

                  <strong>
                    {
                      importDiagnostics
                        .unknownProductCount
                    }
                  </strong>
                </div>

                {candidateDiagnostics && (
                  <>
                    <div>
                      <span>
                        Candidate transactions
                      </span>

                      <strong>
                        {
                          candidateDiagnostics
                            .candidateTransactionCount
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Exact 3-item candidates
                      </span>

                      <strong>
                        {
                          candidateDiagnostics
                            .exactThreeItemCandidateCount
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Main + snack, no drink
                      </span>

                      <strong>
                        {
                          candidateDiagnostics
                            .mainAndSideNoDrinkCount
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Main + drink, no snack
                      </span>

                      <strong>
                        {
                          candidateDiagnostics
                            .mainAndDrinkNoSideCount
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Snack + drink, no main
                      </span>

                      <strong>
                        {
                          candidateDiagnostics
                            .sideAndDrinkNoMainCount
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Single recognised role
                      </span>

                      <strong>
                        {
                          candidateDiagnostics
                            .singleRoleOnlyTransactionCount
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Main only
                      </span>

                      <strong>
                        {
                          candidateDiagnostics
                            .mainOnlyTransactionCount
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Snack only
                      </span>

                      <strong>
                        {
                          candidateDiagnostics
                            .sideOnlyTransactionCount
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Drink only
                      </span>

                      <strong>
                        {
                          candidateDiagnostics
                            .drinkOnlyTransactionCount
                        }
                      </strong>
                    </div>

                    <div>
                      <span>
                        Multi-deal candidates
                      </span>

                      <strong>
                        {
                          candidateDiagnostics
                            .multiDealCandidateTransactionCount
                        }
                      </strong>
                    </div>
                  </>
                )}
              </div>

              <p className="import-ready">
                Inspecting historical role coverage.
              </p>
            </section>
          )}

        <p className="privacy">
          Your shopping data is processed
          entirely on your device.
        </p>
      </section>
    </main>
  )
}

export default App