import {
  index,
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { KeystrokeEvent } from "./types";

export const runs = pgTable(
  "runs",
  {
    id: serial("id").primaryKey(),
    userSub: text("user_sub").notNull(),
    drillId: text("drill_id").notNull().default("home-row-letters"),
    totalTimeMs: integer("total_time_ms").notNull(),
    accuracy: real("accuracy").notNull(),
    keystrokeLog: jsonb("keystroke_log").$type<KeystrokeEvent[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("runs_user_drill_time_idx").on(table.userSub, table.drillId, table.totalTimeMs),
  ],
);

export type RunRow = typeof runs.$inferSelect;
export type NewRun = typeof runs.$inferInsert;
