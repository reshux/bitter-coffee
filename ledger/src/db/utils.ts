import { getDatabase } from "./database";
import { migrateToLatest } from './migrations';

export const initializeDatabase = async () => {
  console.log("Initializing database.")
  try {
    const db = getDatabase();

    console.log("Running migrations.")
    await migrateToLatest(db);
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
}