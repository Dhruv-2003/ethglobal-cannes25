# Cannes 25 Backend

TypeScript backend with Zen Mode automation for automated trading using Bun, Hono, Prisma, and PostgreSQL.

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

### Zen Mode (Automated Trading)
- `POST /zen-mode/activate` - Activate zen mode for automated trading
- `POST /zen-mode/deactivate` - Deactivate zen mode
- `GET /zen-mode/users` - Get all active zen mode users
- `GET /zen-mode/users/:address` - Get zen mode user by address
- `PATCH /zen-mode/users/:address/preferences` - Update user preferences

## Project Structure

- `src/server.ts` - Main server with REST API endpoints
- `src/engine.ts` - Zen mode automation engine for order creation
- `src/demo.ts` - Demo script for order taker (fills existing orders)
- `prisma/schema.prisma` - Database schema with Order and ZenModeUser models

## Example Usage

### 1. Activate Zen Mode (Automated Trading)

```bash
curl -X POST http://localhost:3000/zen-mode/activate \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "0x1234...abcd",
    "preferences": {
      "strategy": "dca",
      "frequency": "daily",
      "amount": "100",
      "targetToken": "ETH",
      "slippageTolerance": "1%"
    }
  }'
```

### 2. Get Active Zen Mode Users

```bash
curl http://localhost:3000/zen-mode/users
```

### 3. Check Orders Created by Engine

```bash
curl http://localhost:3000/orders/user/0x1234...abcd
```

### 4. Run Demo Script (Order Taker)

```bash
bun run demo
```

### 5. Deactivate Zen Mode

```bash
curl -X POST http://localhost:3000/zen-mode/deactivate \
  -H "Content-Type: application/json" \
  -d '{"userAddress": "0x1234...abcd"}'
```

## Database Schema

### Order Model
- **id**: Unique identifier (CUID)
- **userAddress**: Wallet address of the order creator
- **makerToken**: Token being offered in the trade
- **data**: JSON object with order details (amount, price, strategy, etc.)
- **completed**: Boolean indicating if order is filled
- **createdAt/updatedAt**: Timestamps

### ZenModeUser Model
- **id**: Unique identifier (CUID)  
- **userAddress**: Wallet address (unique)
- **preferences**: JSON object with trading strategy and parameters
- **isActive**: Boolean indicating if zen mode is currently active
- **lastOrderCheck**: Timestamp of last engine check
- **createdAt/updatedAt**: Timestamps

## How It Works

1. **User activates zen mode** with trading preferences via API
2. **Engine monitors** active zen mode users and market conditions
3. **Engine creates orders** automatically based on user preferences
4. **Takers fill orders** using the demo script or custom implementation
5. **Orders are marked as completed** when successfully filled on-chain

Perfect for hackathon development with automated trading capabilities! 🚀
