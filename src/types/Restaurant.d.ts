import { Schedule } from '../types/Schedule';

import JSTDate from '../lib/JSTDate';
import JSTTime from '../lib/JSTTime';

export interface RestaurantDBEntry {
  key: string;
  updatedAt: JSTDate;
  data: RestaurantData;
}

export interface RestaurantData {
  dailyRestaurantDataList: DailyRestaurantData[];
}

export interface DailyRestaurantData {
  campusName: string;
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