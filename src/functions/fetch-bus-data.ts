import * as AWS from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { JSDOM } from 'jsdom';
import * as uuidv4 from 'uuid/v4';

import { RootItemKey, UpdateDateKey } from '../constants/db-keys';
import { BUS_URL } from '../constants/urls';

import {
  BusData,
  BusSection,
  BusDirection,
  BusSchedule,
  BusStopTime
} from '../types/Bus';

import JSTDate from '../lib/JSTDate';
import JSTTime from '../lib/JSTTime';
import assignLaneIndexToSchedules from '../utility/assignLaneIndexToSchedules';
import { cleanUpText } from '../utility/text';

const dynamodb = new AWS.DynamoDB({
  region: process.env.DYNAMODB_REGION
});

interface ColumnGroup {
  headerColumnIndex: number;
  bodyColumnCount: number;
}

const fetchBusData = async (): Promise<BusData> => {
  const busData: BusData = {
    sections: []
  };

  const { document } = (await JSDOM.fromURL(BUS_URL)).window;
  const tables = Array.from(document.getElementsByClassName('dataTable'));

  // Each table corresponds to a single section
  for (const [tableIndex, table] of tables.entries()) {
    // Extract the name of section endpoints that are located right above the table
    const sectionTitle = table.previousElementSibling.textContent;
    const section: BusSection = {
      index: tableIndex,
      endpointNames: sectionTitle
        .substring(sectionTitle.indexOf('．') + 1, sectionTitle.indexOf('地区間'))
        .split('⇔'),
      directions: []
    }
    busData.sections.push(section);

    // Separate the header and body of the table
    const tableHeaderRow = table.querySelector('tr');
    const tableBodyRows = Array.from(table.querySelectorAll('tr:not(:first-child)'));

    // In the table, multiple columns form a "column group"
    // whose first column is a header that contains the shuttle's name
    // and the rest of the columns (body) contain the shuttle's departure/arrival times.
    // columnGroups is an array with each element representing the layout of a single column group.
    const columnGroups: ColumnGroup[] = [];
    Array.from(tableBodyRows[0].children).forEach((td: Element, index: number) => {
      if (td.classList.contains('tableName')) {
        columnGroups.push({
          headerColumnIndex: index,
          bodyColumnCount: 0
        });
      } else {
        columnGroups[columnGroups.length - 1].bodyColumnCount++;
      }
    });

    // Get the name of the bus stops to construct Direction objects
    for (const [columnGroupIndex, columnGroup] of columnGroups.entries()) {
      const direction: BusDirection = {
        index: columnGroupIndex,
        stopNames: [],
        schedules: []
      };
      // Each column represents a single bus stop
      direction.stopNames = Array.from(tableHeaderRow.children)
        .slice(
          columnGroup.headerColumnIndex + 1,
          columnGroup.headerColumnIndex + 1 + columnGroup.bodyColumnCount
        )
        .map((td: Element) => {
          return cleanUpText(td.textContent);
        });
      section.directions.push(direction);
    }

    // Each column group in a row represents a single bus schedule
    for (const row of tableBodyRows) {
      const tds = Array.from(row.children);
      for (const [columnGroupIndex, columnGroup] of columnGroups.entries()) {
        let name = cleanUpText(tds[columnGroup.headerColumnIndex].textContent);
        if (name === '') {
          continue;
        }
        const stopsAtRimd = name.includes('※');
        name = name.replace('※', '');

        let runsTwice = false;
        const stopTimes: BusStopTime[] = tds
          .slice(
            columnGroup.headerColumnIndex + 1,
            columnGroup.headerColumnIndex + 1 + columnGroup.bodyColumnCount
          )
          .map((td, tdIndex): BusStopTime | null => {
            let timeInText: string = cleanUpText(td.textContent);
            if (timeInText.includes('*')) {
              runsTwice = true;
            }
            timeInText = timeInText.replace('*', '');
            if (timeInText === '-') { // Doesn't stop at the bus stop
              return null;
            }
            const timeElements = timeInText
              .split(':')
              .map(timeElement => parseInt(timeElement));
            return {
              stopIndex: tdIndex,
              time: new JSTTime(timeElements[0], timeElements[1], 0)
            };
          })
          .filter(stopTime => {
            return stopTime !== null;
          });

        const busSchedule: BusSchedule = {
          id: uuidv4(),
          startTime: stopTimes[0].time,
          endTime: stopTimes[stopTimes.length - 1].time,
          stopTimes,
          name,
          runsTwice,
          stopsAtRimd
        };
        section.directions[columnGroupIndex].schedules.push(busSchedule);
      }
    }
  }

  // Distribute the schedules to lanes
  for (const section of busData.sections) {
    for (const direction of section.directions) {
      direction.schedules = assignLaneIndexToSchedules<BusSchedule>(direction.schedules);
    }
  }

  return busData;
}

const saveToDatabase = async (busData: BusData) => {
  const transactionParams: AWS.DynamoDB.TransactWriteItemsInput = {
    TransactItems: [
      {
        Put: {
          TableName: process.env.DYNAMODB_TABLE_NAME,
          Item: {
            key: {
              S: RootItemKey.Bus
            },
            data: AWS.DynamoDB.Converter.input(busData)
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
            '#key': UpdateDateKey.Bus
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
  const busData = await fetchBusData();
  await saveToDatabase(busData);

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Success',
      input: event,
    }),
  };
};
