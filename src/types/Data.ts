import { UpdateDateData } from './UpdateDate';
import { ClassworkData } from './Classwork';
import { BusData } from './Bus';
import { LibraryData, DailyLibraryData } from './Library';
import { RestaurantData, DailyRestaurantData } from './Restaurant';

export interface DeliveredData {
  updateDateData: UpdateDateData;
  busData: BusData;
  libraryData: LibraryData;
  restaurantData: RestaurantData;
}

export interface DailyData {
  classworkData: ClassworkData;
  busData: BusData;
  libraryData: LibraryData; // Only contain schedules for a specific date
  restaurantData: RestaurantData; // Only contain schedules for a specific date
}