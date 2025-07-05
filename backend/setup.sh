#!/bin/bash

echo "🚀 Setting up Cannes 25 Backend..."

# Check if PostgreSQL is running
if ! pg_isready > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "   On macOS with Homebrew: brew services start postgresql"
    exit 1
fi

echo "✅ PostgreSQL is running"

# Create database if it doesn't exist
createdb cannes25_db 2>/dev/null || echo "Database cannes25_db already exists or user doesn't have permission"

echo "📦 Installing dependencies..."
bun install

echo "🔧 Generating Prisma client..."
bunx prisma generate

echo "📊 Pushing database schema..."
bunx prisma db push

echo ""
echo "🎉 Setup complete! You can now:"
echo "   • Start the server: bun run dev"
echo "   • Run the demo: bun run demo"
echo "   • Run the engine: bun run engine"
echo "   • Open Prisma Studio: bun run db:studio"
echo ""
echo "🌐 Server will be available at: http://localhost:3000"
