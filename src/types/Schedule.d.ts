import JSTTime from '../lib/JSTTime';

export interface Schedule {
  id: string;
  startTime: JSTTime;
  endTime: JSTTime;
  laneIndex?: number;
}

export interface Lane {
  index: number;
  schedules: Schedule[]
}