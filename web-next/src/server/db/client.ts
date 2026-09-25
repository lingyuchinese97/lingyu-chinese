import { drizzle } from "drizzle-orm/node-postgres";
import { pool } from "./pool";
import * as schema from "./schema";

/** Drizzle dùng chung pool `pg`. Chỉ import ở server. */
export const db = drizzle(pool, { schema, casing: "snake_case" });
export type DB = typeof db;
export { schema };
