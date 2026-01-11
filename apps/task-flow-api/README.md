# Task Flow API

A TypeScript + Express backend that exposes CRUD routes for projects and tasks built on Sequelize + SQLite. This service is intentionally light and prepared for development-focused interactions.

## Scripts

- `npm run dev` - start the API with `tsx watch` (restarts automatically when files change).
- `npm run build` - transpile TypeScript to `dist/`.
- `npm run start` - run the compiled server.
- `npm run lint` - run ESLint across TypeScript sources.
- `npm run type-check` - run the TypeScript compiler without emitting output.
- `npm run format` - invoke Prettier on the `src` tree.

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `4000` | Port that Express listens on. |
| `DB_FILE` | `db.sqlite` | Relative path to the SQLite database file. |
| `DB_LOGGING` | `false` | Set to `true` to enable Sequelize SQL logging. |

## Notes

- Database schema is created automatically on boot via `sequelize.sync({ alter: true })`.
- Sample projects and tasks are seeded during server startup when the database is empty.
- Routes are versioned under `/projects` and `/tasks` and include validation with Zod.
