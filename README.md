# Koncep

Community project proposals — built with Next.js, Drizzle ORM, and SQLite.

## Setup (PowerShell)

```powershell
npm install
npm run db:setup
npm run dev
```

The app is available at http://localhost:3000.

## Commands

| Command | Description |
| --- | --- |
| `npm run db:migrate` | Apply database migrations (explicit step). |
| `npm run db:seed` | Insert demo proposals if the database is empty. |
| `npm run db:setup` | Run `db:migrate` then `db:seed`. |
| `npm run dev` | Start the development server. |
| `npm run build` | Create a production build. |
| `npm run start` | Run the production build. |
| `npm run check` | Run lint, typecheck, and tests. |
| `npm run test` | Run unit tests. |

## Local data

- `data/` is local-only and git-ignored.
- Database files are regenerated through migrations and optional demo seeding.
- Do not commit database files.
- Seed data is demo content only and does not create accounts, real
  authentication, or production-ready data.
