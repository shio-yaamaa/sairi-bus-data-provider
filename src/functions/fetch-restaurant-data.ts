import * as AWS from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { JSDOM } from 'jsdom';
import * as uuidv4 from 'uuid/v4';

import { RootItemKey, UpdateDateKey } from '../constants/db-keys';
import { RESTAURANT_URLS } from '../constants/urls';
import { restaurantCampusIndexToColorIndex } from '../constants/color-index';

import {
  RestaurantData,
  RestaurantSchedule
} from '../types/Restaurant';

import JSTDate from '../lib/JSTDate';
import JSTTime from '../lib/JSTTime';

import { cleanUpText } from '../utility/text';

const dynamodb = new AWS.DynamoDB({
  region: process.env.DYNAMODB_REGION
});

const CLOSED_TEXT = '休業';

const fetchRestaurantData = async (): Promise<RestaurantData> => {
  const restaurantData: RestaurantData = {
    dailyDataList: []
  };

  for (const [campusIndex, { campusName, url }] of RESTAURANT_URLS.entries()) {
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
            endTime: JSTTime.fromColonSeparatedText(endTimeString),
            laneIndex: 0,
            colorIndex: restaurantCampusIndexToColorIndex(campusIndex)
          };
        }
        restaurantData.dailyDataList.push({
          campusIndex,
          campusName,
          restaurantIndex,
          restaurantName,
          date: new JSTDate(currentDate.year, currentDate.month, date),
          schedules: isClosed ? [] : [schedule]
        });
      }
    }
  }

  return restaurantData;
}

const saveToDatabase = async (restaurantData: RestaurantData) => {
  const transactionParams: AWS.DynamoDB.TransactWriteItemsInput = {
    TransactItems: [
      {
        Put: {
          TableName: process.env.DYNAMODB_TABLE_NAME,
          Item: {
            key: {
              S: RootItemKey.Restaurant
            },
            data: AWS.DynamoDB.Converter.input(restaurantData)
          }
        }
      },
      {
        Update: {
          TableName: process.env.DYNAMODB_TABLE_NAME,
          Key: {
            key: {
              S: RootItemKey.UpdateDate
            }
          },
          UpdateExpression: `SET #data.#update.#key = :date`,
          ExpressionAttributeNames: {
            '#data': 'data',
            '#update': 'updateDates',
            '#key': UpdateDateKey.Restaurant
          },
          ExpressionAttributeValues: {
            ':date': AWS.DynamoDB.Converter.input(JSTDate.getCurrentJSTDate())
          }
        }
      }
    ]
  };

  try {
    await dynamodb.transactWriteItems(transactionParams).promise();
  } catch (error) {
    console.log('Error:', error);
  }
};

export const handler: APIGatewayProxyHandler = async (event, context) => {
  const restaurantData = await fetchRestaurantData();
  await saveToDatabase(restaurantData);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Success',
      input: event,
    }),
  };
};
