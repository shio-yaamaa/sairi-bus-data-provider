import * as AWS from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { JSDOM } from 'jsdom';
import * as uuidv4 from 'uuid/v4';

import { RESTAURANT_DATA_KEY } from '../constants/db-keys';
import { RESTAURANT_URLS } from '../constants/urls';

import {
  RestaurantDBEntry,
  RestaurantData,
  RestaurantSchedule
} from '../types/Restaurant';

import JSTDate from '../lib/JSTDate';
import JSTTime from '../lib/JSTTime';

import { cleanUpText } from '../utility/text';

const docClient = new AWS.DynamoDB.DocumentClient({
  region: process.env.DYNAMODB_REGION
});

const CLOSED_TEXT = '休業';

const fetchLibraryData = async (): Promise<RestaurantData> => {
  const restaurantData: RestaurantData = {
    dailyRestaurantDataList: []
  };

  for (const { campusName, url } of RESTAURANT_URLS) {
    const { document } = (await JSDOM.fromURL(url)).window;

    const currentDate = JSTDate.getCurrentJSTDate();

    // Extract the restaurant calendar of this month
    const thisMonthText = (currentDate.month + 1) + '月';
    const calendarTables: HTMLTableElement[] = Array.from(document.querySelectorAll('.table-02:first-of-type'));
    const monthlyCalendarTable: HTMLTableElement = calendarTables
      .filter(table => {
        const monthText = Array.from(table.querySelector('tr:nth-of-type(2)').querySelectorAll('td'))[0].textContent;
        return cleanUpText(monthText) === thisMonthText;
      })[0];
    
    // Get all the restaurants' names in the table header
    const tableHeader = monthlyCalendarTable.querySelector('tr');
    const tableHeaderTds = Array.from(tableHeader.querySelectorAll('td'));
    const restaurantNames = tableHeaderTds
      .slice(3) // 3 is the offset for the year, month, and date column
      .map(td => cleanUpText(td.textContent));

    // Get the daily data
    const dateRows = Array.from(monthlyCalendarTable.querySelectorAll('tr:not(:first-child)'));
    for (const row of dateRows) {
      const tds = Array.from(row.querySelectorAll('td'));
      const date = parseInt(cleanUpText(tds[tds.length - restaurantNames.length - 2].textContent));
      for (const [restaurantIndex, restaurantName] of restaurantNames.entries()) {
        const timeRangeString = cleanUpText(tds[tds.length - restaurantNames.length + restaurantIndex].textContent);
        const isClosed = timeRangeString === CLOSED_TEXT;
        let schedule: RestaurantSchedule | null = null;
        if (!isClosed) {
          const [startTimeString, endTimeString] = timeRangeString.split('~');
          schedule = {
            id: uuidv4(),
            startTime: JSTTime.fromColonSeparatedText(startTimeString),
            endTime: JSTTime.fromColonSeparatedText(endTimeString)
          };
        }
        restaurantData.dailyRestaurantDataList.push({
          campusName,
          restaurantIndex,
          restaurantName,
          date: new JSTDate(currentDate.year, currentDate.month, date),
          schedules: isClosed ? [] : [schedule]
        });
        console.log(restaurantData.dailyRestaurantDataList[restaurantData.dailyRestaurantDataList.length - 1]);
      }
    }
  }

  return restaurantData;
}

const saveToDatabase = async (restaurantData: RestaurantData) => {
  const entry: RestaurantDBEntry = {
    key: RESTAURANT_DATA_KEY,
    updatedAt: JSTDate.getCurrentJSTDate(),
    data: restaurantData
  };
  const params: AWS.DynamoDB.DocumentClient.PutItemInput = {
    TableName: process.env.DYNAMODB_TABLE_NAME,
    Item: entry
  };
  try {
    await docClient.put(params).promise();
  } catch (error) {
    console.log('Error:', error);
  }
}

export const handler: APIGatewayProxyHandler = async (event, context) => {
  const restaurantData = await fetchLibraryData();
  await saveToDatabase(restaurantData);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Success',
      input: event,
    }),
  };
};
