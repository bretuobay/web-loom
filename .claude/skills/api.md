# API Development

Commands and patterns for the Express.js API backend.

## Commands

```bash
cd apps/api
npm run dev    # Start API with nodemon (auto-restart on changes)
npm run seed   # Seed SQLite database with test data
npm run build  # Build TypeScript to dist/
npm start      # Run built API
```

## TaskFlow API

```bash
cd apps/task-flow-api
npm run dev    # Start TaskFlow API
npm run seed   # Seed database
```

## Technical Details

- Express.js server with SQLite database (Sequelize ORM)
- Models use `sequelize-typescript` decorators
- CORS enabled for local development
- Located in `apps/api` and `apps/task-flow-api`

## Database

- SQLite for local development
- Sequelize ORM with TypeScript decorators
- Run `npm run seed` to populate test data
