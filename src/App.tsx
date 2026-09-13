import { useState } from 'react'

import {
  demoDataset,
} from './data/demoData'

import {
  demoDiagnosticCases,
  demoDiagnosticDataset,
} from './data/demoEdgeCases'

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
  FavouritesByPeriod,
} from './components/FavouritesByPeriod'

import {
  LongestStreak,
} from './components/LongestStreak'

import './App.css'

type Screen =
  | 'home'
  | 'race'
  | 'heist'
  | 'history'
  | 'streaks'
  | 'favourites'
  | 'diagnostics'

function App() {
  const [
    fileName,
    setFileName,
  ] = useState<
    string | null
  >(null)

  const [
    screen,
    setScreen,
  ] = useState<Screen>(
    'home',
  )

  function handleFileChange(
    event:
      React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0]

    if (file) {
      setFileName(
        file.name,
      )
    }
  }

  if (
    screen === 'race'
  ) {
    return (
      <MealDealRace
        dataset={demoDataset}
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
        dataset={demoDataset}
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
        dataset={demoDataset}
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
        dataset={demoDataset}
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
      <FavouritesByPeriod
        dataset={demoDataset}
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
            Choose Tesco JSON

            <input
              type="file"
              accept=".json,application/json"
              onChange={
                handleFileChange
              }
            />
          </label>

          <button
            className="demo-button"
            onClick={() =>
              setScreen('race')
            }
          >
            Preview races
          </button>

          <button
            className="demo-button"
            onClick={() =>
              setScreen(
                'favourites',
              )
            }
          >
            Your favourites
          </button>

          <button
            className="demo-button"
            onClick={() =>
              setScreen('heist')
            }
          >
            Beat the Meal Deal
          </button>

          <button
            className="demo-button"
            onClick={() =>
              setScreen(
                'history',
              )
            }
          >
            Through the years
          </button>

          <button
            className="demo-button"
            onClick={() =>
              setScreen(
                'streaks',
              )
            }
          >
            Longest streak
          </button>

          <button
            className="demo-button"
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
            Ready to analyse:{' '}
            <strong>
              {fileName}
            </strong>
          </p>
        )}

        <p className="privacy">
          Your shopping data will be
          processed entirely on your
          device.
        </p>
      </section>
    </main>
  )
}

export default App