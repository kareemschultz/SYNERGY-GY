#!/bin/bash
# Debug script to identify why Access Pending is still showing

set -e

echo "🔍 GK-Nexus Production Debugging Script"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check if containers are running
echo "1️⃣ Checking Docker containers..."
if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Containers are running${NC}"
    docker compose ps
else
    echo -e "${RED}❌ Containers are not running!${NC}"
    exit 1
fi
echo ""

# 2. Check image creation date
echo "2️⃣ Checking Docker image date..."
IMAGE_DATE=$(docker inspect ghcr.io/kareemschultz/gk-nexus:latest --format='{{.Created}}' 2>/dev/null || echo "Image not found")
echo "Latest image created: $IMAGE_DATE"
echo ""

# 3. Check if unwrapOrpc helper exists in running container
echo "3️⃣ Checking if unwrapOrpc helper exists in container..."
if docker compose exec -T app test -f /app/apps/web/src/utils/orpc-response.ts; then
    echo -e "${GREEN}✅ orpc-response.ts exists in container${NC}"
    echo "File contents:"
    docker compose exec -T app cat /app/apps/web/src/utils/orpc-response.ts | head -20
else
    echo -e "${RED}❌ orpc-response.ts NOT FOUND in container!${NC}"
    echo "This means you're running the OLD image without the fix."
fi
echo ""

# 4. Check if app.tsx has the unwrap code
echo "4️⃣ Checking if app.tsx uses unwrapOrpc..."
if docker compose exec -T app grep -q "unwrapOrpc" /app/apps/web/src/routes/app.tsx 2>/dev/null; then
    echo -e "${GREEN}✅ app.tsx contains unwrapOrpc usage${NC}"
else
    echo -e "${RED}❌ app.tsx does NOT contain unwrapOrpc!${NC}"
    echo "This confirms you're running the OLD code."
fi
echo ""

# 5. Check database for staff profile
echo "5️⃣ Checking database for staff profile..."
STAFF_COUNT=$(docker compose exec -T postgres psql -U gknexus -d gknexus -t -c "SELECT COUNT(*) FROM staff WHERE role = 'OWNER';" 2>/dev/null | xargs)
if [ "$STAFF_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ Found $STAFF_COUNT OWNER staff profile(s)${NC}"
    echo "Staff details:"
    docker compose exec -T postgres psql -U gknexus -d gknexus -c "SELECT id, \"userId\", role, businesses, \"isActive\" FROM staff WHERE role = 'OWNER';"
else
    echo -e "${RED}❌ No OWNER staff profiles found!${NC}"
    echo "This is a database issue."
fi
echo ""

# 6. Check app logs for errors
echo "6️⃣ Recent application logs..."
echo "Last 20 lines:"
docker compose logs --tail=20 app
echo ""

# 7. Test health endpoint
echo "7️⃣ Testing health endpoint..."
if curl -sf http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✅ Health endpoint responding${NC}"
else
    echo -e "${RED}❌ Health endpoint not responding!${NC}"
fi
echo ""

# 8. Check current running image digest
echo "8️⃣ Checking running container image..."
RUNNING_IMAGE=$(docker inspect $(docker compose ps -q app) --format='{{.Image}}' 2>/dev/null)
echo "Running image: $RUNNING_IMAGE"
echo ""

# Summary
echo "=========================================="
echo "📋 SUMMARY & NEXT STEPS"
echo "=========================================="
echo ""
echo "If orpc-response.ts is MISSING:"
echo "  → You're running the old image. Force pull the new one:"
echo "  → docker compose pull --no-cache"
echo "  → docker compose down && docker compose up -d"
echo ""
echo "If orpc-response.ts EXISTS but still seeing Access Pending:"
echo "  → Clear browser cache (Ctrl+Shift+Delete)"
echo "  → Hard refresh (Ctrl+Shift+R)"
echo "  → Try incognito/private window"
echo ""
echo "If staff profile is MISSING:"
echo "  → Check INITIAL_OWNER_* variables in .env"
echo "  → Restart containers to trigger setup: docker compose restart app"
echo ""
