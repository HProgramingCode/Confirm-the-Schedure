import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "number" })
    .notNull()
    .$defaultFn(() => Date.now()),
});

export const scheduleEdition = sqliteTable("schedule_edition", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  label: text("label").notNull(),
  createdAt: integer("created_at", { mode: "number" })
    .notNull()
    .$defaultFn(() => Date.now()),
});

export const shiftCell = sqliteTable(
  "shift_cell",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    editionId: text("edition_id")
      .notNull()
      .references(() => scheduleEdition.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    month: integer("month").notNull(),
    letter: text("letter").notNull(),
    day: integer("day").notNull(),
    value: text("value").notNull(),
  },
  (t) => [
    // 版・年月・列・日の組み合わせは 1 セル（upsert の衝突解決にも使う）
    uniqueIndex("shift_cell_edition_ymld").on(
      t.editionId,
      t.year,
      t.month,
      t.letter,
      t.day,
    ),
  ],
);

export const userLetterBinding = sqliteTable(
  "user_letter_binding",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    editionId: text("edition_id")
      .notNull()
      .references(() => scheduleEdition.id, { onDelete: "cascade" }),
    letter: text("letter").notNull(),
  },
  (t) => [
    // 同一ユーザーは版ごとに 1 列だけ割り当て可能
    uniqueIndex("user_letter_binding_user_edition").on(t.userId, t.editionId),
  ],
);
