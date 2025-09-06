#!/bin/bash
# ENVY - Utility Scripts per Docker e Development

set -e

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}"
    echo "=================================="
    echo "   ENVY - $1"
    echo "=================================="
    echo -e "${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Development setup
dev_setup() {
    print_header "Development Setup"
    
    echo "📦 Installing backend dependencies..."
    cd api && npm install && cd ..
    
    echo "📦 Installing frontend dependencies..."
    cd react && npm install && cd ..
    
    print_success "Development setup completed!"
}

# Local development start
dev_start() {
    print_header "Starting Development Servers"
    
    echo "🚀 Starting backend server..."
    cd api && npm run dev &
    BACKEND_PID=$!
    
    echo "🚀 Starting frontend server..."  
    cd react && npm run dev &
    FRONTEND_PID=$!
    
    echo "Backend PID: $BACKEND_PID"
    echo "Frontend PID: $FRONTEND_PID"
    
    print_success "Development servers started!"
    print_warning "Press Ctrl+C to stop both servers"
    
    # Aspetta che i processi finiscano
    wait
}

# Docker development
docker_dev() {
    print_header "Docker Development Mode"
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
}

# Docker production
docker_prod() {
    print_header "Docker Production Mode"
    docker-compose -f docker-compose.prod.yml up --build -d
    print_success "Production containers started in background"
}

# Docker standard
docker_start() {
    print_header "Docker Standard Mode"
    docker-compose up --build
}

# Stop Docker containers
docker_stop() {
    print_header "Stopping Docker Containers"
    
    echo "🛑 Stopping standard containers..."
    docker-compose down 2>/dev/null || echo "No standard containers running"
    
    echo "🛑 Stopping development containers..."
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml down 2>/dev/null || echo "No dev containers running"
    
    echo "🛑 Stopping production containers..."
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || echo "No prod containers running"
    
    print_success "All containers stopped"
}

# Clean Docker resources
docker_clean() {
    print_header "Cleaning Docker Resources"
    
    echo "🧹 Stopping and removing containers..."
    docker-compose down -v --remove-orphans 2>/dev/null || true
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v --remove-orphans 2>/dev/null || true
    docker-compose -f docker-compose.prod.yml down -v --remove-orphans 2>/dev/null || true
    
    echo "🧹 Removing ENVY-specific volumes and databases..."
    docker volume rm envy-database 2>/dev/null || echo "Volume envy-database not found"
    docker volume rm envy-database-dev 2>/dev/null || echo "Volume envy-database-dev not found" 
    docker volume rm envy-database-prod 2>/dev/null || echo "Volume envy-database-prod not found"
    
    echo "🧹 Removing images..."
    docker image prune -f
    
    echo "🧹 Removing unused volumes..."
    docker volume prune -f
    
    print_success "Docker cleanup completed - database will be recreated on next start"
}

# Reset database - clean restart
docker_reset() {
    print_header "Resetting Database"
    
    echo "🔄 This will destroy all existing data and start fresh"
    echo "🛑 Stopping containers..."
    docker_stop
    
    echo "🗄️ Removing database volumes..."
    docker volume rm envy-database 2>/dev/null || echo "Volume envy-database not found"
    docker volume rm envy-database-dev 2>/dev/null || echo "Volume envy-database-dev not found"
    docker volume rm envy-database-prod 2>/dev/null || echo "Volume envy-database-prod not found"
    
    print_success "Database reset completed - containers will create fresh database on next start"
}

# Show help
show_help() {
    print_header "Available Commands"
    echo "Local Development:"
    echo "  ./scripts.sh setup      - Install all dependencies"
    echo "  ./scripts.sh dev        - Start development servers locally"
    echo ""
    echo "Docker Commands:"
    echo "  ./scripts.sh docker     - Start with Docker (standard)"
    echo "  ./scripts.sh docker-dev - Start with Docker (development mode)"  
    echo "  ./scripts.sh docker-prod- Start with Docker (production mode)"
    echo "  ./scripts.sh stop       - Stop all Docker containers"
    echo "  ./scripts.sh clean      - Clean Docker resources and images"
    echo "  ./scripts.sh reset      - Reset database (fresh start)"
    echo ""
    echo "Utilities:"
    echo "  ./scripts.sh help       - Show this help"
    echo ""
}

# Main switch
case "$1" in
    "setup")
        dev_setup
        ;;
    "dev")
        dev_start
        ;;
    "docker")
        docker_start
        ;;
    "docker-dev")
        docker_dev
        ;;
    "docker-prod")
        docker_prod
        ;;
    "stop")
        docker_stop
        ;;
    "clean")
        docker_clean
        ;;
    "reset")
        docker_reset
        ;;
    "help"|"")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
