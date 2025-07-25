#!/bin/bash

# Hot Reload Development Server Script
# Starts all components with hot reload enabled

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="cattle-management-system"
BACKEND_PORT=3000
FRONTEND_PORT=5173
MINIPROGRAM_PORT=8080

# PID tracking
PIDS=()
SERVICES=()

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

# Cleanup function
cleanup() {
    log_info "Shutting down services..."
    
    for i in "${!PIDS[@]}"; do
        local pid=${PIDS[$i]}
        local service=${SERVICES[$i]}
        
        if kill -0 $pid 2>/dev/null; then
            log_info "Stopping $service (PID: $pid)"
            kill -TERM $pid 2>/dev/null || true
            
            # Wait for graceful shutdown
            local count=0
            while kill -0 $pid 2>/dev/null && [ $count -lt 10 ]; do
                sleep 1
                ((count++))
            done
            
            # Force kill if still running
            if kill -0 $pid 2>/dev/null; then
                log_warning "Force killing $service"
                kill -KILL $pid 2>/dev/null || true
            fi
        fi
    done
    
    log_success "All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if port is available
check_port() {
    local port=$1
    local service=$2
    
    if lsof -i :$port >/dev/null 2>&1; then
        log_error "Port $port is already in use (needed for $service)"
        log_info "Kill the process using: lsof -ti :$port | xargs kill -9"
        return 1
    fi
    return 0
}

# Start backend with hot reload
start_backend() {
    log_info "Starting backend with hot reload..."
    
    if [[ ! -f "backend/package.json" ]]; then
        log_error "Backend package.json not found"
        return 1
    fi
    
    if ! check_port $BACKEND_PORT "Backend"; then
        return 1
    fi
    
    cd backend
    
    # Ensure nodemon is installed
    if ! npm list nodemon >/dev/null 2>&1; then
        log_info "Installing nodemon for hot reload..."
        npm install --save-dev nodemon
    fi
    
    # Create nodemon configuration if it doesn't exist
    if [[ ! -f "nodemon.json" ]]; then
        cat > nodemon.json << 'EOF'
{
  "watch": ["src"],
  "ext": "ts,js,json",
  "ignore": ["src/**/*.test.ts", "src/**/*.spec.ts", "dist/**/*", "node_modules/**/*"],
  "exec": "ts-node -r tsconfig-paths/register src/app.ts",
  "env": {
    "NODE_ENV": "development",
    "DEBUG": "app:*"
  },
  "delay": 1000,
  "verbose": true
}
EOF
        log_success "Created nodemon.json configuration"
    fi
    
    # Start backend with nodemon
    npm run dev &
    local backend_pid=$!
    cd ..
    
    PIDS+=($backend_pid)
    SERVICES+=("Backend")
    
    # Wait for backend to start
    local count=0
    while ! curl -s http://localhost:$BACKEND_PORT/health >/dev/null 2>&1 && [ $count -lt 30 ]; do
        sleep 1
        ((count++))
    done
    
    if curl -s http://localhost:$BACKEND_PORT/health >/dev/null 2>&1; then
        log_success "Backend started with hot reload on port $BACKEND_PORT"
    else
        log_warning "Backend may not have started properly"
    fi
}

# Start frontend with hot reload
start_frontend() {
    log_info "Starting frontend with hot reload..."
    
    if [[ ! -f "frontend/package.json" ]]; then
        log_error "Frontend package.json not found"
        return 1
    fi
    
    if ! check_port $FRONTEND_PORT "Frontend"; then
        return 1
    fi
    
    cd frontend
    
    # Create or update Vite configuration for optimal hot reload
    if [[ ! -f "vite.config.ts" ]] || ! grep -q "hmr" vite.config.ts; then
        log_info "Updating Vite configuration for hot reload..."
        
        # Backup existing config
        [[ -f "vite.config.ts" ]] && cp vite.config.ts vite.config.ts.backup
        
        cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    open: false,
    hmr: {
      overlay: true,
      clientPort: 5173,
    },
    watch: {
      usePolling: true,
      interval: 1000,
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          elementPlus: ['element-plus'],
        },
      },
    },
  },
})
EOF
        log_success "Updated Vite configuration for hot reload"
    fi
    
    # Start frontend with Vite
    npm run dev &
    local frontend_pid=$!
    cd ..
    
    PIDS+=($frontend_pid)
    SERVICES+=("Frontend")
    
    # Wait for frontend to start
    local count=0
    while ! curl -s http://localhost:$FRONTEND_PORT >/dev/null 2>&1 && [ $count -lt 30 ]; do
        sleep 1
        ((count++))
    done
    
    if curl -s http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
        log_success "Frontend started with hot reload on port $FRONTEND_PORT"
    else
        log_warning "Frontend may not have started properly"
    fi
}

# Start miniprogram with hot reload
start_miniprogram() {
    log_info "Starting miniprogram with hot reload..."
    
    if [[ ! -f "miniprogram/package.json" ]]; then
        log_error "Miniprogram package.json not found"
        return 1
    fi
    
    cd miniprogram
    
    # Update vue.config.js for better hot reload
    if [[ ! -f "vue.config.js" ]] || ! grep -q "watchOptions" vue.config.js; then
        log_info "Updating vue.config.js for hot reload..."
        
        # Backup existing config
        [[ -f "vue.config.js" ]] && cp vue.config.js vue.config.js.backup
        
        cat > vue.config.js << 'EOF'
const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  
  // Configure webpack for better hot reload
  configureWebpack: {
    watchOptions: {
      poll: 1000,
      aggregateTimeout: 300,
      ignored: /node_modules/,
    },
    devtool: 'eval-cheap-module-source-map',
  },
  
  // Disable host check for development
  devServer: {
    disableHostCheck: true,
    watchOptions: {
      poll: true,
    },
  },
  
  // uni-app specific configuration
  pluginOptions: {
    'uni-app': {
      // Enable hot reload for uni-app
      hotReload: true,
    },
  },
})
EOF
        log_success "Updated vue.config.js for hot reload"
    fi
    
    # Start miniprogram in watch mode
    npm run dev:mp-weixin &
    local miniprogram_pid=$!
    cd ..
    
    PIDS+=($miniprogram_pid)
    SERVICES+=("Miniprogram")
    
    log_success "Miniprogram started with hot reload (watch mode)"
}

# Monitor services
monitor_services() {
    log_info "Monitoring services for changes..."
    log_info "Press Ctrl+C to stop all services"
    
    while true; do
        # Check if all services are still running
        local running_count=0
        
        for i in "${!PIDS[@]}"; do
            local pid=${PIDS[$i]}
            local service=${SERVICES[$i]}
            
            if kill -0 $pid 2>/dev/null; then
                ((running_count++))
            else
                log_warning "$service has stopped unexpectedly"
            fi
        done
        
        if [[ $running_count -eq 0 ]]; then
            log_error "All services have stopped"
            break
        fi
        
        sleep 5
    done
}

# Display service information
show_service_info() {
    echo ""
    log_success "Hot reload development environment is running!"
    echo ""
    echo "🌐 Service URLs:"
    echo "  Frontend:     http://localhost:$FRONTEND_PORT"
    echo "  Backend API:  http://localhost:$BACKEND_PORT"
    echo "  API Health:   http://localhost:$BACKEND_PORT/health"
    echo "  API Docs:     http://localhost:$BACKEND_PORT/api/docs"
    echo ""
    echo "🔥 Hot Reload Features:"
    echo "  ✅ Backend: Automatic restart on TypeScript/JavaScript changes"
    echo "  ✅ Frontend: Vite HMR with instant updates"
    echo "  ✅ Miniprogram: Watch mode for uni-app development"
    echo ""
    echo "📁 Watched Directories:"
    echo "  Backend:     backend/src/**/*"
    echo "  Frontend:    frontend/src/**/*"
    echo "  Miniprogram: miniprogram/src/**/*"
    echo ""
    echo "🛠️  Development Tips:"
    echo "  - Changes are automatically detected and applied"
    echo "  - Check browser console for HMR status"
    echo "  - Use browser dev tools for debugging"
    echo "  - Logs are displayed in this terminal"
    echo ""
}

# Main function
main() {
    echo "🔥 Starting Hot Reload Development Environment for $PROJECT_NAME"
    echo "================================================================="
    
    # Check prerequisites
    log_info "Checking prerequisites..."
    
    if ! command -v node >/dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm >/dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Start database services if not running
    if command -v docker-compose >/dev/null; then
        log_info "Starting database services..."
        docker-compose up -d postgres redis >/dev/null 2>&1 || log_warning "Failed to start database services"
    fi
    
    # Start services based on arguments or start all
    case "${1:-all}" in
        "backend")
            start_backend
            ;;
        "frontend")
            start_frontend
            ;;
        "miniprogram")
            start_miniprogram
            ;;
        "all"|*)
            start_backend
            sleep 2
            start_frontend
            sleep 2
            start_miniprogram
            ;;
    esac
    
    # Show service information
    show_service_info
    
    # Monitor services
    monitor_services
}

# Show usage if help requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Hot Reload Development Server"
    echo ""
    echo "Usage: $0 [service]"
    echo ""
    echo "Services:"
    echo "  all         Start all services (default)"
    echo "  backend     Start only backend with hot reload"
    echo "  frontend    Start only frontend with hot reload"
    echo "  miniprogram Start only miniprogram with hot reload"
    echo ""
    echo "Examples:"
    echo "  $0              # Start all services"
    echo "  $0 backend      # Start only backend"
    echo "  $0 frontend     # Start only frontend"
    echo ""
    exit 0
fi

# Run main function
main "$@"