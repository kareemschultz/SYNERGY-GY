#!/usr/bin/env bash

# ============================================================================
# Docker Build Verification Script for GK-Nexus
# ============================================================================
# This script verifies that the production Docker build:
# - Builds successfully
# - Creates an image under 300MB
# - Starts and becomes healthy within 60 seconds
# - Responds to health check endpoint
# - Serves the application correctly
# ============================================================================

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="gk-nexus-server"
IMAGE_TAG="verify-test"
CONTAINER_NAME="gk-nexus-verify-test"
MAX_IMAGE_SIZE_MB=300
HEALTH_CHECK_TIMEOUT=60
PORT=3000

# Cleanup function to remove test container and image
cleanup() {
    echo ""
    echo -e "${BLUE}🧹 Cleaning up...${NC}"

    # Stop and remove container if it exists
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo "   Stopping container ${CONTAINER_NAME}..."
        docker stop "${CONTAINER_NAME}" >/dev/null 2>&1 || true
        echo "   Removing container ${CONTAINER_NAME}..."
        docker rm "${CONTAINER_NAME}" >/dev/null 2>&1 || true
    fi

    # Remove test image if it exists
    if docker images --format '{{.Repository}}:{{.Tag}}' | grep -q "^${IMAGE_NAME}:${IMAGE_TAG}$"; then
        echo "   Removing image ${IMAGE_NAME}:${IMAGE_TAG}..."
        docker rmi "${IMAGE_NAME}:${IMAGE_TAG}" >/dev/null 2>&1 || true
    fi

    echo -e "${GREEN}✓ Cleanup complete${NC}"
}

# Register cleanup on exit
trap cleanup EXIT

# Function to print section headers
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to print success messages
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error messages
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print warning messages
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Function to print info messages
print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if Docker is running
check_docker() {
    if ! docker info >/dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Build the Docker image
build_image() {
    print_header "Building Docker Image"
    print_info "Building ${IMAGE_NAME}:${IMAGE_TAG}..."
    print_info "This may take several minutes..."

    if DOCKER_BUILDKIT=1 docker build -f Dockerfile.prod -t "${IMAGE_NAME}:${IMAGE_TAG}" . 2>&1 | tee /tmp/docker-build.log; then
        print_success "Image built successfully"
    else
        print_error "Docker build failed. Check /tmp/docker-build.log for details."
        exit 1
    fi
}

# Verify image size
verify_image_size() {
    print_header "Verifying Image Size"

    # Get image size in bytes
    local size_bytes
    size_bytes=$(docker inspect "${IMAGE_NAME}:${IMAGE_TAG}" --format='{{.Size}}' 2>/dev/null || echo "0")

    if [[ "${size_bytes}" == "0" ]]; then
        print_error "Failed to get image size"
        exit 1
    fi

    # Convert to MB
    local size_mb=$((size_bytes / 1024 / 1024))

    print_info "Image size: ${size_mb} MB (limit: ${MAX_IMAGE_SIZE_MB} MB)"

    if [[ ${size_mb} -le ${MAX_IMAGE_SIZE_MB} ]]; then
        print_success "Image size is within acceptable limits"
    else
        print_error "Image size (${size_mb} MB) exceeds limit (${MAX_IMAGE_SIZE_MB} MB)"
        exit 1
    fi
}

# Start the container
start_container() {
    print_header "Starting Container"

    # Check if port is already in use
    if lsof -Pi :${PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_error "Port ${PORT} is already in use. Please stop any services using this port."
        exit 1
    fi

    print_info "Starting container ${CONTAINER_NAME}..."

    # Start container with minimal environment
    if docker run -d \
        --name "${CONTAINER_NAME}" \
        -p "${PORT}:${PORT}" \
        -e DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gk_nexus" \
        -e BETTER_AUTH_SECRET="test-secret-for-verification-only" \
        -e BETTER_AUTH_URL="http://localhost:${PORT}" \
        -e CORS_ORIGIN="http://localhost:3001" \
        "${IMAGE_NAME}:${IMAGE_TAG}" >/dev/null 2>&1; then
        print_success "Container started"
    else
        print_error "Failed to start container"
        docker logs "${CONTAINER_NAME}" 2>&1 | tail -20
        exit 1
    fi
}

# Wait for container to be healthy
wait_for_health() {
    print_header "Waiting for Health Check"

    print_info "Waiting for container to become healthy (timeout: ${HEALTH_CHECK_TIMEOUT}s)..."

    local elapsed=0
    local interval=2

    while [[ ${elapsed} -lt ${HEALTH_CHECK_TIMEOUT} ]]; do
        # Check if container is still running
        if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            print_error "Container stopped unexpectedly"
            print_info "Container logs:"
            docker logs "${CONTAINER_NAME}" 2>&1 | tail -30
            exit 1
        fi

        # Try to curl the health endpoint
        if curl -sf "http://localhost:${PORT}/health" >/dev/null 2>&1; then
            print_success "Container is healthy (${elapsed}s)"
            return 0
        fi

        # Show progress
        echo -n "."
        sleep ${interval}
        elapsed=$((elapsed + interval))
    done

    echo ""
    print_error "Container did not become healthy within ${HEALTH_CHECK_TIMEOUT} seconds"
    print_info "Container logs:"
    docker logs "${CONTAINER_NAME}" 2>&1 | tail -30
    exit 1
}

# Verify health endpoint
verify_health_endpoint() {
    print_header "Verifying Health Endpoint"

    print_info "Testing GET /health..."

    local response
    local status_code

    response=$(curl -s -w "\n%{http_code}" "http://localhost:${PORT}/health" 2>&1)
    status_code=$(echo "${response}" | tail -n1)

    if [[ "${status_code}" == "200" ]]; then
        print_success "Health endpoint returned 200 OK"
        print_info "Response: $(echo "${response}" | head -n-1)"
    else
        print_error "Health endpoint returned ${status_code} (expected 200)"
        print_info "Response: ${response}"
        exit 1
    fi
}

# Verify application endpoint
verify_app_endpoint() {
    print_header "Verifying Application Endpoint"

    print_info "Testing GET / ..."

    local response
    local status_code

    response=$(curl -s -w "\n%{http_code}" "http://localhost:${PORT}/" 2>&1)
    status_code=$(echo "${response}" | tail -n1)

    if [[ "${status_code}" == "200" ]]; then
        print_success "Application endpoint returned 200 OK"

        # Check if response contains HTML-like content or JSON
        local content
        content=$(echo "${response}" | head -n-1)

        if echo "${content}" | grep -qiE '(<html|<body|<!DOCTYPE|{.*}|hono|health)'; then
            print_success "Response appears to be valid (HTML/JSON)"
        else
            print_warning "Response may not be valid HTML or JSON"
            print_info "First 200 chars: ${content:0:200}"
        fi
    else
        print_error "Application endpoint returned ${status_code} (expected 200)"
        exit 1
    fi
}

# Display container logs
show_container_logs() {
    print_header "Container Logs (last 20 lines)"
    docker logs --tail 20 "${CONTAINER_NAME}" 2>&1
}

# Main verification flow
main() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║         GK-Nexus Docker Build Verification Script          ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"

    check_docker
    build_image
    verify_image_size
    start_container
    wait_for_health
    verify_health_endpoint
    verify_app_endpoint
    show_container_logs

    print_header "Verification Complete"
    echo ""
    print_success "All verification checks passed!"
    echo ""
    print_info "Summary:"
    echo "   • Docker image built successfully"
    echo "   • Image size is under ${MAX_IMAGE_SIZE_MB} MB"
    echo "   • Container started and became healthy"
    echo "   • Health check endpoint is responding"
    echo "   • Application endpoint is serving content"
    echo ""
    print_info "Next steps:"
    echo "   1. Review the container logs above"
    echo "   2. If everything looks good, proceed with CI/CD pipeline setup"
    echo "   3. Test with production environment variables"
    echo ""

    exit 0
}

# Run main function
main
