#!/bin/bash

# GameControl Setup Script
# This script sets up and runs the complete GameControl system

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         GameControl - Advanced Game Server Manager        ║"
echo "║                   Setup & Installation                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose is not installed. Please install Docker Compose.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is installed${NC}"
echo -e "${GREEN}✓ Docker Compose is installed${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Prompt for Cloudflare Tunnel setup (optional)
echo ""
echo -e "${YELLOW}Cloudflare Tunnel Setup (Optional)${NC}"
echo "To enable public HTTPS access via Cloudflare Tunnel:"
echo "1. Sign up at https://dash.cloudflare.com"
echo "2. Install cloudflared CLI: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
echo "3. Run: cloudflared tunnel create gamecontrol"
echo "4. Run: cloudflared tunnel token gamecontrol"
echo "5. Copy the token and paste it below (or press Enter to skip)"
echo ""

read -p "Enter your Cloudflare Tunnel Token (or press Enter to skip): " TUNNEL_TOKEN

if [ -n "$TUNNEL_TOKEN" ]; then
    sed -i "s|CLOUDFLARE_TUNNEL_TOKEN=.*|CLOUDFLARE_TUNNEL_TOKEN=$TUNNEL_TOKEN|g" .env
    echo -e "${GREEN}✓ Cloudflare Tunnel token saved${NC}"
else
    echo -e "${YELLOW}⚠ Skipping Cloudflare Tunnel setup (local access only)${NC}"
fi

# Create necessary directories
echo -e "${YELLOW}Creating data directories...${NC}"
mkdir -p data logs
echo -e "${GREEN}✓ Directories created${NC}"

# Build images
echo ""
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose build --no-cache

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker images built successfully${NC}"
else
    echo -e "${RED}✗ Failed to build Docker images${NC}"
    exit 1
fi

# Start services
echo ""
echo -e "${YELLOW}Starting GameControl services...${NC}"
docker-compose up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Services started successfully${NC}"
else
    echo -e "${RED}✗ Failed to start services${NC}"
    exit 1
fi

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Check service health
BACKEND_READY=0
FRONTEND_READY=0

for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        BACKEND_READY=1
        break
    fi
    echo -n "."
    sleep 1
done

for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        FRONTEND_READY=1
        break
    fi
    echo -n "."
    sleep 1
done

echo ""
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"

if [ $BACKEND_READY -eq 1 ] && [ $FRONTEND_READY -eq 1 ]; then
    echo -e "${GREEN}✓ GameControl is ready!${NC}"
    echo ""
    echo -e "${YELLOW}Access the panel at:${NC}"
    echo -e "${GREEN}  Local:   http://localhost:3000${NC}"
    echo ""
    echo -e "${YELLOW}API Documentation:${NC}"
    echo -e "${GREEN}  Swagger: http://localhost:8000/docs${NC}"
    echo ""
    
    if grep -q "CLOUDFLARE_TUNNEL_TOKEN=.*[a-zA-Z0-9]" .env; then
        echo -e "${YELLOW}Public Access:${NC}"
        echo -e "${GREEN}  Run: cloudflared tunnel route dns gamecontrol${NC}"
        echo -e "${GREEN}  Then visit: https://gamecontrol.<yourdomain>${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}Useful Commands:${NC}"
    echo "  View logs:       docker-compose logs -f"
    echo "  Stop services:   docker-compose down"
    echo "  Restart:         docker-compose restart"
    echo ""
else
    echo -e "${RED}✗ Services failed to start properly${NC}"
    echo -e "${YELLOW}Checking logs:${NC}"
    docker-compose logs
    exit 1
fi

echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"