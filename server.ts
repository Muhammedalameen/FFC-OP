import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

// استخدام libsql:// بدلاً من https:// لسرعة أكبر في الاتصال
const url = process.env.TURSO_DATABASE_URL || "libsql://ffc-op-md1amin.aws-ap-northeast-1.turso.io";
const authToken = process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzUzMDExODgsImlkIjoiMDE5ZDIyZDMtZmUwMS03MDdhLWJhNDUtMWE5ZmRlOTUzYWFlIiwicmlkIjoiMDI2NjgxMGEtY2ZjYy00YzI2LThkZGQtYTQ0ZjkwYTBlZDRjIn0.gCZpSC_JinDmNz0yE9SO-qXZM_BMqhh99P1e8jvRznxQarszBMCcJYEfXNgGzywJP7sK_E-T8hv1Ga-lEqXZAg";

export const db = createClient({
  url: url,
  authToken: authToken,
});

let isInitialized = false;

export const initDb = async (force = false) => {
  // منع إعادة التشغيل في بيئة Serverless لتجنب الـ Timeout
  if (isInitialized && !force) return;

  try {
    console.log('[DB] Checking connection...');
    await db.execute("SELECT 1");

    // نقوم بإنشاء الجداول فقط إذا طُلب ذلك (force) أو في البيئة المحلية
    if (force || process.env.NODE_ENV !== 'production') {
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
      console.log('[DB] Schema verified/created.');
    }
    
    isInitialized = true;
  } catch (err) {
    console.error('[DB] Connection error:', err.message);
    // لا نعطل السيرفر بالكامل، فقط نسجل الخطأ
  }
};
