# Cannes 25 Backend

Simple TypeScript backend for hackathon with PostgreSQL and Prisma.

## Quick Setup

### 1. Install Dependencies

```bash
cd backend
bun install
```

### 2. Setup Database

Make sure you have PostgreSQL running locally, then:

1. Update `.env` with your database URL:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/cannes25_db?schema=public"
```

2. Generate Prisma client and push schema:

```bash
bun run db:generate
bun run db:push
```

### 3. Start Development Server

```bash
bun run dev
```

Server will start on http://localhost:3000

## Available Scripts

- `bun run dev` - Start development server with hot reload
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run engine` - Run the engine script
- `bun run demo` - Run the demo script
- `bun run db:generate` - Generate Prisma client
- `bun run db:push` - Push schema to database
- `bun run db:studio` - Open Prisma Studio

## API Endpoints

### Users

- `GET /users` - Get all users
- `POST /users` - Create user
- `GET /users/:id` - Get user by ID

### Tasks

- `GET /tasks` - Get all tasks
- `POST /tasks` - Create task
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

### Custom

- `POST /process` - Custom processing endpoint

## Project Structure

- `src/server.ts` - Main server with all endpoints
- `src/engine.ts` - Processing engine script
- `src/demo.ts` - Demo script to test functionality
- `prisma/schema.prisma` - Database schema

## Example Usage

1. **Create a user:**

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'
```

2. **Create a task:**

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "My Task", "description": "Task description", "userId": "USER_ID"}'
```

3. **Run demo script:**

```bash
bun run demo
```

4. **Run engine:**

```bash
bun run engine
```

## Database Schema

- **User**: id, email, name, createdAt, updatedAt
- **Task**: id, title, description, completed, createdAt, updatedAt, userId

Simple and ready for hackathon development! 🚀
