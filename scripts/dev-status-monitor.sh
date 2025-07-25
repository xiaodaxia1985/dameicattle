#!/bin/bash

# Development Environment Status Monitor
# Real-time monitoring of all development services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="cattle-management-system"
REFRESH_INTERVAL=5
LOG_FILE="logs/dev-monitor-$(date +%Y%m%d-%H%M%S).log"

# Service configurations
declare -A SERVICES=(
    ["Backend"]="http://localhost:3000/health"
    ["Frontend"]="http://localhost:5173"
    ["Database"]="postgres://cattle_user:dianxin99@localhost:5432/cattle_management"
    ["Redis"]="redis://localhost:6379"
    ["Adminer"]="http://localhost:8080"
)

declare -A SERVICE_PORTS=(
    ["Backend"]="3000"
    ["Frontend"]="5173"
    ["Database"]="5432"
    ["Redis"]="6379"
    ["Adminer"]="8080"
)

# Global status tracking
declare -A SERVICE_STATUS
declare -A SERVICE_RESPONSE_TIME
declare -A SERVICE_UPTIME
declare -A SERVICE_ERROR_COUNT

# Initialize status tracking
init_status_tracking() {
    for service in "${!SERVICES[@]}"; do
        SERVICE_STATUS[$service]="unknown"
        SERVICE_RESPONSE_TIME[$service]="0"
        SERVICE_UPTIME[$service]="0"
        SERVICE_ERROR_COUNT[$service]="0"
    done
}

# Logging function
log_message() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Clear screen and show header
show_header() {
    clear
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                    Development Environment Status Monitor                    ║${NC}"
    echo -e "${BLUE}║                              $PROJECT_NAME                               ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}Last Updated: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo -e "${CYAN}Refresh Interval: ${REFRESH_INTERVAL}s${NC}"
    echo -e "${CYAN}Log File: $LOG_FILE${NC}"
    echo ""
}

# Check service health
check_service_health() {
    local service=$1
    local url=${SERVICES[$service]}
    local port=${SERVICE_PORTS[$service]}
    local start_time=$(date +%s.%N)
    
    case $service in
        "Backend"|"Frontend"|"Adminer")
            if curl -s --max-time 3 "$url" >/dev/null 2>&1; then
                SERVICE_STATUS[$service]="healthy"
                local end_time=$(date +%s.%N)
                SERVICE_RESPONSE_TIME[$service]=$(echo "$end_time - $start_time" | bc | xargs printf "%.3f")
                SERVICE_ERROR_COUNT[$service]="0"
                return 0
            else
                SERVICE_STATUS[$service]="unhealthy"
                SERVICE_ERROR_COUNT[$service]=$((${SERVICE_ERROR_COUNT[$service]} + 1))
                return 1
            fi
            ;;
        "Database")
            if pg_isready -h localhost -p 5432 -U cattle_user -d cattle_management >/dev/null 2>&1; then
                SERVICE_STATUS[$service]="healthy"
                local end_time=$(date +%s.%N)
                SERVICE_RESPONSE_TIME[$service]=$(echo "$end_time - $start_time" | bc | xargs printf "%.3f")
                SERVICE_ERROR_COUNT[$service]="0"
                return 0
            else
                SERVICE_STATUS[$service]="unhealthy"
                SERVICE_ERROR_COUNT[$service]=$((${SERVICE_ERROR_COUNT[$service]} + 1))
                return 1
            fi
            ;;
        "Redis")
            if redis-cli -h localhost -p 6379 ping | grep -q "PONG" 2>/dev/null; then
                SERVICE_STATUS[$service]="healthy"
                local end_time=$(date +%s.%N)
                SERVICE_RESPONSE_TIME[$service]=$(echo "$end_time - $start_time" | bc | xargs printf "%.3f")
                SERVICE_ERROR_COUNT[$service]="0"
                return 0
            else
                SERVICE_STATUS[$service]="unhealthy"
                SERVICE_ERROR_COUNT[$service]=$((${SERVICE_ERROR_COUNT[$service]} + 1))
                return 1
            fi
            ;;
    esac
}

# Get service process info
get_service_process_info() {
    local service=$1
    local port=${SERVICE_PORTS[$service]}
    
    case $service in
        "Backend"|"Frontend")
            local pid=$(lsof -ti :$port 2>/dev/null | head -1)
            if [[ -n "$pid" ]]; then
                local cpu=$(ps -p $pid -o %cpu= 2>/dev/null | xargs)
                local mem=$(ps -p $pid -o %mem= 2>/dev/null | xargs)
                echo "PID: $pid | CPU: ${cpu}% | MEM: ${mem}%"
            else
                echo "Not running"
            fi
            ;;
        "Database"|"Redis")
            if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "${service,,}"; then
                local container_name=$(docker ps --format "{{.Names}}" | grep "${service,,}")
                local stats=$(docker stats --no-stream --format "table {{.CPUPerc}}\t{{.MemUsage}}" $container_name 2>/dev/null | tail -1)
                echo "Container: $container_name | $stats"
            else
                echo "Container not running"
            fi
            ;;
        "Adminer")
            if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "adminer"; then
                echo "Container running"
            else
                echo "Container not running"
            fi
            ;;
    esac
}

# Get system resource usage
get_system_resources() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | sed 's/%us,//')
    local mem_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    local disk_usage=$(df . | tail -1 | awk '{print $5}' | sed 's/%//')
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    
    echo "CPU: ${cpu_usage}% | Memory: ${mem_usage}% | Disk: ${disk_usage}% | Load: ${load_avg}"
}

# Display service status
display_service_status() {
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                                Service Status                                ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    
    printf "%-12s %-10s %-12s %-15s %-8s %s\n" "Service" "Status" "Response" "Process Info" "Errors" "URL"
    echo "────────────────────────────────────────────────────────────────────────────────"
    
    for service in "${!SERVICES[@]}"; do
        local status=${SERVICE_STATUS[$service]}
        local response_time=${SERVICE_RESPONSE_TIME[$service]}
        local error_count=${SERVICE_ERROR_COUNT[$service]}
        local process_info=$(get_service_process_info "$service")
        local url=${SERVICES[$service]}
        
        # Color code status
        local status_color=""
        case $status in
            "healthy") status_color="${GREEN}" ;;
            "unhealthy") status_color="${RED}" ;;
            *) status_color="${YELLOW}" ;;
        esac
        
        printf "%-12s ${status_color}%-10s${NC} %-12s %-15s %-8s %s\n" \
            "$service" "$status" "${response_time}s" "$process_info" "$error_count" "$url"
    done
}

# Display Docker status
display_docker_status() {
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                                Docker Status                                 ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    
    if command -v docker >/dev/null && docker info >/dev/null 2>&1; then
        echo -e "${GREEN}Docker daemon is running${NC}"
        
        # Show running containers
        local containers=$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(cattle|postgres|redis|adminer)")
        if [[ -n "$containers" ]]; then
            echo ""
            echo "Running containers:"
            echo "$containers"
        else
            echo -e "${YELLOW}No project containers running${NC}"
        fi
        
        # Show Docker Compose status
        if command -v docker-compose >/dev/null; then
            echo ""
            echo "Docker Compose services:"
            docker-compose ps 2>/dev/null || echo "No docker-compose services found"
        fi
    else
        echo -e "${RED}Docker daemon is not running${NC}"
    fi
}

# Display system information
display_system_info() {
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                               System Information                             ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    
    echo "System Resources: $(get_system_resources)"
    echo "Platform: $(uname -s) $(uname -r)"
    echo "Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
    echo "npm: $(npm --version 2>/dev/null || echo 'Not installed')"
    echo "Docker: $(docker --version 2>/dev/null | cut -d' ' -f3 | sed 's/,//' || echo 'Not installed')"
    
    # Network information
    echo ""
    echo "Network Status:"
    echo "  Localhost connectivity: $(curl -s --max-time 2 http://localhost >/dev/null 2>&1 && echo 'OK' || echo 'Failed')"
    echo "  Internet connectivity: $(curl -s --max-time 3 https://www.google.com >/dev/null 2>&1 && echo 'OK' || echo 'Failed')"
}

# Display recent logs
display_recent_logs() {
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                                Recent Activity                               ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    
    if [[ -f "$LOG_FILE" ]]; then
        echo "Recent monitor logs:"
        tail -5 "$LOG_FILE" 2>/dev/null || echo "No recent logs"
    fi
    
    # Show recent Docker logs if available
    if command -v docker-compose >/dev/null; then
        echo ""
        echo "Recent service logs:"
        docker-compose logs --tail=3 --no-color 2>/dev/null | head -10 || echo "No Docker logs available"
    fi
}

# Display help information
display_help() {
    echo ""
    echo -e "${BLUE}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║                                   Controls                                   ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
    
    echo "Commands:"
    echo "  q, quit     - Exit monitor"
    echo "  r, refresh  - Force refresh"
    echo "  h, help     - Show this help"
    echo "  l, logs     - Show detailed logs"
    echo "  s, services - Restart all services"
    echo "  d, docker   - Show Docker status"
    echo ""
    echo "Press any key to continue monitoring..."
}

# Handle user input
handle_input() {
    local input
    read -t 1 -n 1 input 2>/dev/null || return 0
    
    case $input in
        'q'|'Q')
            echo ""
            echo "Exiting monitor..."
            exit 0
            ;;
        'r'|'R')
            echo ""
            echo "Force refreshing..."
            return 0
            ;;
        'h'|'H')
            display_help
            read -n 1
            ;;
        'l'|'L')
            echo ""
            echo "Detailed logs:"
            tail -20 "$LOG_FILE" 2>/dev/null || echo "No logs available"
            echo ""
            echo "Press any key to continue..."
            read -n 1
            ;;
        's'|'S')
            echo ""
            echo "Restarting services..."
            docker-compose restart 2>/dev/null || echo "Failed to restart services"
            echo "Press any key to continue..."
            read -n 1
            ;;
        'd'|'D')
            echo ""
            docker-compose ps 2>/dev/null || echo "No Docker Compose services"
            echo ""
            echo "Press any key to continue..."
            read -n 1
            ;;
    esac
}

# Main monitoring loop
main_loop() {
    init_status_tracking
    
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    log_message "INFO" "Development environment monitor started"
    
    while true; do
        # Check all services
        for service in "${!SERVICES[@]}"; do
            check_service_health "$service"
            log_message "DEBUG" "Checked $service: ${SERVICE_STATUS[$service]}"
        done
        
        # Display status
        show_header
        display_service_status
        display_docker_status
        display_system_info
        display_recent_logs
        
        echo ""
        echo -e "${CYAN}Press 'q' to quit, 'h' for help, or wait for auto-refresh...${NC}"
        
        # Handle user input with timeout
        for i in $(seq 1 $REFRESH_INTERVAL); do
            handle_input
            sleep 1
        done
    done
}

# Cleanup function
cleanup() {
    log_message "INFO" "Development environment monitor stopped"
    echo ""
    echo "Monitor stopped. Log file: $LOG_FILE"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check dependencies
check_dependencies() {
    local missing_deps=()
    
    command -v curl >/dev/null || missing_deps+=("curl")
    command -v bc >/dev/null || missing_deps+=("bc")
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        echo "Missing dependencies: ${missing_deps[*]}"
        echo "Please install them and try again."
        exit 1
    fi
}

# Show usage if help requested
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "Development Environment Status Monitor"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -i, --interval SECONDS  Set refresh interval (default: 5)"
    echo "  -l, --log FILE         Set log file path"
    echo "  -h, --help             Show this help"
    echo ""
    echo "Interactive commands:"
    echo "  q - Quit monitor"
    echo "  r - Force refresh"
    echo "  h - Show help"
    echo "  l - Show detailed logs"
    echo "  s - Restart services"
    echo "  d - Show Docker status"
    echo ""
    exit 0
fi

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -i|--interval)
            REFRESH_INTERVAL="$2"
            shift 2
            ;;
        -l|--log)
            LOG_FILE="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Run the monitor
check_dependencies
main_loop