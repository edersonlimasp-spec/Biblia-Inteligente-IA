# Native push schema on Publish

The schema source of truth is `shared/schema.ts`. The additive development
migration is `0003_native_push_tokens.sql`: it creates only `push_tokens`,
its token uniqueness/user/platform indexes, and `push_notification_claims`
with its user/date primary key and user foreign keys.

Replit Publish compares the actual development and production schemas, not
the presence of an SQL file. Both tables must exist in development before
publishing. Approve creation of these two new tables and their constraints
and indexes. Do not rename existing tables into them, drop existing tables,
or choose an overwrite of production data.

Do not run this migration at application startup or in the deployment build.
Do not execute it directly against production.

After publishing, verify the production table presence with read-only queries.
Push sending remains disabled until the owner configures
`FIREBASE_SERVICE_ACCOUNT`; neither this migration nor the Firebase client
configuration enables backend sending.