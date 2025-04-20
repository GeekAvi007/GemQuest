import { Client, Databases, Account } from 'appwrite';

// Initialize Appwrite Client
const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

// Initialize Appwrite Services
const account = new Account(client);
const databases = new Databases(client);

const collectionId = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

export { client, account, databases, collectionId };
