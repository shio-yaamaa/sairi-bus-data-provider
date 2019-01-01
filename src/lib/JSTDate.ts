import * as moment from 'moment-timezone';

export const JST_DATE_SCHEMA_NAME = 'JSTDate';

export default class JSTDate {
  public year?: number;
  public month?: number; // 0-11
  public date?: number;

  static schema = {
    name: JST_DATE_SCHEMA_NAME,
    properties: {
      year: {
        type: 'int',
        indexed: true
      },
      month: {
        type: 'int',
        indexed: true
      },
      date: {
        type: 'int',
        indexed: true
      }
    }
  };

  // The constructor can be called by Realm's createObject function with no arguments provided.
  // In that case, do not assign the values (undefined)
  // since it tries to overwrite the data in the Realm DB as well.
  constructor(year: number, month: number, date: number) {
    year === undefined || (this.year = year);
    month === undefined || (this.month = month);
    date === undefined || (this.date = date);
  }

  public static getCurrentJSTDate(): JSTDate {
    const current = moment().tz('Asia/Tokyo');
    return new JSTDate(
      current.year(),
      current.month(),
      current.date()
    );
  }

  // Conversions

  public static fromNumber(number: number): JSTDate {
    return new JSTDate(
      Math.floor(number / 10 ** 4),
      Math.floor(number % 10 ** 4 / 10 ** 2),
      number % 10 ** 2
    );
  }

  public toNumber(): number {
    return this.year! * 10 ** 4 + this.month! * 10 ** 2 + this.date!;
  }

  // Returns if the values are all zero
  public isZero(): boolean {
    return this.year! === 0 && this.month! === 0 && this.date! === 0;
  }

  // Comparisons

  public static durationBetween(date1: JSTDate, date2: JSTDate): JSTDate {
    return JSTDate.fromNumber(Math.abs(date1.toNumber() - date2.toNumber()));
  }

  // Used for ascending sorting an array of JSTDates
  public static ascendingCompareFunction(date1: JSTDate, date2: JSTDate): number {
    return date1.toNumber() - date2.toNumber();
  }

  public isEqualTo(anotherDate: JSTDate): boolean {
    return this.toNumber() === anotherDate.toNumber();
  }

  public isLessThan(anotherDate: JSTDate): boolean {
    return this.toNumber() < anotherDate.toNumber();
  }

  public isLessThanOrEqualTo(anotherDate: JSTDate): boolean {
    return this.toNumber() <= anotherDate.toNumber();
  }

  public isGreaterThan(anotherDate: JSTDate): boolean {
    return this.toNumber() > anotherDate.toNumber();
  }

  public isGreaterThanOrEqualTo(anotherDate: JSTDate): boolean {
    return this.toNumber() >= anotherDate.toNumber();
  }
}