CREATE TABLE IF NOT EXISTS "runs" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_sub" text NOT NULL,
  "drill_id" text DEFAULT 'home-row-letters' NOT NULL,
  "total_time_ms" integer NOT NULL,
  "accuracy" real NOT NULL,
  "keystroke_log" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "runs_user_drill_time_idx"
  ON "runs" ("user_sub", "drill_id", "total_time_ms");
