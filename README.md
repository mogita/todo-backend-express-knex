> [!WARNING]
> I implemented this for an interview once ages ago, but now it's unmaintained.

# Todo Backend with Express and Knex

This is an implementation of [Todo-Backend](http://todobackend.com/) using Bun and Express for the server, Knex for database migrations and query building, and TypeScript for type safety. By default, this project configures Knex to save to PostgreSQL.

## Prerequisites

- Bun (v1.0 or higher)
- PostgreSQL
- TypeScript

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```
3. Create a databases:
   ```bash
   createdb todo-app
   createdb todo-app-test
   ```
4. From the "server" directory, copy `.env.example` to `.env` and fill in your database credentials:
   ```bash
   cp .env.example .env
   ```

## Development

Start the development server:

```bash
bun run dev

# to run the server only
bun run dev:server
```

## Testing

Run the test suite:

```bash
# make sure you have created the test database

bun run test
```

The test script will:

- Apply database migrations
- Run all tests
- Clean up after completion

## API Endpoints

### Projects

- `GET /projects` - List all projects
- `GET /projects/:project_id` - Get a single project
- `POST /projects` - Create a new project
- `PATCH /projects/:project_id` - Update a project
- `DELETE /projects/:project_id` - Delete a single project
- `DELETE /projects` - Delete all projects

### Todos

- `GET /projects/:project_id/todos` - List all todos for a project
- `GET /projects/:project_id/todos/:id` - Get a single todo
- `POST /projects/:project_id/todos` - Create a new todo
- `PATCH /projects/:project_id/todos/:id` - Update a todo
- `DELETE /projects/:project_id/todos/:id` - Delete a single todo
- `DELETE /projects/:project_id/todos` - Delete all todos for a project
