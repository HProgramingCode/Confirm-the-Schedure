import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// 本番は DATABASE_URL、未設定時はリポジトリ直下の SQLite ファイルにフォールバック
const url = process.env.DATABASE_URL ?? "file:local.db";

const client = createClient({ url });

export const db = drizzle(client, { schema });
