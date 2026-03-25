import { createClient } from "@libsql/client";

export const db = createClient({
  url: "libsql://ffc-op-md1amin.aws-ap-northeast-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ0MDU4OTEsImlkIjoiMDE5ZDIyZDMtZmUwMS03MDdhLWJhNDUtMWE5ZmRlOTUzYWFlIiwicmlkIjoiMDI2NjgxMGEtY2ZjYy00YzI2LThkZGQtYTQ0ZjkwYTBlZDRjIn0.YaZPoGQp6rH_flN0oO6GmvQZW2sfhHAzM21RwVq-CcuXIP-U5KPGuXgnSl7_82-VZUtDpMAJCygWJWJX5WBiCw"
});

export const initDb = async () => {
  // Create tables if they don't exist
  // Since we are storing JSON objects from the frontend, we can use a generic key-value store approach
  // or a document store approach for simplicity, similar to Firebase.
  
  const tables = [
    'users', 'customRoles', 'branches', 'cars', 'inventoryItems', 
    'operationalItems', 'revenueReports', 'inventoryReports', 
    'inspectionReports', 'scheduledReadingItems', 'readingRecords', 
    'tickets', 'carHandovers'
  ];

  for (const table of tables) {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${table} (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
  console.log("Database tables initialized.");
};
