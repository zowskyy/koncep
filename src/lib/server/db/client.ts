import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const dataDirectory = path.join(process.cwd(), "data");
const databasePath = path.join(dataDirectory, "koncep.db");

fs.mkdirSync(dataDirectory, { recursive: true });

const sqlite = new Database(databasePath);

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
