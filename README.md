# Zenny - Non-Custodial Stablecoin Yield Engine

**ETHGlobal Cannes 2025 Hackathon Submission**

Earn passive returns on stablecoins without losing custody. Activate zen-mode, earn pennies.

## What is Zenny?

Zenny is a non-custodial stablecoin yield engine that enables users to passively earn returns (~3.65% APY) without losing custody of their funds. Users activate "zen-mode" with a single signature, which assigns a session key with scoped permissions to an automated backend engine. The engine then places and executes profitable limit orders directly from the user's wallet.

## How it Works

1. **Session Key Authorization** - User signs once to authorize a session key with limited permissions
2. **Automated Arbitrage** - Backend engine identifies profitable stablecoin arbitrage opportunities
3. **Profit-Only Execution** - Custom pre-hook contract ensures trades only execute if profitable
4. **Non-Custodial** - Funds never leave the user's wallet, engine just has execution rights

## Tech Stack

- **Smart Accounts**: Privy + ZeroDev + EIP-7702 for session key management
- **Backend**: Bun + Hono + TypeScript + PostgreSQL + Prisma
- **Smart Contracts**: Foundry + 1inch integration with custom pre-hooks
- **Frontend**: Next + Tailwind CSS + Shadcn UI [Repo](https://github.com/kushagrasarathe/eth-cannes-2025/tree/main)
- **Session Keys**: EIP-1271 signature validation for automated execution

## Project Structure

```
ethglobal-cannes25/
├── backend/                 # TypeScript backend API & automation engine
│   ├── src/
│   │   ├── server.ts       # REST API server (orders, zen-mode endpoints)
│   │   ├── engine.ts       # Automation engine for zen-mode users
│   │   └── demo.ts         # Demo script (order taker/filler)
│   ├── prisma/             # Database schema & migrations
│   └── README.md           # Backend setup instructions
│
├── contract/               # Smart contracts & blockchain integration
│   ├── src/                # Solidity contracts
│   ├── script/             # Deployment scripts
│   └── foundry.toml        # Foundry configuration
│
└── README.md               # This file
```

## Quick Start

### Backend (API & Engine)

```bash
cd backend
bun install
bun run db:generate && bun run db:push
bun run dev
```

### Smart Contracts

```bash
cd contract
forge build
forge test
```

## Key Features

- **Non-custodial** - Funds never leave user's wallet
- **Profitable-only trades** - Pre-hook validation ensures no losses
- **Session key automation** - One signature enables continuous operation
- **Stablecoin arbitrage** - Automated opportunities across USDT/USDC/DAI
- **Gasless execution** - Integrated paymasters for seamless UX

## Demo Flow

1. User activates zen-mode via API with trading preferences
2. Engine monitors market conditions and creates limit orders
3. Takers fill profitable orders on-chain
4. Engine compounds returns automatically

Built for ETHGlobal Cannes 2025 🚀
