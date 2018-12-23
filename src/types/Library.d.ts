import { DBEntry } from './DBEntry';
import { Schedule } from '../types/Schedule';

import JSTDate from '../lib/JSTDate';
import JSTTime from '../lib/JSTTime';

export interface LibraryDBEntry extends DBEntry {
  key: string;
  data: LibraryData;
}

export interface LibraryData {
  dailyLibraryDataList: DailyLibraryData[];
}

export interface DailyLibraryData {
  libraryIndex: number;
  libraryName: string;
  date: JSTDate;
  schedules: LibrarySchedule[];
}

export interface LibrarySchedule extends Schedule {
  id: string;
  startTime: JSTTime;
  endTime: JSTTime | null; // null when endsNextMorning is true
  endsNextMorning: boolean;
  laneIndex: number;
}