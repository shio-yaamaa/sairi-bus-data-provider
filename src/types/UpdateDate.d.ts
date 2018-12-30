import JSTDate from '../lib/JSTDate';

export interface UpdateDateData {
  updateDates: UpdateDates;
}

export interface UpdateDates {
  bus: JSTDate;
  library: JSTDate;
  restaurant: JSTDate;
}