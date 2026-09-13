import type {
  MealDealDataset,
} from '../types/data'

import {
  FavouritesByPeriod,
} from './FavouritesByPeriod'

import {
  MobileFavourites,
} from './MobileFavourites'

import './FavouritesExperience.css'

interface FavouritesExperienceProps {
  dataset: MealDealDataset
  onBack: () => void
}

export function FavouritesExperience({
  dataset,
  onBack,
}: FavouritesExperienceProps) {
  return (
    <>
      <div className="favourites-experience-mobile">
        <MobileFavourites
          dataset={dataset}
          onBack={onBack}
        />
      </div>

      <div className="favourites-experience-desktop">
        <FavouritesByPeriod
          dataset={dataset}
          onBack={onBack}
        />
      </div>
    </>
  )
}