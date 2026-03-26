/**
 * ローカル用サンプルデータ投入。
 *
 * 初回（user が空）: npm run db:seed
 * 既存ユーザがある DB で全消去→投入: npm run db:seed -- --force
 *
 * 共通パスワード: demo1234
 *
 * 内容: 版「{実行年}年度（サンプル）」、実行年の3〜6月のシフト、A/B/C 各3名（計9ユーザー）。
 * /calendar は「今年・今月」で参照するため、年は実行時に合わせる（固定年だと年が変わるとセルが空になる）。
 */

import { createClient } from "@libsql/client";
import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { hash } from "bcryptjs";
import * as schema from "../src/lib/db/schema";

const { users, scheduleEdition, shiftCell, userLetterBinding } = schema;

const url = process.env.DATABASE_URL ?? "file:local.db";
const client = createClient({ url });
const db = drizzle(client, { schema });

const EDITION_ID = "seed-edition-demo-001";
const SHIFT_YEAR = new Date().getFullYear();
/** 3月〜6月 */
const SHIFT_MONTHS = [3, 4, 5, 6] as const;
const EDITION_LABEL = `${SHIFT_YEAR}年度（サンプル）`;
const DEMO_PASSWORD = "demo1234";

const SAMPLE_USERS = [
  {
    id: "seed-a-1",
    email: "a1@example.com",
    fullName: "佐藤 A一郎",
    letter: "A" as const,
    isAdmin: true,
  },
  {
    id: "seed-a-2",
    email: "a2@example.com",
    fullName: "鈴木 A二郎",
    letter: "A" as const,
    isAdmin: false,
  },
  {
    id: "seed-a-3",
    email: "a3@example.com",
    fullName: "高橋 A三郎",
    letter: "A" as const,
    isAdmin: false,
  },
  {
    id: "seed-b-1",
    email: "b1@example.com",
    fullName: "田中 B一郎",
    letter: "B" as const,
    isAdmin: false,
  },
  {
    id: "seed-b-2",
    email: "b2@example.com",
    fullName: "伊藤 B二郎",
    letter: "B" as const,
    isAdmin: false,
  },
  {
    id: "seed-b-3",
    email: "b3@example.com",
    fullName: "渡辺 B三郎",
    letter: "B" as const,
    isAdmin: false,
  },
  {
    id: "seed-c-1",
    email: "c1@example.com",
    fullName: "山本 C一郎",
    letter: "C" as const,
    isAdmin: false,
  },
  {
    id: "seed-c-2",
    email: "c2@example.com",
    fullName: "中村 C二郎",
    letter: "C" as const,
    isAdmin: false,
  },
  {
    id: "seed-c-3",
    email: "c3@example.com",
    fullName: "小林 C三郎",
    letter: "C" as const,
    isAdmin: false,
  },
];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

async function main() {
  const force = process.argv.includes("--force");

  const [row] = await db.select({ c: count() }).from(users);
  const userCount = row?.c ?? 0;

  if (userCount > 0 && !force) {
    console.error(
      "user に既存データがあります。全消去して入れ直す場合は次を実行してください:\n  npm run db:seed -- --force",
    );
    process.exit(1);
  }

  if (force) {
    await db.delete(shiftCell);
    await db.delete(userLetterBinding);
    await db.delete(scheduleEdition);
    await db.delete(users);
    console.log("既存の user / 版 / シフト / 紐付けを削除しました。");
  }

  const passwordHash = await hash(DEMO_PASSWORD, 10);
  const now = Date.now();

  await db.insert(scheduleEdition).values({
    id: EDITION_ID,
    label: EDITION_LABEL,
    createdAt: now,
  });

  await db.insert(users).values(
    SAMPLE_USERS.map((u) => ({
      id: u.id,
      email: u.email,
      passwordHash,
      fullName: u.fullName,
      isAdmin: u.isAdmin,
      createdAt: now,
    })),
  );

  await db.insert(userLetterBinding).values(
    SAMPLE_USERS.map((u) => ({
      userId: u.id,
      editionId: EDITION_ID,
      letter: u.letter,
    })),
  );

  const rowLetters = ["A", "B", "C", "D"] as const;
  const vals = ["1", "2", "3", "休"] as const;
  const cellRows: (typeof shiftCell.$inferInsert)[] = [];

  for (const month of SHIFT_MONTHS) {
    const dim = daysInMonth(SHIFT_YEAR, month);
    for (const L of rowLetters) {
      const base = L.charCodeAt(0) - "A".charCodeAt(0);
      for (let day = 1; day <= dim; day++) {
        cellRows.push({
          editionId: EDITION_ID,
          year: SHIFT_YEAR,
          month,
          letter: L,
          day,
          value: vals[(day + base + month) % 4],
        });
      }
    }
  }

  await db.insert(shiftCell).values(cellRows);

  const [{ n }] = await db
    .select({ n: count() })
    .from(shiftCell)
    .where(eq(shiftCell.editionId, EDITION_ID));

  const currentMonth = new Date().getMonth() + 1;
  const monthInSeed = (SHIFT_MONTHS as readonly number[]).includes(currentMonth);

  console.log("\nサンプル投入が完了しました。\n");
  console.log(`  版: ${EDITION_LABEL}`);
  console.log(
    `  シフト: ${SHIFT_YEAR}年 ${SHIFT_MONTHS.join("・")}月（4列×各月日数、セル合計 ${n}）`,
  );
  console.log("  ユーザー: A/B/C 各3名（計9名）、パスワードはすべて demo1234");
  console.log("  管理者: a1@example.com（佐藤 A一郎）のみ isAdmin");
  console.log("\n  メール一覧:");
  for (const u of SAMPLE_USERS) {
    console.log(`    ${u.letter}列  ${u.email}  ${u.fullName}`);
  }
  if (monthInSeed) {
    console.log(
      `\n  /calendar は今年・今月（${SHIFT_YEAR}年${currentMonth}月）を表示するため、1/2/3/休 が一覧に出ます。\n`,
    );
  } else {
    console.log(
      `\n  注意: 今月は ${SHIFT_YEAR}年${currentMonth}月（シードは3〜6月のみ）のため /calendar は「—」になります。管理画面の月次で 3〜6月を開いてください。\n`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
