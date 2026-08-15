---
name: drizzle push orphan-table rename trap
description: db:push may propose renaming an orphan DB table into a new schema table
---
The DB has tables that no longer exist in `shared/schema.ts` (e.g. `user_reading_plan_progress`). When adding a new table via `npm run db:push`, drizzle-kit interactively proposes *renaming* the orphan table into the new one — which would destroy its data.

**Why:** drizzle diffs schema vs DB and treats drop+create as a possible rename.

**How to apply:** when db:push shows a `~ old › new rename table` prompt, do NOT accept the rename; create the new table manually with `psql "$DATABASE_URL" -c "CREATE TABLE IF NOT EXISTS ..."` matching the drizzle schema, leaving the orphan untouched.
