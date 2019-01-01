import { UpdateDateKey } from '../constants/db-keys';
import JSTDate from '../lib/JSTDate';

export interface UpdateDateData {
  updateDates: UpdateDates;
}

export interface UpdateDates {
  bus: JSTDate;
  library: JSTDate;
  restaurant: JSTDate;
}

export interface UpdateDateEntry {
  key: UpdateDateKey;
  date: JSTDate;
}