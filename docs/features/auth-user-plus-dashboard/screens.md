---
status: draft
feature_size: "L"
tool: "code"
updated_at: "2026-09-03"
---

# Screens — auth-user-plus-dashboard

> The canonical **screen manifest** — every screen in every state — produced by `screens` (between
> `api` and `tasks`) and read by `tasks` (each `ui` task cites SCR ids + states), `implement`
> (builds the screen to the declared states) and `review` (the built screen must match this).
> Downstream stages reference **only this manifest** — never the raw Figma / `.pen` file.

## Source

- **Tool:** code (from `docs/design-system.md` — no Figma/Pencil MCP connected this session; not a
  degradation, `code` is the canon's own committed choice).
- **File:** inline wireframes below.

## Screens

### SCR-01 — Login

| State | Trigger / condition | Components (from the inventory) | Source-ref |
|---|---|---|---|
| default | Direct visit; choose Google, GitHub, or magic-link email (US-01) | `OAuthProviderButton` ×2, `EmailInput`, `Button` (primary) | wireframe below |
| loading | A method was chosen; redirecting to the provider or Clerk (button pressed) | `OAuthProviderButton` (loading), `Spinner` | wireframe below |
| error-sign-in-failed | OAuth consent declined or provider unavailable (AC-01b) | `Alert` (error), `OAuthProviderButton` ×2, `EmailInput` | wireframe below |
| error-email-required | OAuth provider returned no verified email (AC-03b, contract `auth.email_required`) | `Alert` (error), `OAuthProviderButton` ×2 | wireframe below |
| redirected-sign-in-required | Unauthenticated visit to a protected route; return-to preserved, no data revealed (AC-05, contract `getDashboard` 401 `auth.session_invalid`) | `Alert` (info), `OAuthProviderButton` ×2, `EmailInput` | wireframe below |
| error-email-conflict | Dashboard 401'd with `auth.email_conflict` — the session's verified email is already linked to a different account (AC-03b, contract `auth.email_conflict`) | `Alert` (error), `OAuthProviderButton` ×2, `EmailInput` | wireframe below |

```text
+------------------------------------------+   default
|  daysleft                                 |
|                                            |
|  [ Continue with Google  ]                |
|  [ Continue with GitHub  ]                |
|                                            |
|  --------------- or ---------------       |
|  Email: [______________________]          |
|  [ Send magic link ]                      |
+------------------------------------------+

+------------------------------------------+   loading
|  daysleft                                 |
|  [ Continue with Google  (spinner) ]      |
|  ...                                      |
+------------------------------------------+

+------------------------------------------+   error-sign-in-failed
|  daysleft                                 |
|  (!) Sign-in didn't complete.             |
|      Try again with any method below.     |
|  [ Continue with Google  ]                |
|  [ Continue with GitHub  ]                |
|  Email: [______________________]          |
+------------------------------------------+

+------------------------------------------+   error-email-required
|  daysleft                                 |
|  (!) An email is required. Make your      |
|      email visible/verified with this     |
|      provider, then try again.            |
|  [ Continue with Google  ]                |
|  [ Continue with GitHub  ]                |
+------------------------------------------+

+------------------------------------------+   redirected-sign-in-required
|  daysleft                                 |
|  (i) Sign in to continue.                 |
|  [ Continue with Google  ]                |
|  [ Continue with GitHub  ]                |
|  Email: [______________________]          |
+------------------------------------------+

+------------------------------------------+   error-email-conflict
|  daysleft                                 |
|  (!) That email is already linked to a    |
|      different account. Sign in with      |
|      the original method.                 |
|  [ Continue with Google  ]                |
|  [ Continue with GitHub  ]                |
|  Email: [______________________]          |
+------------------------------------------+
```

### SCR-02 — Check your email

| State | Trigger / condition | Components (from the inventory) | Source-ref |
|---|---|---|---|
| default | Magic-link email submitted on SCR-01; confirms it was sent, offers resend. Silently long-polls the sign-in attempt in the background (Clerk `createEmailLinkFlow`/`startEmailLinkFlow`) so that opening the link on a DIFFERENT device completes the sign-in and navigates THIS device straight to the dashboard, per AC-02b — no separate visible state, since success just navigates away | `Alert` (info), `LinkButton` ("Resend") | wireframe below |
| loading | Resend requested, in flight | `LinkButton` (loading), `Spinner` | wireframe below |
| resent-confirmation | Resend succeeded | `Alert` (success) | wireframe below |
| error-rate-limited | Magic-link send rate exceeded (spec §6 NFR ≤5/email/hour, sad.md §8 risk) | `Alert` (error) | wireframe below |
| error-sign-in-failed | Resend failed for a reason other than rate-limiting, OR the background poll resolved without completing (e.g. expired) (AC-02) | `Alert` (error), `LinkButton` ("Resend") | wireframe below |
| empty | N/A — this screen always shows the confirmation content; no data-driven empty case | — |

```text
+------------------------------------------+   default
|  Check your email                         |
|  We sent a sign-in link to                |
|  traveler@example.test.                   |
|  Didn't get it? [ Resend ]                |
+------------------------------------------+

+------------------------------------------+   loading
|  Check your email                         |
|  ...                                      |
|  [ Resend (spinner) ]                     |
+------------------------------------------+

+------------------------------------------+   resent-confirmation
|  Check your email                         |
|  ✓ Link resent to traveler@example.test.  |
+------------------------------------------+

+------------------------------------------+   error-rate-limited
|  Check your email                         |
|  (!) Too many requests. Try again later.  |
+------------------------------------------+

+------------------------------------------+   error-sign-in-failed
|  Check your email                         |
|  (!) Couldn't resend the link. Try again  |
|      in a moment.                         |
|  Didn't get it? [ Resend ]                |
+------------------------------------------+
```

### SCR-03 — Dashboard

| State | Trigger / condition | Components (from the inventory) | Source-ref |
|---|---|---|---|
| loading | `getDashboard` request in flight | `Spinner` | wireframe below |
| default / empty | No trips recorded (AC-07); `has_trips: false` is hardcoded in this slice (spec §3 non-goal — no `trips` table yet) | `Header` (with logout), `EmptyState` | wireframe below |
| linked-account | AC-03: this session's create-or-fetch fallback matched an existing account by verified email (`GET /api/v1/dashboard`'s `linked: true`) | `Header`, `Alert` (success), `EmptyState` | wireframe below |
| error | The `getDashboard` fetch itself rejects (network failure) or returns a non-401 non-200 status — a genuine 401 (`auth.session_invalid`/`auth.email_required`/`auth.email_conflict`) redirects to SCR-01 instead, per the row above | `Header` (with logout), `Alert` (error) | wireframe below |
| error-logout-failed | `POST /api/v1/auth/logout` rejects or returns non-204 — the Clerk session wasn't revoked, so this stays on SCR-03 with its own message instead of the fetch-failure one (AC-06) | `Header` (with logout), `Alert` (error) | wireframe below |

```text
+------------------------------------------+   loading
|  daysleft              [ Log out ]        |
|  (spinner)                                |
+------------------------------------------+

+------------------------------------------+   default / empty
|  daysleft              [ Log out ]        |
|                                            |
|      Nothing tracked yet.                 |
|      (future: add your first trip here)   |
+------------------------------------------+

+------------------------------------------+   error
|  daysleft              [ Log out ]        |
|  [ Couldn't load your dashboard. Check   ]|
|  [ your connection and try again.        ]|
+------------------------------------------+

+------------------------------------------+   error-logout-failed
|  daysleft              [ Log out ]        |
|  [ Couldn't sign you out. You're still   ]|
|  [ signed in — try again.                ]|
+------------------------------------------+
```

### SCR-04 — Magic-link invalid

| State | Trigger / condition | Components (from the inventory) | Source-ref |
|---|---|---|---|
| default | Link expired, already used, or superseded (AC-02) | `Alert` (error), `Button` ("Send a new link") | wireframe below |
| loading | New-link request in flight | `Button` (loading), `Spinner` | wireframe below |
| error-rate-limited | Same magic-link send NFR as SCR-02 (spec §6, sad.md §8) | `Alert` (error) | wireframe below |
| error-sign-in-failed | Resend failed for a reason other than rate-limiting or the sign-up fallback (AC-02) | `Alert` (error), `Button` ("Send a new link") | wireframe below |
| verified-elsewhere | Clerk reports the link was verified on a DIFFERENT device than this one (`onVerifiedOnOtherDevice` / `client_mismatch`) — the sign-in succeeds over there, not here, per AC-02b; no resend offered, since one would create a new attempt that supersedes the session just established on the other device | `Alert` (success) | wireframe below |
| empty | N/A — this screen always shows the invalid-link message; no data-driven empty case | — |

```text
+------------------------------------------+   default
|  This link is no longer valid             |
|  It expired, was already used, or a       |
|  newer link was requested.                |
|  [ Send a new link ]                      |
+------------------------------------------+

+------------------------------------------+   loading
|  This link is no longer valid             |
|  [ Send a new link (spinner) ]            |
+------------------------------------------+

+------------------------------------------+   error-rate-limited
|  This link is no longer valid             |
|  (!) Too many requests. Try again later.  |
+------------------------------------------+

+------------------------------------------+   error-sign-in-failed
|  This link is no longer valid             |
|  (!) Couldn't send a new link. Try again  |
|      in a moment.                         |
|  [ Send a new link ]                      |
+------------------------------------------+
```

## New components

<!-- design-system.md's Component inventory is empty (greenfield, first UI feature) — every
component here is NEW by necessity, not by choice; each is registered back into
docs/design-system.md when `implement` builds it. -->

| Component | Why no existing primitive fits | Registered in design-system |
|---|---|---|
| `OAuthProviderButton` | Provider-branded button (Google/GitHub) with a loading variant; inventory is empty | registered |
| `EmailInput` | Labeled email field with inline validation; inventory is empty | registered |
| `Button` | Generic primary/secondary action button; inventory is empty | registered |
| `LinkButton` | Text-styled inline action (e.g. "Resend"); inventory is empty | registered |
| `Alert` | Info/success/error banner variant; inventory is empty | registered |
| `Spinner` | Loading indicator, standalone or inline in a button | registered |
| `Header` | App-shell header carrying the logout action | registered |
| `EmptyState` | Illustration + message for "nothing tracked yet" | registered |
