import { DBEntry } from './DBEntry';
import { Schedule } from '../types/Schedule';

import JSTDate from '../lib/JSTDate';
import JSTTime from '../lib/JSTTime';

export interface ClassworkDBEntry extends DBEntry {
  key: string;
  data: ClassworkData;
}

export interface ClassworkData {
  schedules: ClassworkSchedule[];
}

export interface ClassworkSchedule extends Schedule {
  id: string;
  startTime: JSTTime;
  endTime: JSTTime;
  name: string;
  laneIndex: number;
}