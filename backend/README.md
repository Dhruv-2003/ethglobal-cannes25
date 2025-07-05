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

### Orders

- `GET /orders` - Get all orders
- `GET /orders/:id` - Get order by ID
- `POST /orders` - Create new order
- `PATCH /orders/:id` - Update order
- `DELETE /orders/:id` - Delete order
- `GET /orders/user/:address` - Get orders by user address
- `PATCH /orders/:id/complete` - Mark order as completed

### Custom

- `POST /process` - Custom order processing endpoint

## Project Structure

- `src/server.ts` - Main server with all endpoints
- `src/engine.ts` - Processing engine script
- `src/demo.ts` - Demo script to test functionality
- `prisma/schema.prisma` - Database schema

## Example Usage

1. **Create an order:**

```bash
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"userAddress": "0x1234...abcd", "makerToken": "0xToken123", "data": {"amount": "100", "type": "swap"}}'
```

2. **Get orders for a user:**

```bash
curl http://localhost:3000/orders/user/0x1234...abcd
```

3. **Complete an order:**

```bash
curl -X PATCH http://localhost:3000/orders/ORDER_ID/complete
```

4. **Run demo script:**

```bash
bun run demo
```

4. **Run engine:**

```bash
bun run engine
```

## Database Schema

- **Order**: id, userAddress, makerToken, data (JSON), completed, createdAt, updatedAt

Simple and ready for hackathon development! 🚀
