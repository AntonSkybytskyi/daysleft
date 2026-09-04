---
status: Living
updated_at: "2026-09-03"
---

# Domain Context — daysleft

## Glossary

- Sign-in session — the period a Traveler is authenticated in the app, bounded by sign-in and sign-out (or the auth provider's session expiring). For client-side in-memory state (like a data cache), the sign-in session is also bounded by the current page load — a browser reload starts a fresh sign-in session for that state even if the underlying auth session is still valid. NOT a single page load / browser tab lifetime — the underlying authentication can outlive a page reload; only client-side in-memory state resets on reload.
- Traveler — a person who signs up to track their own visa day-counts (Schengen 90/180, Vietnam, Thailand DTV) and plan visa runs; one account = one traveler, no multi-user/org concept. NOT admin/staff — no internal/operator role exists in this app.
