import { Schedule, Lane } from '../types/Schedule';
import JSTTime from '../lib/JSTTime';

const MIN_DURATION_BETWEEN_SCHEDULES = new JSTTime(0, 20, 0);

const assignLaneIndexToSchedules = <ScheduleType extends Schedule>(schedules: ScheduleType[]): ScheduleType[] => {
  const sortedSchedules = schedules
    .slice() // To keep the array immutable
    .sort((schedule1, schedule2) => JSTTime.ascendingCompareFunction(schedule1.startTime, schedule2.startTime));
  const laneAssignedSchedules: ScheduleType[] = [];

  const lanes: Lane[] = [
    {
      index: 0,
      schedules: []
    }
  ];
  for (const schedule of sortedSchedules) {
    let assignedLane: Lane | null = null;
    for (const lane of lanes) {
      // If the lane is empty
      if (lane.schedules.length === 0) {
        lane.schedules.push(schedule);
        assignedLane = lane;
        break;
      }
      // Check the last schedule in the lane to determine the lane is available
      const lastScheduleInLane = lane.schedules[lane.schedules.length - 1];
      if (JSTTime.durationBetween(lastScheduleInLane.endTime, schedule.startTime).isGreaterThanOrEqualTo(MIN_DURATION_BETWEEN_SCHEDULES)) {
        lane.schedules.push(schedule);
        assignedLane = lane;
        break;
      }
    }
    // If any of the existing lanes cannot accommodate the current schedule
    if (assignedLane === null) {
      const newLane = {
        index: lanes.length,
        schedules: [schedule]
      }
      lanes.push(newLane);
      assignedLane = newLane;
    }
    laneAssignedSchedules.push(Object.assign( // Spread operator in this context only works in TS 3.2+
      {},
      schedule,
      { laneIndex: assignedLane.index }
    ));
  }
  return laneAssignedSchedules;
};

export default assignLaneIndexToSchedules;