import { useState } from 'react'
import { MainRace } from './components/MainRace'
import './App.css'

type Screen = 'home' | 'race'

function App() {
  const [fileName, setFileName] =
    useState<string | null>(null)

  const [screen, setScreen] =
    useState<Screen>('home')

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    if (file) {
      setFileName(file.name)
    }
  }

  if (screen === 'race') {
    return (
      <MainRace
        onBack={() => setScreen('home')}
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
          <span> Wrapped</span>
        </h1>

        <p className="intro">
          Discover an unnecessarily detailed history
          of your Tesco Meal Deal habits.
        </p>

        <div className="actions">
          <label className="file-button">
            Choose Tesco JSON

            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
            />
          </label>

          <button
            className="demo-button"
            onClick={() => setScreen('race')}
          >
            Preview demo race
          </button>
        </div>

        {fileName && (
          <p className="selected-file">
            Ready to analyse:{' '}
            <strong>{fileName}</strong>
          </p>
        )}

        <p className="privacy">
          Your shopping data will be processed
          entirely on your device.
        </p>
      </section>
    </main>
  )
}

export default App