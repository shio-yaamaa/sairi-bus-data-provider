import { Schedule } from '../types/Schedule';

import JSTDate from '../lib/JSTDate';
import JSTTime from '../lib/JSTTime';

export interface BusData {
  sections: BusSection[];
}

export interface BusSection {
  index: number;
  endpointNames: string[];
  directions: BusDirection[];
}

export interface BusDirection {
  index: number;
  stopNames: string[];
  schedules: BusSchedule[];
}

export interface BusSchedule extends Schedule {
  id: string;
  startTime: JSTTime;
  endTime: JSTTime;
  stopTimes: BusStopTime[];
  name: string;
  runsTwice: boolean;
  stopsAtRimd: boolean; // RIMD = Research Institute for Microbial Diseases, Osaka University
  laneIndex?: number;
}

export interface BusStopTime {
  stopIndex: number;
  time: JSTTime;
}