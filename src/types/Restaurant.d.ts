import { Schedule } from '../types/Schedule';

import JSTDate from '../lib/JSTDate';
import JSTTime from '../lib/JSTTime';

export interface RestaurantData {
  campuses: RestaurantCampus[];
}

export interface RestaurantCampus {
  index: number;
  name: string;
  dailyDataList: DailyRestaurantData[];
}

export interface DailyRestaurantData {
  restaurantIndex: number;
  restaurantName: string;
  date: JSTDate;
  schedules: RestaurantSchedule[];
}

export interface RestaurantSchedule extends Schedule {
  id: string;
  startTime: JSTTime;
  endTime: JSTTime;
  laneIndex: number;
}