import * as moment from 'moment-timezone';

export default class JSTDate {
  public year: number;
  public month: number; // 0-11
  public date: number;

  constructor(year: number, month: number, date: number) {
    this.year = year;
    this.month = month;
    this.date = date;
  }

  public static getCurrentJSTDate(): JSTDate {
    const current = moment().tz('Asia/Tokyo');
    return new JSTDate(
      current.year(),
      current.month(),
      current.date()
    );
  }

  public toNumber(): number {
    return this.year * 10 ** 4 + this.month * 10 ** 2 + this.date;
  }
}