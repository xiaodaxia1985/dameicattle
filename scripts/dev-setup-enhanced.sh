#!/bin/bash

# Enhanced Cross-Platform Development Environment Setup Script
# Supports Linux and macOS with comprehensive error handling

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MIN_NODE_VERSION=18
MIN_DOCKER_VERSION=20
MIN_DOCKER_COMPOSE_VERSION=2
PROJECT_NAME="cattle-management-system"

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Error handling
handle_error() {
    local exit_code=$?
    local line_number=$1
    log_error "Setup failed at line $line_number with exit code $exit_code"
    log_error "Please check the error messages above and try again"
    exit $exit_code
}

trap 'handle_error $LINENO' ERR

# Platform detection
detect_platform() {
    case "$(uname -s)" in
        Linux*)     PLATFORM=Linux;;
        Darwin*)    PLATFORM=Mac;;
        CYGWIN*)    PLATFORM=Cygwin;;
        MINGW*)     PLATFORM=MinGw;;
        *)          PLATFORM="UNKNOWN:$(uname -s)"
    esac
    log_info "Detected platform: $PLATFORM"
}

# Version comparison function
version_compare() {
    local version1=$1
    local version2=$2
    if [[ "$(printf '%s\n' "$version1" "$version2" | sort -V | head -n1)" == "$version2" ]]; then
        return 0
    else
        return 1
    fi
}

# Check system requirements
check_system_requirements() {
    log_info "Checking system requirements..."
    
    # Check if running as root (not recommended)
    if [[ $EUID -eq 0 ]]; then
        log_warning "Running as root is not recommended for development"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Check available disk space (minimum 5GB)
    local available_space=$(df . | tail -1 | awk '{print $4}')
    local min_space=5242880  # 5GB in KB
    
    if [[ $available_space -lt $min_space ]]; then
        log_error "Insufficient disk space. Need at least 5GB free space"
        exit 1
    fi
    
    log_success "System requirements check passed"
}

# Check Node.js installation and version
check_nodejs() {
    log_info "Checking Node.js installation..."
    
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        log_info "Please install Node.js $MIN_NODE_VERSION+ from https://nodejs.org/"
        
        # Offer to install Node.js on macOS using Homebrew
        if [[ $PLATFORM == "Mac" ]] && command -v brew &> /dev/null; then
            read -p "Install Node.js using Homebrew? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                brew install node
            else
                exit 1
            fi
        else
            exit 1
        fi
    fi
    
    local node_version=$(node -v | sed 's/v//')
    local node_major=$(echo $node_version | cut -d'.' -f1)
    
    if [[ $node_major -lt $MIN_NODE_VERSION ]]; then
        log_error "Node.js version $node_version is too old. Need version $MIN_NODE_VERSION+"
        exit 1
    fi
    
    log_success "Node.js version $node_version is compatible"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    local npm_version=$(npm -v)
    log_success "npm version $npm_version found"
}

# Check Docker installation and version
check_docker() {
    log_info "Checking Docker installation..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        log_info "Please install Docker from https://docs.docker.com/get-docker/"
        
        # Offer installation suggestions based on platform
        case $PLATFORM in
            Mac)
                log_info "For macOS: Download Docker Desktop from https://www.docker.com/products/docker-desktop"
                ;;
            Linux)
                log_info "For Ubuntu/Debian: sudo apt-get install docker.io docker-compose"
                log_info "For CentOS/RHEL: sudo yum install docker docker-compose"
                ;;
        esac
        exit 1
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running"
        log_info "Please start Docker and try again"
        exit 1
    fi
    
    local docker_version=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    local docker_major=$(echo $docker_version | cut -d'.' -f1)
    
    if [[ $docker_major -lt $MIN_DOCKER_VERSION ]]; then
        log_error "Docker version $docker_version is too old. Need version $MIN_DOCKER_VERSION+"
        exit 1
    fi
    
    log_success "Docker version $docker_version is compatible"
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        local compose_version=$(docker-compose --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
        log_success "Docker Compose version $compose_version found"
    elif docker compose version &> /dev/null; then
        local compose_version=$(docker compose version --short)
        log_success "Docker Compose (plugin) version $compose_version found"
    else
        log_error "Docker Compose is not installed"
        exit 1
    fi
}

# Check additional tools
check_additional_tools() {
    log_info "Checking additional development tools..."
    
    # Check git
    if ! command -v git &> /dev/null; then
        log_warning "Git is not installed. Some features may not work properly"
    else
        local git_version=$(git --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
        log_success "Git version $git_version found"
    fi
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        log_warning "curl is not installed. Some scripts may not work properly"
    fi
    
    # Check jq (useful for JSON processing)
    if ! command -v jq &> /dev/null; then
        log_info "jq is not installed (optional but recommended for JSON processing)"
        
        case $PLATFORM in
            Mac)
                if command -v brew &> /dev/null; then
                    read -p "Install jq using Homebrew? (y/N): " -n 1 -r
                    echo
                    if [[ $REPLY =~ ^[Yy]$ ]]; then
                        brew install jq
                    fi
                fi
                ;;
            Linux)
                log_info "Install with: sudo apt-get install jq (Ubuntu/Debian) or sudo yum install jq (CentOS/RHEL)"
                ;;
        esac
    fi
}

# Create project directories
create_directories() {
    log_info "Creating project directories..."
    
    local directories=(
        "backend/logs"
        "backend/uploads"
        "backend/uploads/temp"
        "backend/uploads/cattle"
        "backend/uploads/documents"
        "frontend/dist"
        "miniprogram/dist"
        "nginx/ssl"
        "nginx/cache"
        "data/postgres"
        "data/redis"
        "logs/backend"
        "logs/frontend"
        "logs/nginx"
        "logs/monitoring"
        "monitoring/data"
        "scripts/backup"
        "scripts/logs"
    )
    
    for dir in "${directories[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            log_success "Created directory: $dir"
        fi
    done
    
    # Set appropriate permissions
    chmod +x scripts/*.sh 2>/dev/null || true
    chmod 755 backend/uploads 2>/dev/null || true
    chmod 755 logs 2>/dev/null || true
}

# Setup environment files
setup_environment_files() {
    log_info "Setting up environment configuration files..."
    
    # Backend environment
    if [[ ! -f "backend/.env" ]]; then
        if [[ -f "backend/.env.development" ]]; then
            cp "backend/.env.development" "backend/.env"
            log_success "Created backend/.env from development template"
        else
            log_warning "backend/.env.development template not found"
        fi
    else
        log_info "backend/.env already exists"
    fi
    
    # Frontend environment
    if [[ ! -f "frontend/.env" ]]; then
        cat > "frontend/.env" << EOF
# Frontend Development Environment
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_APP_TITLE=肉牛管理系统
VITE_APP_VERSION=1.0.0
VITE_ENABLE_MOCK=false
VITE_ENABLE_DEVTOOLS=true
EOF
        log_success "Created frontend/.env"
    else
        log_info "frontend/.env already exists"
    fi
    
    # Docker environment
    if [[ ! -f ".env" ]]; then
        cat > ".env" << EOF
# Docker Development Environment
COMPOSE_PROJECT_NAME=$PROJECT_NAME
POSTGRES_PASSWORD=dianxin99
POSTGRES_REPLICATION_PASSWORD=replication123
JWT_SECRET=your-jwt-secret-key-change-in-production
GRAFANA_PASSWORD=admin123
NODE_ENV=development
EOF
        log_success "Created .env for Docker"
    else
        log_info ".env already exists"
    fi
}

# Install dependencies
install_dependencies() {
    log_info "Installing project dependencies..."
    
    # Root dependencies
    if [[ -f "package.json" ]]; then
        log_info "Installing root dependencies..."
        npm install
        log_success "Root dependencies installed"
    fi
    
    # Backend dependencies
    if [[ -f "backend/package.json" ]]; then
        log_info "Installing backend dependencies..."
        cd backend
        npm install
        cd ..
        log_success "Backend dependencies installed"
    fi
    
    # Frontend dependencies
    if [[ -f "frontend/package.json" ]]; then
        log_info "Installing frontend dependencies..."
        cd frontend
        npm install
        cd ..
        log_success "Frontend dependencies installed"
    fi
    
    # Miniprogram dependencies
    if [[ -f "miniprogram/package.json" ]]; then
        log_info "Installing miniprogram dependencies..."
        cd miniprogram
        npm install
        cd ..
        log_success "Miniprogram dependencies installed"
    fi
}

# Setup database
setup_database() {
    log_info "Setting up database..."
    
    # Start database services
    log_info "Starting database services..."
    docker-compose up -d postgres redis
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if docker-compose exec -T postgres pg_isready -U cattle_user -d cattle_management &> /dev/null; then
            log_success "Database is ready"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            log_error "Database failed to start after $max_attempts attempts"
            exit 1
        fi
        
        log_info "Waiting for database... (attempt $attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    # Initialize database
    if [[ -f "backend/package.json" ]]; then
        log_info "Initializing database schema..."
        cd backend
        npm run db:setup || log_warning "Database setup failed - may need manual initialization"
        cd ..
    fi
}

# Validate installation
validate_installation() {
    log_info "Validating installation..."
    
    # Check if services can start
    log_info "Testing service startup..."
    
    # Test backend
    if [[ -f "backend/package.json" ]]; then
        cd backend
        timeout 10s npm run dev &> /dev/null &
        local backend_pid=$!
        sleep 5
        if kill -0 $backend_pid 2>/dev/null; then
            kill $backend_pid
            log_success "Backend can start successfully"
        else
            log_warning "Backend startup test failed"
        fi
        cd ..
    fi
    
    # Test frontend
    if [[ -f "frontend/package.json" ]]; then
        cd frontend
        timeout 10s npm run dev &> /dev/null &
        local frontend_pid=$!
        sleep 5
        if kill -0 $frontend_pid 2>/dev/null; then
            kill $frontend_pid
            log_success "Frontend can start successfully"
        else
            log_warning "Frontend startup test failed"
        fi
        cd ..
    fi
}

# Generate development guide
generate_dev_guide() {
    log_info "Generating development guide..."
    
    cat > "DEVELOPMENT_GUIDE.md" << 'EOF'
# Development Environment Guide

## Quick Start

### Start All Services
```bash
npm run dev:all
```

### Start Individual Services
```bash
npm run dev:backend    # Backend API (Port 3000)
npm run dev:frontend   # Frontend Web (Port 5173)
npm run dev:miniprogram # WeChat Miniprogram
```

### Using Docker
```bash
npm run dev:docker     # Start all services with Docker
npm run docker:logs    # View logs
npm run docker:down    # Stop all services
```

## Available Commands

### Development
- `npm run dev:all` - Start backend and frontend
- `npm run dev:backend` - Start backend only
- `npm run dev:frontend` - Start frontend only
- `npm run dev:miniprogram` - Start miniprogram development
- `npm run dev:docker` - Start with Docker Compose

### Testing
- `npm run test:all` - Run all tests
- `npm run test:backend` - Run backend tests
- `npm run test:frontend` - Run frontend tests
- `npm run test:watch` - Run tests in watch mode

### Building
- `npm run build:all` - Build all components
- `npm run build:backend` - Build backend
- `npm run build:frontend` - Build frontend
- `npm run build:miniprogram` - Build miniprogram

### Database
- `npm run db:setup` - Initialize database
- `npm run db:reset` - Reset database
- `npm run db:backup` - Backup database
- `npm run db:restore` - Restore database

### Code Quality
- `npm run lint:all` - Lint all code
- `npm run lint:fix:all` - Fix linting issues
- `npm run format:all` - Format all code

## Service URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Database Admin: http://localhost:8080
- API Documentation: http://localhost:3000/api/docs

## Troubleshooting

### Port Conflicts
If you encounter port conflicts, check what's running on the ports:
```bash
lsof -i :3000  # Backend
lsof -i :5173  # Frontend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
```

### Database Issues
```bash
# Reset database
npm run db:reset

# Check database status
docker-compose ps postgres

# View database logs
docker-compose logs postgres
```

### Permission Issues
```bash
# Fix file permissions
chmod +x scripts/*.sh
chmod 755 backend/uploads
chmod 755 logs
```

### Clean Installation
```bash
# Clean all dependencies and reinstall
npm run clean:all
npm install
npm run setup
```

## Environment Variables

### Backend (.env)
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `REDIS_HOST` - Redis host
- `REDIS_PORT` - Redis port
- `JWT_SECRET` - JWT secret key
- `PORT` - Server port

### Frontend (.env)
- `VITE_API_BASE_URL` - Backend API URL
- `VITE_APP_TITLE` - Application title
- `VITE_ENABLE_MOCK` - Enable mock data

## Hot Reload

All components support hot reload:
- Backend: Uses nodemon for automatic restart
- Frontend: Uses Vite HMR
- Miniprogram: Uses uni-app watch mode

## Docker Development

The Docker setup includes:
- PostgreSQL database
- Redis cache
- Backend API service
- Frontend web service
- Nginx reverse proxy
- Adminer database management

Start with: `npm run dev:docker`
EOF
    
    log_success "Development guide created: DEVELOPMENT_GUIDE.md"
}

# Main setup function
main() {
    echo "🚀 Starting Enhanced Development Environment Setup for $PROJECT_NAME"
    echo "=================================================================="
    
    detect_platform
    check_system_requirements
    check_nodejs
    check_docker
    check_additional_tools
    create_directories
    setup_environment_files
    install_dependencies
    setup_database
    validate_installation
    generate_dev_guide
    
    echo "=================================================================="
    log_success "Development environment setup completed successfully!"
    echo ""
    log_info "Next steps:"
    echo "  1. Review DEVELOPMENT_GUIDE.md for detailed instructions"
    echo "  2. Run 'npm run dev:all' to start all services"
    echo "  3. Visit http://localhost:5173 for the frontend"
    echo "  4. Visit http://localhost:3000 for the backend API"
    echo ""
    log_info "For troubleshooting, run: ./scripts/dev-health-check.sh"
}

# Run main function
main "$@"