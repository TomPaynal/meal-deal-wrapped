import {
  useMemo,
  useState,
} from 'react'

import type {
  MealDealDataset,
} from '../types/data'

import {
  analyseBeatMealDeal,
} from '../analysis/beatMealDeal'

import {
  MobileThroughTheYears,
} from './MobileThroughTheYears'

import {
  MobileBeatMealDeal,
} from './MobileBeatMealDeal'

import {
  LongestStreak,
} from './LongestStreak'

import {
  MealDealRace,
} from './MealDealRace'

import {
  MobileFavourites,
} from './MobileFavourites'

import './MobileWrappedJourney.css'

interface MobileWrappedJourneyProps {
  dataset: MealDealDataset
  onExit: () => void
}

type JourneyStep =
  | 'history'
  | 'value'
  | 'streak'
  | 'race'
  | 'favourites'

export function MobileWrappedJourney({
  dataset,
  onExit,
}: MobileWrappedJourneyProps) {
  const [
    step,
    setStep,
  ] =
    useState<JourneyStep>(
      'history',
    )

  const beatMealDeal =
    useMemo(
      () =>
        analyseBeatMealDeal(
          dataset,
        ),
      [dataset],
    )

  const biggest =
    beatMealDeal.biggestSaving

  function goBack() {
    if (
      step === 'history'
    ) {
      onExit()
      return
    }

    if (
      step === 'value'
    ) {
      setStep('history')
      return
    }

    if (
      step === 'streak'
    ) {
      setStep('value')
      return
    }

    if (
      step === 'race'
    ) {
      setStep('streak')
      return
    }

    setStep('race')
  }

  if (
    step === 'history'
  ) {
    return (
      <div className="wrapped-journey wrapped-step">
        <MobileThroughTheYears
          dataset={dataset}
          onBack={goBack}
        />

        <JourneyNext
          label="Beat the Meal Deal"
          onClick={() =>
            setStep('value')
          }
        />
      </div>
    )
  }

  if (
    step === 'value'
  ) {
    if (!biggest) {
      return (
        <main className="wrapped-unavailable">
          <p className="wrapped-unavailable-kicker">
            BEAT THE MEAL DEAL
          </p>

          <h1>
            Savings unavailable
          </h1>

          <p>
            This export does not
            contain enough complete
            shelf-price data to
            calculate savings.
          </p>

          <button
            onClick={() =>
              setStep(
                'streak',
              )
            }
          >
            Longest streak →
          </button>
        </main>
      )
    }

    return (
      <div className="wrapped-journey">
        <MobileBeatMealDeal
          analysis={
            beatMealDeal
          }
          biggest={
            biggest
          }
          onBack={goBack}
          onComplete={() =>
            setStep(
              'streak',
            )
          }
        />
      </div>
    )
  }

  if (
    step === 'streak'
  ) {
    return (
      <div className="wrapped-journey wrapped-step">
        <LongestStreak
          dataset={dataset}
          onBack={goBack}
        />

        <JourneyNext
          label="Watch the race"
          onClick={() =>
            setStep('race')
          }
        />
      </div>
    )
  }

  if (
    step === 'race'
  ) {
    return (
      <div className="wrapped-journey wrapped-step wrapped-race-step">
        <MealDealRace
          dataset={dataset}
          onBack={goBack}
        />

        <JourneyNext
          className="wrapped-race-next"
          label="The finale"
          onClick={() =>
            setStep(
              'favourites',
            )
          }
        />
      </div>
    )
  }

  return (
    <div className="wrapped-journey">
      <MobileFavourites
        dataset={dataset}
        onBack={goBack}
      />
    </div>
  )
}

function JourneyNext({
  label,
  onClick,
  className = '',
}: {
  label: string
  onClick: () => void
  className?: string
}) {
  return (
    <button
      className={`wrapped-journey-next ${className}`}
      onClick={onClick}
    >
      {label}
      <span>
        →
      </span>
    </button>
  )
}