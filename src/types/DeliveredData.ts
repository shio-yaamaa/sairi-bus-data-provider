import { UpdateDateData } from './UpdateDate';
import { ClassworkData } from './Classwork';
import { BusData } from './Bus';
import { LibraryData } from './Library';
import { RestaurantData } from './Restaurant';

export interface DeliveredData {
  updateDateData: UpdateDateData;
  classworkData: ClassworkData;
  busData: BusData;
  libraryData: LibraryData;
  restaurantData: RestaurantData;
}