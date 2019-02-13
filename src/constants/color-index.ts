export enum ColorIndex {
  Classwork,
  BusSectionSuita,
  BusSectionMinoh,
  BusDirectionToyonakaToSuita,
  BusDirectionSuitaToToyonaka,
  BusDirectionMinohToToyonaka,
  BusDirectionToyonakaToMinoh,
  Library,
  RestaurantToyonaka,
  RestaurantSuita,
  RestaurantMinoh
}

// These conversions depend on the official site's layout.
// When the layout changes, these functions might also need to be updated.

export const busSectionIndexToColorIndex = (sectionIndex: number): number => {
  return sectionIndex === 0 ? ColorIndex.BusSectionSuita : ColorIndex.BusSectionMinoh;
};

export const busDirectionIndexToColorIndex = (sectionIndex: number, directionIndex: number): number => {
  if (sectionIndex === 0) { // Suita
    return directionIndex === 0
      ? ColorIndex.BusDirectionSuitaToToyonaka
      : ColorIndex.BusDirectionToyonakaToSuita;
  } else { // Minoh
    return directionIndex === 0
      ? ColorIndex.BusDirectionMinohToToyonaka
      : ColorIndex.BusDirectionToyonakaToMinoh;
  }
};

export const restaurantCampusIndexToColorIndex = (restaurantIndex: number): number => {
  switch (restaurantIndex) {
    case 0:
      return ColorIndex.RestaurantToyonaka;
    case 1:
      return ColorIndex.RestaurantSuita;
    case 2:
    default:
      return ColorIndex.RestaurantMinoh;
  }
};