import type {
  MealDealDataset,
} from '../types/data'

import {
  ThroughTheYears,
} from './ThroughTheYears'

import {
  MobileThroughTheYears,
} from './MobileThroughTheYears'

import './ThroughTheYearsExperience.css'

interface ThroughTheYearsExperienceProps {
  dataset: MealDealDataset
  onBack: () => void
}

export function ThroughTheYearsExperience({
  dataset,
  onBack,
}: ThroughTheYearsExperienceProps) {
  return (
    <>
      <div className="through-years-mobile">
        <MobileThroughTheYears
          dataset={dataset}
          onBack={onBack}
        />
      </div>

      <div className="through-years-desktop">
        <ThroughTheYears
          dataset={dataset}
          onBack={onBack}
        />
      </div>
    </>
  )
}