import * as AWS from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { RootItemKey, UpdateDateKey } from '../constants/db-keys';

import { BusDBEntry, BusData } from '../types/Bus';
import { LibraryDBEntry, LibraryData } from '../types/Library';
import { RestaurantDBEntry, RestaurantData } from '../types/Restaurant';
import { ObjectAttributeAction } from 'aws-sdk/clients/clouddirectory';

const docClient = new AWS.DynamoDB.DocumentClient({
  region: process.env.DYNAMODB_REGION
});

const fetchDataFromDB = async (): Promise<object> => {
  return {};
};

export const handler: APIGatewayProxyHandler = async (event, context) => {
  const data = await fetchDataFromDB();

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Success',
      input: event,
    }),
  };
};
