#!/bin/bash

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found!"
    echo "Please create it from .env.production.example"
    exit 1
fi

# Load environment variables
set -a
source .env.production
set +a

echo "📦 Pulling latest code..."
git pull origin main || echo "⚠️  Git pull skipped (not in git repository or already up to date)"

echo "🗄️  Ensuring database exists..."
# Extract database name from DATABASE_URL or use POSTGRES_DB
DB_NAME=${POSTGRES_DB:-lms-db}
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_USER=${POSTGRES_USER:-postgres}

# Check if database exists, create if it doesn't
echo "Checking if database '$DB_NAME' exists..."
DB_EXISTS=$(docker run --rm postgres:15-alpine psql -h "$DB_HOST" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" 2>/dev/null || echo "")

if [ -z "$DB_EXISTS" ]; then
    echo "Creating database '$DB_NAME'..."
    docker run --rm postgres:15-alpine psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\";"
    echo "✅ Database created successfully"
else
    echo "✅ Database already exists"
fi

echo "🏗️  Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🔄 Stopping old containers..."
docker-compose -f docker-compose.prod.yml down

echo "🚀 Starting new containers..."
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

echo "�� Running database migrations..."
docker-compose -f docker-compose.prod.yml --env-file .env.production exec -T api-admin pnpm prisma migrate deploy

echo "✅ Deployment complete!"
echo ""
echo "📋 Container status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🌐 API endpoints:"
echo "  Admin API: http://localhost:${API_ADMIN_PORT:-3200}"
echo "  User API:  http://localhost:${API_USER_PORT:-3100}"
echo ""
echo "📜 Showing logs (Ctrl+C to exit)..."
echo ""
docker-compose -f docker-compose.prod.yml logs -f
