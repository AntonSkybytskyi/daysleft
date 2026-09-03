# API contract — fetch-with-tanstack-query

**Skipped: no external interface for this feature.**

`sad.md` frontmatter declares `target_surfaces: [web-frontend]` only — no `backend-service` surface. Per the surfaces gating table, a `web-frontend` surface *consumes* the backend contract, it does not author one. This feature's spec §3 explicitly non-goals any endpoint/contract change: the existing `/api/v1/dashboard` endpoint is reused as-is, only the client's fetching/caching mechanism changes. `data-model.md` is also absent (legal fast-lane skip — no schema change, confirmed at the `sequences` handoff).

No new/changed endpoint, event, or public signature exists to contract. `contracts/openapi.yaml` and `contracts/events.md` are not produced.

Proceeding straight to the next stage.
