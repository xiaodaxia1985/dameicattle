# Development Environment Setup Guide

This guide provides comprehensive instructions for setting up the cattle management system development environment across different platforms.

## Quick Start

### Automated Setup (Recommended)

**Windows:**
```cmd
scripts\dev-setup-enhanced.bat
```

**Linux/macOS:**
```bash
bash scripts/dev-setup-enhanced.sh
```

### Manual Setup

1. **Prerequisites Check:**
   - Node.js 18+ 
   - Docker Desktop
   - Git
   - 5GB+ free disk space

2. **Clone and Setup:**
   ```bash
   git clone <repository-url>
   cd cattle-management-system
   npm install
   ```

3. **Environment Configuration:**
   ```bash
   cp .env.development .env
   cp backend/.env.development backend/.env
   ```

4. **Start Services:**
   ```bash
   npm run dev:all
   ```

## Development Scripts

### Setup Scripts
- `npm run setup:enhanced` - Enhanced cross-platform setup
- `npm run setup:enhanced:win` - Windows-specific enhanced setup

### Development Servers
- `npm run dev:all` - Start backend and frontend
- `npm run dev:hot-reload` - Start all services with hot reload
- `npm run dev:docker:dev` - Start with Docker development configuration

### Health Monitoring
- `npm run dev:health-check` - Comprehensive health check
- `npm run dev:monitor` - Real-time status monitoring

### Docker Development
- `npm run dev:docker:dev` - Development Docker environment
- `npm run dev:docker:dev:detach` - Background development environment

## Service Architecture

### Core Services
- **Backend API** (Port 3000) - Express.js with TypeScript
- **Frontend Web** (Port 5173) - Vue 3 with Vite
- **Miniprogram** (Port 8080) - uni-app WeChat miniprogram
- **PostgreSQL** (Port 5432) - Primary database
- **Redis** (Port 6379) - Caching and sessions

### Development Tools
- **Adminer** (Port 8081) - Database administration
- **Redis Commander** (Port 8082) - Redis administration
- **Nginx** (Port 80) - Reverse proxy and load balancing

### Monitoring (Optional)
- **Prometheus** (Port 9090) - Metrics collection
- **Grafana** (Port 3001) - Monitoring dashboards

## Hot Reload Configuration

### Backend Hot Reload
- Uses `nodemon` for automatic TypeScript compilation and restart
- Watches `src/` directory for changes
- Supports debugging on port 9229
- Configuration: `backend/nodemon.json`

### Frontend Hot Reload
- Uses Vite HMR (Hot Module Replacement)
- Instant updates without page refresh
- Supports Vue 3 component hot reload
- Configuration: `frontend/vite.config.ts`

### Miniprogram Hot Reload
- Uses uni-app watch mode
- Automatic compilation for WeChat miniprogram
- Configuration: `miniprogram/vue.config.js`

## Docker Development Environment

### Development Compose File
The `docker-compose.dev.yml` provides:
- Optimized development containers
- Volume mounts for hot reload
- Development-specific environment variables
- Debugging ports exposed
- Development tools included

### Key Features
- **Hot Reload**: All services support hot reload through volume mounts
- **Debugging**: Backend debugging port (9229) exposed
- **Monitoring**: Optional Prometheus and Grafana services
- **Administration**: Database and Redis admin tools
- **Logging**: Centralized logging with Fluent Bit

### Usage
```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Start with monitoring
docker-compose -f docker-compose.dev.yml --profile monitoring up

# Start development tools
docker-compose -f docker-compose.dev.yml --profile tools up
```

## Health Checks and Monitoring

### Health Check Script
The `dev-health-check` script validates:
- ✅ System requirements and resources
- ✅ Service connectivity and response times
- ✅ Database and Redis connections
- ✅ File permissions and directory structure
- ✅ Environment configuration
- ✅ Dependencies installation

### Status Monitor
The `dev-status-monitor` script provides:
- 🔄 Real-time service status updates
- 📊 Resource usage monitoring
- 📝 Activity logging
- 🐳 Docker container status
- ⚡ Interactive controls

### Monitor Controls
- `q` - Quit monitor
- `r` - Force refresh
- `h` - Show help
- `l` - Show detailed logs
- `s` - Restart services
- `d` - Show Docker status

## Environment Configuration

### Environment Files
- `.env.development` - Default development configuration
- `backend/.env` - Backend-specific environment
- `frontend/.env` - Frontend-specific environment

### Key Configuration Options

#### Backend Configuration
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
REDIS_HOST=localhost
JWT_SECRET=dev-jwt-secret
DEBUG=app:*
ENABLE_SWAGGER=true
```

#### Frontend Configuration
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_ENABLE_DEVTOOLS=true
VITE_ENABLE_HMR=true
```

#### Docker Configuration
```env
COMPOSE_PROJECT_NAME=cattle-management-system
POSTGRES_PASSWORD=dianxin99
GRAFANA_PASSWORD=admin123
```

## Development Workflow

### 1. Initial Setup
```bash
# Run enhanced setup
npm run setup:enhanced

# Verify installation
npm run dev:health-check
```

### 2. Daily Development
```bash
# Start monitoring (optional)
npm run dev:monitor

# Start hot reload development
npm run dev:hot-reload

# Or start individual services
npm run dev:backend
npm run dev:frontend
```

### 3. Testing and Debugging
```bash
# Run tests
npm run test:all

# Debug backend (attach debugger to port 9229)
npm run dev:backend

# Check service health
npm run dev:health-check
```

### 4. Docker Development
```bash
# Start Docker development environment
npm run dev:docker:dev

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Find process using port
lsof -i :3000  # Linux/macOS
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # Linux/macOS
taskkill /f /pid <PID>  # Windows
```

#### Database Connection Issues
```bash
# Check database status
docker-compose ps postgres

# Restart database
docker-compose restart postgres

# Reset database
npm run db:reset
```

#### Node.js Issues
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### Docker Issues
```bash
# Restart Docker services
docker-compose down
docker-compose up -d

# Clean Docker system
docker system prune -f

# Rebuild containers
docker-compose up --build
```

### Getting Help

1. **Health Check**: Run `npm run dev:health-check` for diagnostic information
2. **Monitor**: Use `npm run dev:monitor` for real-time status
3. **Logs**: Check logs in the `logs/` directory
4. **Documentation**: Review `DEVELOPMENT_GUIDE.md` for detailed instructions

## Platform-Specific Notes

### Windows
- Use Command Prompt or PowerShell as Administrator
- Docker Desktop must be running
- Use `scripts\*.bat` versions of scripts
- File paths use backslashes

### Linux/macOS
- Ensure Docker daemon is running
- Use `bash scripts/*.sh` versions of scripts
- May need `sudo` for some operations
- File paths use forward slashes

### Cross-Platform Compatibility
- All scripts have both `.sh` and `.bat` versions
- Environment variables work across platforms
- Docker configurations are platform-agnostic
- File paths are handled appropriately in each script

## Performance Optimization

### Development Performance Tips
1. **Use SSD**: Store project on SSD for faster file operations
2. **Increase Memory**: Allocate more RAM to Docker Desktop
3. **Exclude Directories**: Add `node_modules` and `dist` to antivirus exclusions
4. **Use Hot Reload**: Avoid full restarts when possible
5. **Monitor Resources**: Use the status monitor to track resource usage

### Docker Performance
- Increase Docker Desktop memory allocation
- Use volume mounts for hot reload
- Enable BuildKit for faster builds
- Use multi-stage builds for optimization

## Security Considerations

### Development Security
- Default passwords are for development only
- CORS is enabled for localhost
- Debug endpoints are enabled
- HTTPS is optional in development

### Production Preparation
- Change all default passwords
- Disable debug features
- Enable HTTPS
- Configure proper CORS origins
- Review security settings

## Next Steps

After successful setup:
1. Review the generated `DEVELOPMENT_GUIDE.md`
2. Explore the monitoring dashboard
3. Run the test suite
4. Start developing features
5. Use hot reload for efficient development

For production deployment, see `DEPLOYMENT.md`.