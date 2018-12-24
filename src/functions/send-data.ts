import * as AWS from 'aws-sdk';
import { APIGatewayProxyHandler } from 'aws-lambda';

import { RootItemKey } from '../constants/db-keys';

import { UpdateDateData } from '../types/UpdateDate';
import { BusData } from '../types/Bus';
import { LibraryData } from '../types/Library';
import { RestaurantData } from '../types/Restaurant';
import { DeliveredData } from '../types/DeliveredData';

const docClient = new AWS.DynamoDB.DocumentClient({
  region: process.env.DYNAMODB_REGION
});

const fetchDataFromDB = async (): Promise<DeliveredData> => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE_NAME
  };
  try {
    const items = (await docClient.scan(params).promise()).Items;
    return {
      updateDateData: items.find(item => item.key === RootItemKey.UpdateDate).data as UpdateDateData,
      busData: items.find(item => item.key === RootItemKey.Bus).data as BusData,
      libraryData: items.find(item => item.key === RootItemKey.Library).data as LibraryData,
      restaurantData: items.find(item => item.key === RootItemKey.Restaurant).data as RestaurantData
    };
  } catch (error) {
    console.log('Error:', error);
  }
};

export const handler: APIGatewayProxyHandler = async (event, context) => {
  const data = await fetchDataFromDB();
  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
