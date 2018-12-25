import { DBEntry } from './DBEntry';
import JSTDate from '../lib/JSTDate';

export interface UpdateDateDBEntry extends DBEntry {
  key: string;
  data: UpdateDateData;
}

export interface UpdateDateData {
  updateDates: UpdateDates;
}

export interface UpdateDates {
  classwork?: JSTDate;
  bus: JSTDate;
  library: JSTDate;
  restaurant: JSTDate;
}