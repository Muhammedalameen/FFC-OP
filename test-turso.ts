// Test Turso connection directly
import { createClient } from "@libsql/client";

const dbUrl = "libsql://ffc-op-md1amin.aws-ap-northeast-1.turso.io";
const httpUrl = "https://ffc-op-md1amin.aws-ap-northeast-1.turso.io";
const dbAuthToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzUzMDExODgsImlkIjoiMDE5ZDIyZDMtZmUwMS03MDdhLWJhNDUtMWE5ZmRlOTUzYWFlIiwicmlkIjoiMDI2NjgxMGEtY2ZjYy00YzI2LThkZGQtYTQ0ZjkwYTBlZDRjIn0.gCZpSC_JinDmNz0yE9SO-qXZM_BMqhh99P1e8jvRznxQarszBMCcJYEfXNgGzywJP7sK_E-T8hv1Ga-lEqXZAg";

console.log("Testing Turso connection...");

// Test with libsql:// protocol
console.log("\n--- Test 1: libsql:// protocol ---");
try {
  const db1 = createClient({ url: dbUrl, authToken: dbAuthToken });
  const result1 = await db1.execute("SELECT 1");
  console.log("✅ libsql:// works!");
} catch (error) {
  console.error("❌ libsql:// failed:", error instanceof Error ? error.message : error);
}

// Test with https:// protocol
console.log("\n--- Test 2: https:// protocol (Vercel) ---");
try {
  const db2 = createClient({ url: httpUrl, authToken: dbAuthToken });
  const result2 = await db2.execute("SELECT 1");
  console.log("✅ https:// works!");
} catch (error) {
  console.error("❌ https:// failed:", error instanceof Error ? error.message : error);
}

console.log("\n=== All tests completed ===");
