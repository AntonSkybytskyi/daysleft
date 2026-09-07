# daysleft
Track how many days you have left - Schengen 90/180, Vietnam, Thailand DTV - and plan your next visa run.

## Local development

Start a local Postgres in Docker, then run migrations:

```bash
cp .env.example .env.local   # first time only
pnpm docker:up                # starts Postgres on localhost:5434
pnpm db:up                    # applies migrations
pnpm dev
```

`pnpm docker:down` stops the container; data persists in the `daysleft-db-data` volume.
