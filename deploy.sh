#!/bin/bash#!/bin/bash

# =========================================

set -e  # Exit on error# Production Deployment Script

# =========================================

echo "🚀 Starting deployment..."# This script automates the deployment process for production environments.

#

# Check if .env.production exists# Usage:

if [ ! -f .env.production ]; then#   ./deploy.sh [environment] [version]

    echo "❌ Error: .env.production file not found!"#

    echo "Please create it from .env.production.example"# Examples:

    exit 1#   ./deploy.sh production v1.0.0

fi#   ./deploy.sh staging latest



# Load environment variablesset -e  # Exit on error

set -aset -u  # Exit on undefined variable

source .env.production

set +a# =========================================

# Configuration

echo "📦 Pulling latest code..."# =========================================

git pull origin main || echo "⚠️  Git pull skipped (not in git repository or already up to date)"SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PROJECT_NAME="modular-lms"

echo "🗄️  Ensuring database exists..."COMPOSE_FILE="docker-compose.prod.yml"

# Extract database name from DATABASE_URL or use POSTGRES_DB

DB_NAME=${POSTGRES_DB:-lms-db}# Default values

DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')ENVIRONMENT="${1:-production}"

DB_USER=${POSTGRES_USER:-postgres}VERSION="${2:-latest}"

REGISTRY="${DOCKER_REGISTRY:-}"

# Check if database exists, create if it doesn'tENV_FILE=".env.${ENVIRONMENT}"

echo "Checking if database '$DB_NAME' exists..."

DB_EXISTS=$(docker run --rm postgres:15-alpine psql -h "$DB_HOST" -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" 2>/dev/null || echo "")# Colors for output

RED='\033[0;31m'

if [ -z "$DB_EXISTS" ]; thenGREEN='\033[0;32m'

    echo "Creating database '$DB_NAME'..."YELLOW='\033[1;33m'

    docker run --rm postgres:15-alpine psql -h "$DB_HOST" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\";"BLUE='\033[0;34m'

    echo "✅ Database created successfully"NC='\033[0m' # No Color

else

    echo "✅ Database already exists"# =========================================

fi# Helper Functions

# =========================================

echo "🏗️  Building Docker images..."log_info() {

docker-compose -f docker-compose.prod.yml build --no-cache    echo -e "${BLUE}[INFO]${NC} $1"

}

echo "🔄 Stopping old containers..."

docker-compose -f docker-compose.prod.yml downlog_success() {

    echo -e "${GREEN}[SUCCESS]${NC} $1"

echo "🚀 Starting new containers..."}

docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

log_warning() {

echo "⏳ Waiting for services to be healthy..."    echo -e "${YELLOW}[WARNING]${NC} $1"

sleep 10}



echo "📊 Running database migrations..."log_error() {

docker-compose -f docker-compose.prod.yml --env-file .env.production exec -T api-admin pnpm prisma migrate deploy    echo -e "${RED}[ERROR]${NC} $1"

}

echo "✅ Deployment complete!"

echo ""check_requirements() {

echo "📋 Container status:"    log_info "Checking requirements..."

docker-compose -f docker-compose.prod.yml ps    

    if ! command -v docker &> /dev/null; then

echo ""        log_error "Docker is not installed"

echo "🔍 Check logs with:"        exit 1

echo "  docker-compose -f docker-compose.prod.yml logs -f api-admin"    fi

echo "  docker-compose -f docker-compose.prod.yml logs -f api-user"    

echo ""    if ! command -v docker-compose &> /dev/null; then

echo "🌐 API endpoints:"        log_error "Docker Compose is not installed"

echo "  Admin API: http://localhost:${API_ADMIN_PORT:-3200}"        exit 1

echo "  User API:  http://localhost:${API_USER_PORT:-3100}"    fi

    
    if [ ! -f "${ENV_FILE}" ]; then
        log_error "Environment file ${ENV_FILE} not found"
        log_info "Please create ${ENV_FILE} based on .env.example"
        exit 1
    fi
    
    log_success "Requirements check passed"
}

backup_database() {
    log_info "Creating database backup..."
    
    BACKUP_DIR="${SCRIPT_DIR}/backups"
    mkdir -p "${BACKUP_DIR}"
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql.gz"
    
    if docker-compose -f "${COMPOSE_FILE}" ps | grep -q "db"; then
        docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" exec -T db \
            pg_dump -U "${POSTGRES_USER:-postgres}" "${POSTGRES_DB:-loan_db}" | gzip > "${BACKUP_FILE}"
        
        log_success "Database backup created: ${BACKUP_FILE}"
    else
        log_warning "Database container not running, skipping backup"
    fi
}

pull_images() {
    log_info "Pulling latest images..."
    
    export IMAGE_TAG="${VERSION}"
    docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" pull
    
    log_success "Images pulled successfully"
}

run_migrations() {
    log_info "Running database migrations..."
    
    docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" run --rm api-admin \
        pnpm exec prisma migrate deploy
    
    log_success "Migrations completed"
}

health_check() {
    local service=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    log_info "Waiting for ${service} to be healthy..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "http://localhost:${port}/health" > /dev/null; then
            log_success "${service} is healthy"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "${service} health check failed after ${max_attempts} attempts"
    return 1
}

deploy_service() {
    local service=$1
    
    log_info "Deploying ${service}..."
    
    # Start new container
    docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d --no-deps --build "${service}"
    
    # Wait for health check
    sleep 5
    
    # Remove old containers
    docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" rm -f "${service}"
    
    log_success "${service} deployed successfully"
}

cleanup_old_images() {
    log_info "Cleaning up old images..."
    
    docker image prune -f
    
    log_success "Cleanup completed"
}

# =========================================
# Main Deployment Flow
# =========================================
main() {
    log_info "Starting deployment for ${ENVIRONMENT} environment (version: ${VERSION})"
    
    # Pre-deployment checks
    check_requirements
    
    # Backup database
    backup_database
    
    # Pull latest images
    pull_images
    
    # Run database migrations
    run_migrations
    
    # Deploy services
    deploy_service "api-admin"
    deploy_service "api-user"
    
    # Health checks
    ADMIN_PORT="${ADMIN_API_PORT:-3000}"
    USER_PORT="${USER_API_PORT:-3001}"
    
    health_check "api-admin" "${ADMIN_PORT}"
    health_check "api-user" "${USER_PORT}"
    
    # Cleanup
    cleanup_old_images
    
    # Final status
    log_success "Deployment completed successfully! 🚀"
    log_info "Admin API: http://localhost:${ADMIN_PORT}"
    log_info "User API: http://localhost:${USER_PORT}"
    
    # Show running containers
    echo ""
    log_info "Running containers:"
    docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" ps
}

# =========================================
# Rollback Function
# =========================================
rollback() {
    local previous_version="${1:-}"
    
    if [ -z "${previous_version}" ]; then
        log_error "Please specify previous version for rollback"
        exit 1
    fi
    
    log_warning "Rolling back to version ${previous_version}..."
    
    export IMAGE_TAG="${previous_version}"
    
    docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" pull
    docker-compose -f "${COMPOSE_FILE}" --env-file "${ENV_FILE}" up -d
    
    log_success "Rollback completed"
}

# =========================================
# Script Entry Point
# =========================================
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    case "${1:-deploy}" in
        deploy)
            main
            ;;
        rollback)
            rollback "${2:-}"
            ;;
        *)
            echo "Usage: $0 {deploy|rollback} [version]"
            echo ""
            echo "Examples:"
            echo "  $0 deploy v1.0.0"
            echo "  $0 rollback v0.9.0"
            exit 1
            ;;
    esac
fi
