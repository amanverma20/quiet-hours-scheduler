import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI!);
let isConnected = false;

export const connectDB = async () => {
  if (!isConnected) {
    await client.connect();
    isConnected = true;
  }
  return client.db('quiet-hours');
};
