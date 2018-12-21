import * as AWS from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { JSDOM } from 'jsdom';
import * as uuidv4 from 'uuid/v4';

import { LIBRARY_DATA_KEY } from '../constants/db-keys';
import {
  MAIN_LIBRARY_URL,
  LIFE_SCIENCES_LIBRARY_URL,
  SCIENCE_AND_ENGINEERING_LIBRARY_URL,
  INTERNATIONAL_STUDIES_LIBRARY_URL
} from '../constants/urls';

import {
  LibraryDBEntry,
  LibraryData,
  LibrarySchedule
} from '../types/Library';

import JSTDate from '../lib/JSTDate';
import JSTTime from '../lib/JSTTime';
import { cleanUpText } from '../utility/text';

const docClient = new AWS.DynamoDB.DocumentClient({
  region: process.env.DYNAMODB_REGION
});

const CLOSED_TEXT = 'Closed';
const NEXT_MORNING_TEXT = '翌朝';

const fetchLibraryData = async (): Promise<LibraryData> => {
  const libraryData: LibraryData = {
    dailyLibraryDataList: []
  };

  for (const [libraryIndex, URL] of [MAIN_LIBRARY_URL, LIFE_SCIENCES_LIBRARY_URL, SCIENCE_AND_ENGINEERING_LIBRARY_URL, INTERNATIONAL_STUDIES_LIBRARY_URL].entries()) {
    const { document } = (await JSDOM.fromURL(URL)).window;

    const titleText = document.querySelector('title').textContent;
    const libraryName = titleText.substring(0, titleText.indexOf('図書館'));

    const table = document.querySelector('table');
    const tableCaption = table.querySelector('caption').textContent;

    const year = parseInt(tableCaption.substring(0, tableCaption.indexOf('年')));
    const month = parseInt(tableCaption.substring(tableCaption.indexOf('年') + 1, tableCaption.indexOf('月'))) - 1;

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
          laneIndex: 0
        };
      }

      libraryData.dailyLibraryDataList.push({
        libraryIndex,
        libraryName,
        date: new JSTDate(year, month, date),
        schedules: isClosed ? [] : [schedule]
      });
    }
  }

  return libraryData;
}

const saveToDatabase = async (libraryData: LibraryData) => {
  const entry: LibraryDBEntry = {
    key: LIBRARY_DATA_KEY,
    updatedAt: JSTDate.getCurrentJSTDate(),
    data: libraryData
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
