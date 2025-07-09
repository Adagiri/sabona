#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
POSTGRES_VOLUME="sabonah_postgres_data"
REDIS_VOLUME="sabonah_redis_data"
APP_PORT="3001"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[DEV]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if volumes exist and create them
setup_volumes() {
    print_status "Setting up Docker volumes..."
    
    if ! docker volume inspect $POSTGRES_VOLUME >/dev/null 2>&1; then
        print_status "Creating PostgreSQL volume: $POSTGRES_VOLUME"
        docker volume create $POSTGRES_VOLUME
    else
        print_success "PostgreSQL volume already exists"
    fi
    
    if ! docker volume inspect $REDIS_VOLUME >/dev/null 2>&1; then
        print_status "Creating Redis volume: $REDIS_VOLUME"
        docker volume create $REDIS_VOLUME
    else
        print_success "Redis volume already exists"
    fi
}

# Function to start services
start_services() {
    print_status "Starting development environment..."
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop or Docker daemon."
        exit 1
    fi
    
    # Setup volumes
    setup_volumes
    
    # Start Docker Compose services
    print_status "Starting Docker services..."
    if docker-compose up -d; then
        print_success "Docker services started successfully"
    else
        print_error "Failed to start Docker services"
        exit 1
    fi
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 5
    
    # Check PostgreSQL
    print_status "Checking PostgreSQL connection..."
    if docker exec sabonah.db pg_isready -U sabonah_postgres >/dev/null 2>&1; then
        print_success "PostgreSQL is ready"
    else
        print_warning "PostgreSQL might still be starting up"
    fi
    
    # Check Redis
    print_status "Checking Redis connection..."
    if docker exec sabonah.redis redis-cli ping >/dev/null 2>&1; then
        print_success "Redis is ready"
    else
        print_warning "Redis might still be starting up"
    fi
    
    # Show service URLs
    echo ""
    print_success "Development environment is ready!"
    echo ""
    echo "📊 Service URLs:"
    echo "   🗄️  PostgreSQL:     localhost:5432"
    echo "   🔴 Redis:           localhost:6379"
    echo "   🔧 pgAdmin:         http://localhost:8080 (admin@sabonah.com / admin123)"
    echo "   📱 Redis GUI:       http://localhost:8081"
    echo ""
    echo "🚀 To start your app:"
    echo "   pnpm run start:dev"
    echo ""
    echo "📝 Database commands:"
    echo "   pnpm run db:generate  # Generate Prisma client"
    echo "   pnpm run db:migrate   # Run migrations"
    echo ""
}

# Function to stop services
stop_services() {
    print_status "Stopping development environment..."
    
    # Stop Node.js app if running on the specified port
    if lsof -Pi :$APP_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_status "Stopping Node.js app on port $APP_PORT..."
        pkill -f "node.*$APP_PORT" 2>/dev/null || true
        pkill -f "nest start" 2>/dev/null || true
        pkill -f "pnpm.*start:dev" 2>/dev/null || true
        pkill -f "pnpm run start:dev" 2>/dev/null || true
        print_success "Node.js app stopped"
    fi
    
    # Stop Docker services
    print_status "Stopping Docker services..."
    if docker-compose down; then
        print_success "Docker services stopped successfully"
    else
        print_warning "Some issues occurred while stopping Docker services"
    fi
    
    print_success "Development environment stopped"
}

# Function to restart services
restart_services() {
    print_status "Restarting development environment..."
    stop_services
    sleep 2
    start_services
}

# Function to show status
show_status() {
    print_status "Development environment status:"
    echo ""
    
    # Docker services status
    if docker-compose ps 2>/dev/null; then
        echo ""
    else
        print_warning "Docker services are not running"
    fi
    
    # Check if app is running
    if lsof -Pi :$APP_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_success "Node.js app is running on port $APP_PORT"
    else
        print_warning "Node.js app is not running on port $APP_PORT"
    fi
    
    echo ""
    echo "📊 Service URLs:"
    echo "   🔧 pgAdmin:         http://localhost:8080"
    echo "   📱 Redis GUI:       http://localhost:8081"
    echo ""
}

# Function to start the application
start_app() {
    print_status "Starting Sabonah application..."
    
    # Check if Docker services are running first
    if ! docker-compose ps | grep -q "Up"; then
        print_error "Docker services are not running. Please run './dev.sh start' first."
        exit 1
    fi
    
    # Check if app is already running
    if lsof -Pi :$APP_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Application is already running on port $APP_PORT"
        return
    fi
    
    # Check if node_modules exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        pnpm install
    fi
    
    # Generate Prisma client if needed
    print_status "Generating Prisma client..."
    pnpm run db:generate
    
    # Run migrations
    print_status "Running database migrations..."
    pnpm run db:migrate
    
    # Start the application
    print_success "Starting application in development mode..."
    echo ""
    print_status "🚀 Application starting on http://localhost:$APP_PORT"
    print_status "📖 API Docs available at http://localhost:$APP_PORT/v1/api"
    echo ""
    pnpm run start:dev
}

# Function to build for production (testing)
build_app() {
    print_status "Building Sabonah application for production..."
    
    # Check if node_modules exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        pnpm install
    fi
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    pnpm run db:generate
    
    # Build the application
    print_status "Building application..."
    pnpm run build
    
    print_success "Build completed! Built files are in ./dist/"
    echo ""
    echo "🚀 To test production build:"
    echo "   pnpm run start:prod"
}

# Function to start everything (Docker + App)
start_full() {
    start_services
    echo ""
    print_status "Now starting the application..."
    sleep 3
    start_app
}

# Function to clean up (remove volumes)
cleanup() {
    print_warning "This will remove all data volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Cleaning up..."
        stop_services
        
        print_status "Removing volumes..."
        docker volume rm $POSTGRES_VOLUME $REDIS_VOLUME 2>/dev/null || true
        docker volume rm backend_pgadmin_data 2>/dev/null || true
        
        print_success "Cleanup completed"
    else
        print_status "Cleanup cancelled"
    fi
}

# Function to show help
show_help() {
    echo "Development Environment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start the development environment (Docker services only)"
    echo "  stop      Stop the development environment"
    echo "  restart   Restart the development environment"
    echo "  app       Start the Sabonah application (requires Docker services to be running)"
    echo "  dev       Start everything (Docker services + Sabonah application)"
    echo "  build     Build the application for production (testing)"
    echo "  status    Show current status"
    echo "  cleanup   Remove all data volumes (⚠️  DELETES ALL DATA)"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start    # Start PostgreSQL, Redis, pgAdmin, Redis GUI"
    echo "  $0 app      # Start the Sabonah NestJS application"
    echo "  $0 dev      # Start everything at once"
    echo "  $0 build    # Test production build locally"
    echo ""
    echo "If no command is provided, 'start' is assumed."
}

# Main script logic
case ${1:-start} in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    app)
        start_app
        ;;
    dev)
        start_full
        ;;
    build)
        build_app
        ;;
    status)
        show_status
        ;;
    cleanup)
        cleanup
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac