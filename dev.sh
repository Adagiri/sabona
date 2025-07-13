#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
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

# Function to check environment configuration
check_environment() {
    print_status "Checking environment configuration..."
    
    # Check if .env file exists
    if [ ! -f ".env" ]; then
        print_error ".env file not found!"
        echo ""
        echo "📋 Create a .env file with the following variables:"
        echo "   APP_ENV=test"
        echo "   APP_AWS_ACCESS_KEY=your_access_key"
        echo "   APP_AWS_SECRET_KEY=your_secret_key"
        echo ""
        echo "💡 All other configuration is loaded from AWS Secrets Manager and Parameter Store"
        exit 1
    fi
    
    # Check required environment variables
    if ! grep -q "APP_ENV=" .env; then
        print_error "APP_ENV not found in .env file"
        exit 1
    fi
    
    if ! grep -q "APP_AWS_ACCESS_KEY=" .env; then
        print_warning "APP_AWS_ACCESS_KEY not found in .env file"
        echo "   This is needed to fetch configuration from AWS"
    fi
    
    APP_ENV=$(grep "APP_ENV=" .env | cut -d '=' -f2)
    print_success "Environment configured for: $APP_ENV"
}

# Function to test cloud services connectivity
test_connections() {
    print_status "Testing cloud services connectivity..."
    
    # This would require the app to be built, so we'll skip detailed testing
    # and just check basic AWS connectivity if AWS CLI is available
    if command -v aws >/dev/null 2>&1; then
        print_status "Testing AWS connectivity..."
        if aws sts get-caller-identity >/dev/null 2>&1; then
            print_success "AWS connectivity confirmed"
        else
            print_warning "Could not verify AWS connectivity (credentials may not be configured)"
        fi
    else
        print_status "AWS CLI not found - skipping connectivity test"
    fi
    
    print_success "Cloud services check completed"
}

# Function to setup the application
setup_app() {
    print_status "Setting up Sabonah application..."
    
    # Check environment first
    check_environment
    
    # Check if node_modules exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        if command -v pnpm >/dev/null 2>&1; then
            pnpm install
        elif command -v npm >/dev/null 2>&1; then
            npm install
        else
            print_error "Neither pnpm nor npm found. Please install Node.js and pnpm"
            exit 1
        fi
        print_success "Dependencies installed"
    else
        print_success "Dependencies already installed"
    fi
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    if command -v pnpm >/dev/null 2>&1; then
        pnpm run db:generate
    else
        npm run db:generate
    fi
    print_success "Prisma client generated"
    
    # Test cloud connectivity
    test_connections
    
    print_success "Application setup completed!"
    echo ""
    echo "☁️ Cloud Services:"
    echo "   🗄️  Database: AWS RDS PostgreSQL (configured via AWS)"
    echo "   🔴 Redis: Redis Cloud (configured via AWS)"
    echo "   🔐 Config: AWS Secrets Manager + Parameter Store"
    echo ""
    echo "🚀 To start your application:"
    if command -v pnpm >/dev/null 2>&1; then
        echo "   pnpm run start:dev   # Development mode with hot reload"
        echo "   pnpm run start:prod  # Production mode"
    else
        echo "   npm run start:dev    # Development mode with hot reload"
        echo "   npm run start:prod   # Production mode"
    fi
    echo ""
    echo "📖 Your app will be available at:"
    echo "   http://localhost:$APP_PORT"
    echo "   http://localhost:$APP_PORT/v1/api (API Documentation)"
    echo ""
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    check_environment
    
    if command -v pnpm >/dev/null 2>&1; then
        pnpm run db:migrate
    else
        npm run db:migrate
    fi
    
    print_success "Database migrations completed"
}

# Function to start the application
start_app() {
    print_status "Starting Sabonah application..."
    
    # Check if app is already running
    if lsof -Pi :$APP_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Application is already running on port $APP_PORT"
        echo "Use './dev.sh stop' to stop it first"
        exit 1
    fi
    
    check_environment
    
    # Start the application
    print_status "Starting application in development mode..."
    if command -v pnpm >/dev/null 2>&1; then
        pnpm run start:dev
    else
        npm run start:dev
    fi
}

# Function to stop the application
stop_app() {
    print_status "Stopping Sabonah application..."
    
    # Stop Node.js app if running on the specified port
    if lsof -Pi :$APP_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_status "Stopping Node.js app on port $APP_PORT..."
        pkill -f "node.*$APP_PORT" 2>/dev/null || true
        pkill -f "nest start" 2>/dev/null || true
        pkill -f "pnpm.*start:dev" 2>/dev/null || true
        pkill -f "npm.*start:dev" 2>/dev/null || true
        sleep 2
        print_success "Application stopped"
    else
        print_warning "No application found running on port $APP_PORT"
    fi
}

# Function to build for production
build_app() {
    print_status "Building Sabonah application for production..."
    
    check_environment
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    if command -v pnpm >/dev/null 2>&1; then
        pnpm run db:generate
        print_status "Building application..."
        pnpm run build
    else
        npm run db:generate
        print_status "Building application..."
        npm run build
    fi
    
    print_success "Build completed! Built files are in ./dist/"
    echo ""
    echo "🚀 To test production build:"
    if command -v pnpm >/dev/null 2>&1; then
        echo "   pnpm run start:prod"
    else
        echo "   npm run start:prod"
    fi
}

# Function to show status
show_status() {
    print_status "Application status:"
    echo ""
    
    # Check environment
    if [ -f ".env" ]; then
        APP_ENV=$(grep "APP_ENV=" .env | cut -d '=' -f2)
        print_success "Environment: $APP_ENV"
    else
        print_error ".env file not found"
    fi
    
    # Check if app is running
    if lsof -Pi :$APP_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_success "Application is running on port $APP_PORT"
        echo "   🌐 App URL: http://localhost:$APP_PORT"
        echo "   📖 API Docs: http://localhost:$APP_PORT/v1/api"
    else
        print_warning "Application is not running"
    fi
    
    # Check dependencies
    if [ -d "node_modules" ]; then
        print_success "Dependencies installed"
    else
        print_warning "Dependencies not installed (run './dev.sh setup')"
    fi
    
    echo ""
    echo "☁️ Cloud Services:"
    echo "   🗄️  Database: AWS RDS PostgreSQL"
    echo "   🔴 Redis: Redis Cloud"
    echo "   🔐 Configuration: AWS Secrets Manager + Parameter Store"
    echo ""
}

# Function to show logs
show_logs() {
    print_status "Application logs:"
    echo ""
    echo "💡 For real-time logs, run your application with:"
    if command -v pnpm >/dev/null 2>&1; then
        echo "   pnpm run start:dev"
    else
        echo "   npm run start:dev"
    fi
    echo ""
    echo "📊 For production logs, check:"
    echo "   • Application logs in your terminal"
    echo "   • AWS CloudWatch logs (if configured)"
    echo "   • App Runner logs (for production deployment)"
}

# Function to show help
show_help() {
    echo "Sabonah Development Script (Cloud Services)"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup     Setup the application (install deps, generate Prisma client)"
    echo "  migrate   Run database migrations"
    echo "  start     Start the application in development mode"
    echo "  stop      Stop the running application"
    echo "  build     Build the application for production"
    echo "  status    Show current application status"
    echo "  logs      Show information about application logs"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup           # Setup application dependencies"
    echo "  $0 migrate         # Run database migrations"
    echo "  $0 start           # Start in development mode"
    echo "  $0 build           # Build for production"
    echo ""
    echo "Typical workflow:"
    echo "  1. Create .env file with APP_ENV and AWS credentials"
    echo "  2. $0 setup        # Setup dependencies and Prisma"
    echo "  3. $0 migrate      # Run database migrations"
    echo "  4. $0 start        # Start the application"
    echo ""
    echo "📋 Required .env variables:"
    echo "  APP_ENV=test"
    echo "  APP_AWS_ACCESS_KEY=your_key"
    echo "  APP_AWS_SECRET_KEY=your_secret"
    echo ""
    echo "💡 All other configuration is loaded from AWS cloud services"
    echo ""
    echo "If no command is provided, 'setup' is assumed."
}

# Main script logic
case ${1:-setup} in
    setup)
        setup_app
        ;;
    migrate)
        run_migrations
        ;;
    start)
        start_app
        ;;
    stop)
        stop_app
        ;;
    build)
        build_app
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
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