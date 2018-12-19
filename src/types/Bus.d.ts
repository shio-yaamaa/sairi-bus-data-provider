import { Schedule } from '../types/Schedule';

import JSTDate from '../lib/JSTDate';
import JSTTime from '../lib/JSTTime';

export interface BusDBEntry {
  key: string;
  updatedAt: JSTDate;
  data: BusData;
}

export interface BusData {
  sections: Section[];
}

export interface Section {
  index: number;
  endpointNames: string[];
  directions: Direction[];
}

export interface Direction {
  index: number;
  stopNames: string[];
  schedules: BusSchedule[];
}

export interface BusSchedule extends Schedule {
  id: string;
  startTime: JSTTime;
  endTime: JSTTime;
  stopTimes: (JSTTime | null)[];
  name: string;
  runsTwice: boolean;
  stopsAtRimd: boolean; // RIMD = Research Institute for Microbial Diseases, Osaka University
  laneIndex?: number;
}