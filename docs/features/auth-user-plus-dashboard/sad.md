---
status: Draft
owner: "Architect / Tech Lead"
reviewers: ["Tech Lead", "Security Lead"]
updated_at: "2026-09-02"
feature_size: "L"
target_surfaces: []
---

# Software Architecture Document — auth-user-plus-dashboard

<!-- 12 Arc42 sections. Empty section → <!-- N/A: <one-line reason> -->. -->
<!-- C4 Context (L1) lives inline in §3. C4 Container (L2) lives inline in §5. -->
<!-- Numbers in §10 come VERBATIM from spec.md §6 NFR — no inventing, no rounding. -->

## 1. Introduction and goals

**Intent.** Delivers the first user-facing vertical slice of daysleft: passwordless account creation (Google/GitHub OAuth or magic-link email) with account-linking by verified email, a session-gated dashboard shell, complete server-side logout, and a minimal i18n foundation. Establishes the auth boundary and dashboard route every future trip/day-count feature builds on.

**Top-3 quality goals (1-liners; full scenarios in §10):**

1. Security of the first authentication boundary — no open redirect, no duplicate accounts, complete server-side logout (spec §6.1)
2. Latency of the auth handoff (≤300ms p95) and first dashboard render (≤500ms p95) (spec §6)
3. Availability of the login/dashboard path (99.5% SLO) — the foundation every later feature depends on

**Stakeholders.**

| Role | Interest | Sign-off owner? |
|---|---|---|
| Traveler | signs up, signs in, uses the dashboard | No |
| Tech Lead | SAD approval | Yes |
| Security Lead | security review sign-off (spec §6.1: required — first auth boundary + first PII collection) | Yes |

## 2. Constraints

**Technical.**
- TypeScript on Node.js 20+
- Next.js 14+ (App Router), React, Tailwind CSS
- PostgreSQL, accessed via Drizzle ORM
- Architecture convention: feature-first modules under `src/modules/<name>/` (ui / app / data layers), no shared "components/services/hooks" grab-bag folders (architecture-map.md)

**Organisational.**
- Deadline / effort budget / team composition — not yet set by PM (TBD; see §11 risk row)

**Conventions.**
- `docs/architecture-map.md` §Conventions
- Unified error envelope `{ error: { code, message } }`; UUIDv7 IDs generated app-side; Drizzle-only persistence, no raw SQL outside `src/db/`; Vitest (unit) + Playwright (e2e)

**Regulatory / external.**
- No named compliance regime (e.g. no GDPR/HIPAA scope stated in spec)
- Security review required before ship (spec §6.1) — first authentication boundary and first PII collection in the app (email, OAuth provider account identifier, session token, browser-reported locale)

## 3. Context and scope

## 4. Solution strategy

## 5. Building block view

## 6. Runtime view

## 7. Deployment view

## 8. Crosscutting concepts

## 9. Architecture decisions

## 10. Quality requirements

## 11. Risks and technical debt

## 12. Glossary
