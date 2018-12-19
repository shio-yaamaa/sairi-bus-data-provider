import * as AWS from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';

import {
  BUS_DATA_KEY,
  LIBRARY_DATA_KEY,
  RESTAURANT_DATA_KEY
} from '../constants/db-keys';

import { BusDBEntry, BusData } from '../types/Bus';
import { LibraryDBEntry, LibraryData } from '../types/Library';
import { RestaurantDBEntry, RestaurantData } from '../types/Restaurant';

const docClient = new AWS.DynamoDB.DocumentClient({
  region: process.env.DYNAMODB_REGION
});

// const fetchDataFromDB = async (): Promise<Object> => {

// };

export const handler: APIGatewayProxyHandler = async (event, context) => {
  // const data = await fetchDataFromDB();

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Success',
      input: event,
    }),
  };
};
