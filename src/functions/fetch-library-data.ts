import { URLSearchParams } from 'url';
import * as AWS from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { JSDOM } from 'jsdom';
import * as uuidv4 from 'uuid/v4';

import { RootItemKey, UpdateDateKey } from '../constants/db-keys';
import {
  MAIN_LIBRARY_URL,
  LIFE_SCIENCES_LIBRARY_URL,
  SCIENCE_AND_ENGINEERING_LIBRARY_URL,
  INTERNATIONAL_STUDIES_LIBRARY_URL
} from '../constants/urls';
import { ColorIndex } from '../constants/color-index';

import {
  LibraryData,
  LibrarySchedule
} from '../types/Library';

import JSTDate from '../lib/JSTDate';
import JSTTime from '../lib/JSTTime';
import { cleanUpText } from '../utility/text';

const dynamodb = new AWS.DynamoDB({
  region: process.env.DYNAMODB_REGION
});

const CLOSED_TEXT = 'Closed';
const NEXT_MORNING_TEXT = '翌朝';

const buildQueryParams = (date: JSTDate): URLSearchParams => {
  const params = new URLSearchParams();
  params.append('getYear', date.year.toString());
  params.append('month', (date.month + 1).toString());
  return params;
};

const fetchLibraryData = async (): Promise<LibraryData> => {
  const libraryData: LibraryData = {
    dailyDataList: []
  };

  for (const [libraryIndex, URL] of [MAIN_LIBRARY_URL, LIFE_SCIENCES_LIBRARY_URL, SCIENCE_AND_ENGINEERING_LIBRARY_URL, INTERNATIONAL_STUDIES_LIBRARY_URL].entries()) {
    const currentDate = JSTDate.getCurrentJSTDate();
    const { document } = (await JSDOM.fromURL(`${URL}?${buildQueryParams(currentDate).toString()}`)).window;

    const titleText = document.querySelector('title').textContent;
    const libraryName = titleText.substring(0, titleText.indexOf('図書館'));

    const table = document.querySelector('table');

    for (const td of Array.from(table.querySelectorAll('td'))) {
      const childNodes = Array.from(td.childNodes);
      if (childNodes.length < 3) { // An empty cell
        continue;
      }
      const [dateString, timeRangeString] = childNodes
        .filter((node, index) => [0, 2].includes(index))
        .map(node => cleanUpText(node.textContent));
      const date = parseInt(dateString);
      const isClosed = timeRangeString === CLOSED_TEXT;
      let schedule: LibrarySchedule | null = null;
      if (!isClosed) {
        const [startTimeString, endTimeString] = timeRangeString.split('-');
        const endsNextMorning = endTimeString === NEXT_MORNING_TEXT;
        schedule = {
          id: uuidv4(),
          startTime: JSTTime.fromColonSeparatedText(startTimeString),
          endTime: endsNextMorning ? null : JSTTime.fromColonSeparatedText(endTimeString),
          endsNextMorning,
          laneIndex: 0,
          colorIndex: ColorIndex.Library
        };
      }

      libraryData.dailyDataList.push({
        libraryIndex,
        libraryName,
        date: new JSTDate(currentDate.year, currentDate.month, date),
        schedules: isClosed ? [] : [schedule]
      });
    }
  }

  return libraryData;
}

const saveToDatabase = async (libraryData: LibraryData) => {
  const transactionParams: AWS.DynamoDB.TransactWriteItemsInput = {
    TransactItems: [
      {
        Put: {
          TableName: process.env.DYNAMODB_TABLE_NAME,
          Item: {
            key: {
              S: RootItemKey.Library
            },
            data: AWS.DynamoDB.Converter.input(libraryData)
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
            '#key': UpdateDateKey.Library
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
  const libraryData = await fetchLibraryData();
  await saveToDatabase(libraryData);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Success',
      input: event,
    }),
  };
};
