import * as moment from 'moment-timezone';
import { cleanUpText } from '../utility/text';

export const JST_TIME_SCHEMA_NAME = 'JSTTime';

export default class JSTTime {
  public hour?: number;
  public minute?: number;
  public second?: number;

  static schema = {
    name: JST_TIME_SCHEMA_NAME,
    properties: {
      hour: {
        type: 'int',
        indexed: true
      },
      minute: {
        type: 'int',
        indexed: true
      },
      second: {
        type: 'int',
        indexed: true
      }
    }
  };

  // The constructor can be called by Realm's createObject function with no arguments provided.
  // In that case, do not assign the value (undefined)
  // since it tries to overwrite the data in Realm DB as well.
  constructor(hour: number, minute: number, second: number) {
    hour === undefined || (this.hour = hour);
    minute === undefined || (this.minute = minute);
    second === undefined || (this.second = second);
  }

  public static getCurrentJSTTime(): JSTTime {
    const current = moment().tz('Asia/Tokyo');
    return new JSTTime(
      current.hour(),
      current.minute(),
      current.second()
    );
  }

  public clone(): JSTTime {
    return new JSTTime(this.hour!, this.minute!, this.second!);
  }

  // Conversions

  public static fromSeconds(seconds: number): JSTTime {
    return new JSTTime(
      Math.floor(seconds / (60 * 60)),
      Math.floor(seconds % (60 * 60) / 60),
      seconds % 60
    );
  }

  public toSeconds(): number {
    return ((this.hour! * 60) + this.minute!) * 60 + this.second!;
  }

  // hh:mm:ss or hh:mm
  public static fromColonSeparatedText(text: string): JSTTime {
    const elements = cleanUpText(text).split(':').map(element => parseInt(element));
    return new JSTTime(
      elements[0],
      elements[1],
      elements.length >= 3 ? elements[2] : 0
    );
  }

  // Comparisons

  public static durationBetween(time1: JSTTime, time2: JSTTime): JSTTime {
    return JSTTime.fromSeconds(Math.abs(time1.toSeconds() - time2.toSeconds()));
  }

  // Used for ascending sorting an array of JSTTimes
  public static ascendingCompareFunction(time1: JSTTime, time2: JSTTime): number {
    return time1.toSeconds() - time2.toSeconds();
  }

  public isEqualTo(anotherTime: JSTTime): boolean {
    return this.toSeconds() === anotherTime.toSeconds();
  }

  public isLessThan(anotherTime: JSTTime): boolean {
    return this.toSeconds() < anotherTime.toSeconds();
  }

  public isLessThanOrEqualTo(anotherTime: JSTTime): boolean {
    return this.toSeconds() <= anotherTime.toSeconds();
  }

  public isGreaterThan(anotherTime: JSTTime): boolean {
    return this.toSeconds() > anotherTime.toSeconds();
  }

  public isGreaterThanOrEqualTo(anotherTime: JSTTime): boolean {
    return this.toSeconds() >= anotherTime.toSeconds();
  }
  
  // Manipulations

  public advance(amount: JSTTime) {
    return JSTTime.fromSeconds(this.toSeconds() + amount.toSeconds());
  }

  public roundUpSecond(toMultipleOfTen: boolean): JSTTime {
    if (toMultipleOfTen) {
      if (this.second! % 10 === 0) return this.clone();
      return this.advance(new JSTTime(0, 0, 10 - this.second! % 10));
    } else {
      if (this.second === 0) return this.clone();
      return this.advance(new JSTTime(0, 0, 60 - this.second!));
    }
  }

  public roundUpMinute(toMultipleOfTen: boolean): JSTTime {
    const secondRoundedUp = this.roundUpSecond(false);
    if (toMultipleOfTen) {
      if (secondRoundedUp.minute! % 10 === 0) return secondRoundedUp;
      return secondRoundedUp.advance(new JSTTime(0, 10 - secondRoundedUp.minute! % 10, 0));
    } else {
      if (secondRoundedUp.minute === 0) return secondRoundedUp;
      return secondRoundedUp.advance(new JSTTime(0, 60 - secondRoundedUp.minute!, 0));
    }
  }
}