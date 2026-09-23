# Atlas integration

Atlas files are shipped under `data/atlas/{maps,illustrations,svg}` on the server, not public assets or a client catalog. Deployments must retain these directories in the working directory. JSON is Zod-validated at read time; data errors fail explicitly. Version: `1`.

## HTTP contract

- `GET /api/atlas/catalog`: `{ items: AtlasSummary[], fullAccess: boolean }`. Locked metadata is visible; no coordinates, sources, explanations, or SVG paths are included.
- `GET /api/atlas/items/:id`: `AtlasItem`, subject to access.
- `GET /api/atlas/items/:id/svg`: protected `image/svg+xml` for illustrations.
- All Atlas responses use `Cache-Control: private, no-store`.
- Locked content: 403 `{ error, code: "ATLAS_LOCKED", needsSubscription: true, requiresSubscription: true }`.
- Missing item: 404 `ATLAS_NOT_FOUND`; invalid context/place: 400 `ATLAS_INVALID_CONTEXT` / `ATLAS_INVALID_PLACE`; stale version: 409 `ATLAS_STALE_VERSION`; oversized context: 413 `ATLAS_CONTEXT_TOO_LARGE`. All include `error`.

Guests and ordinary accounts receive only items marked `sample` (the shipped ten maps and tabernacle overview). Full access uses existing Gold/Premium subscription reads with existing platform source and expiry checks, the existing real seven-day trial, or server admin/super-admin roles. Strong/lifetime alone does not unlock the Atlas. Existing subscription reads also honor administrative plan bonuses; no subscription/auth logic is changed.

The existing authenticated `POST /api/ai/ask` accepts optional `atlasContext: { itemId, version, selectedPlaceId?, mode: "ancient" | "modern" }`. Extra context fields are rejected. The server resolves the shipped item, version and selected place, checks Atlas access, and constructs bounded context including references, sources, uncertainty and qualified dimensions. No client-provided prose/privileges are accepted as Atlas context. Schema validation errors retain the existing 400 `{ error }` shape. Anonymous UI must request login, not use a new AI route.

Normal AI requests retain their existing behavior. Atlas does not create a new quota, AI mode or generated-image endpoint, and does not change the existing counters or subscription permissions for AI.

## Existing discrepancies intentionally not changed

- `/api/ai/quota` reports unlimited (`limit: -1`) for paid Gold/Premium/Lifetime and admins; it does not count trial as unlimited. Actual `/api/ai/ask` allows two lifetime free questions, Gold 30/day, Premium/Lifetime/active trial 100/day; admins bypass. Its returned `usageInfo` uses `hasPremium` alone for 100 vs 30, so trial/lifetime response metadata can disagree with enforcement.
- Quota reads and the later usage increment are not an atomic reservation. Concurrent requests can all pass the preflight check before increments. The increment is after the OpenAI call. This pre-existing race is not fixed in this Atlas change.
- `/api/ai/generate-image` requires Premium/Lifetime or admin, not Gold or trial, and does not use the ask question quota gates/counter. Atlas illustrations are curated static SVGs, not generated images.
- Atlas access and AI mode access are separate: Gold may browse all Atlas items but does not unlock Premium AI modes; Lifetime may qualify for existing AI features but does not itself unlock protected Atlas content.