# GameControl - Advanced Game Server Management Panel

**GameControl** is a professional, fully containerized game server management panel similar to Pterodactyl. It provides a dark-themed web interface for creating, managing, and monitoring Palworld game servers with real-time console streaming and resource monitoring.

## ✨ Features

### 🎮 Core Features
- **One-Click Server Creation**: Instantly spin up Palworld servers with custom configurations
- **Server Management**: Start, stop, restart, and delete servers with ease
- **Sequential Port Mapping**: Automatic port assignment (8211, 8212, 8213...)
- **Live Console Viewer**: Real-time server logs via WebSocket streaming
- **Resource Monitoring**: Track CPU, RAM usage per server
- **Server Settings**: Customize gameplay settings (exp rate, capture rate, spawn rate)
- **Search & Filter**: Find servers by name or filter by status
- **Persistent Storage**: Docker volumes for world data persistence

### 🎨 Professional UI
- **Pure Dark Theme**: Eye-friendly, modern dark interface with professional styling
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Dashboard refreshes automatically every 5 seconds
- **Smooth Animations**: Professional transitions and loading states
- **Intuitive Controls**: Easy-to-use modals for server creation and settings

### 🔧 Technical Excellence
- **FastAPI Backend**: High-performance Python API with async support
- **React Frontend**: Modern component-based UI with Tailwind CSS
- **Docker Integration**: Direct Docker SDK control for container management
- **WebSocket Streaming**: Low-latency log streaming
- **Cloudflare Tunnel**: Optional zero-trust public access with HTTPS

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- 4+ GB RAM recommended
- 20+ GB disk space for game servers

### Installation

**Linux/Mac:**
```bash
git clone <repository>
cd GameControl
chmod +x setup.sh
./setup.sh
```

**Windows:**
```bash
# Run with Git Bash or WSL
git clone <repository>
cd GameControl
bash setup.sh
```

Or manually:
```bash
cp .env.example .env
docker-compose build
docker-compose up -d
```

### Access

- **Web Panel**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Backend API**: http://localhost:8000

## 📖 Usage Guide

### Creating a Server

1. Click **"+ Create Server"** button
2. Fill in server configuration:
   - **Server Name**: Display name for your server
   - **Password**: Player login password
   - **Max Players**: 1-32 (default: 32)
   - **Description**: Server description
   - **Gameplay Settings**: Customize exp rate, capture rate, spawn rate
3. Click **"Create Server"** - Server will show "Installing" status
4. Wait 2-3 minutes for server to download and initialize
5. Status will change to "Running" when ready

### Managing Servers

**Quick Actions:**
- **Start**: Launch a stopped server
- **Stop**: Gracefully shut down a running server (30s grace period)
- **Restart**: Restart a running server
- **Console**: View live server logs in real-time
- **Settings**: Update gameplay settings (apply on next restart)
- **Delete**: Remove server and all data (irreversible)

**Monitoring:**
- View CPU usage percentage
- Monitor memory consumption (MB)
- Check player count vs max players
- Track when server was created

### Server Settings

Customize these gameplay parameters:

- **EXP Rate** (0.5x - 5x): How fast players gain experience
- **Pal Capture Rate** (0.5x - 5x): How easy it is to catch Pals
- **Pal Spawn Rate** (0.5x - 5x): How many Pals appear in the world
- **Admin Password**: For RCON console access

**Note**: Settings take effect after server restart.

### Console Viewer

- **Live Streaming**: Real-time server logs via WebSocket
- **Search**: Find specific log entries
- **Copy**: Copy all logs to clipboard
- **Download**: Export logs as text file
- **Auto-scroll**: Automatically follows latest logs

## 🌐 Public Access with Cloudflare Tunnel

Enable free HTTPS public access:

### Setup (One-time)

1. Install **cloudflared** CLI:
   ```bash
   # macOS
   brew install cloudflare/cloudflare/cloudflared
   
   # Linux
   curl -L --output cloudflared.tgz https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.tgz
   tar -xzf cloudflared.tgz
   
   # Windows
   choco install cloudflare-warp
   ```

2. Create tunnel:
   ```bash
   cloudflared tunnel create gamecontrol
   ```

3. Get tunnel token:
   ```bash
   cloudflared tunnel token gamecontrol
   ```

4. During setup or edit `.env`:
   ```bash
   CLOUDFLARE_TUNNEL_TOKEN=<your-token-here>
   ```

5. Route DNS:
   ```bash
   cloudflared tunnel route dns gamecontrol gamecontrol.yourdomain.com
   ```

6. Access at: `https://gamecontrol.yourdomain.com`

## 📊 API Documentation

Full API documentation available at: `http://localhost:8000/docs`

### Main Endpoints

```
POST   /api/servers              - Create server
GET    /api/servers              - List all servers
POST   /api/servers/{id}/start   - Start server
POST   /api/servers/{id}/stop    - Stop server
POST   /api/servers/{id}/restart - Restart server
DELETE /api/servers/{id}         - Delete server
PATCH  /api/servers/{id}/settings - Update settings
WS     /ws/logs/{id}             - Stream logs
GET    /health                   - Health check
```

## 🐳 Docker Compose Services

### Backend Service
- **Image**: `gamecontrol-backend:latest`
- **Port**: 8000
- **Volumes**: Docker socket, server data
- **Environment**: DATA_DIR, server config

### Frontend Service
- **Image**: `gamecontrol-frontend:latest`
- **Port**: 3000
- **Volumes**: Built static files
- **Environment**: API URL configuration

### Cloudflare Tunnel
- **Image**: `cloudflare/cloudflared:latest`
- **Function**: Public HTTPS tunnel
- **Token**: From `.env` (optional)

## 📁 Directory Structure

```
GameControl/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── requirements.txt         # Python dependencies
│   └── Dockerfile              # Backend container
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # Main React component
│   │   ├── main.jsx           # Entry point
│   │   ├── index.css          # Global styles
│   │   └── components/        # React components
│   ├── package.json           # NPM dependencies
│   ├── tailwind.config.js     # Tailwind configuration
│   ├── vite.config.js         # Vite build config
│   └── Dockerfile            # Frontend container
├── data/                       # Persistent server data
├── docker-compose.yml         # Multi-service orchestration
├── .env.example               # Environment template
└── setup.sh                   # Installation script
```

## 🎯 Palworld Server Details

### Port Mappings
- **8211 (UDP)**: Game server (changes per server: 8211, 8212, 8213...)
- **27015 (UDP)**: Steam query port (8211+10000, etc.)
- **25575 (TCP)**: RCON admin port (8211+100, etc.)

### Default Configuration
- **Max Players**: 32 (adjustable 1-32)
- **EXP Rate**: 1.0x (1x = normal)
- **Capture Rate**: 1.0x (1x = normal)
- **Spawn Rate**: 1.0x (1x = normal)
- **Updates**: Auto-update on boot enabled
- **Backups**: Automatic daily backups

### System Requirements
- **CPU**: 4+ cores (per server)
- **RAM**: 2-4 GB per server
- **Storage**: 30+ GB per server
- **Network**: Stable internet connection

## 🔒 Security Notes

### Current Version
- **No authentication** required (for prototype)
- Assumes trusted local/internal network
- Cloudflare Tunnel adds zero-trust layer

### Recommendations for Production
- Add JWT authentication
- Implement role-based access control
- Use HTTPS everywhere
- Implement rate limiting
- Add audit logging
- Regular security updates

## 🐛 Troubleshooting

### Services Won't Start
```bash
# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild images
docker-compose build --no-cache

# Fresh start
docker-compose down -v
docker-compose up -d
```

### Can't Access Web Panel
```bash
# Check if frontend is running
docker-compose ps

# Check frontend logs
docker-compose logs frontend

# Test API
curl http://localhost:8000/health
```

### Server Creation Fails
```bash
# Check Docker socket access
ls -la /var/run/docker.sock

# Check backend logs
docker-compose logs backend

# Ensure sufficient disk space
df -h

# Verify Docker daemon
docker ps
```

### WebSocket Console Not Connecting
```bash
# Check WebSocket connectivity
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  http://localhost:8000/ws/logs/palworld-20240115-120000

# Check for firewall issues
sudo ufw allow 8000/tcp
```

## 📈 Performance Tips

1. **Resource Allocation**: Give backend container 2+ CPU cores
2. **Network**: Use wired connection for stable performance
3. **Storage**: SSD recommended for server data volumes
4. **Monitoring**: Check Docker stats regularly
   ```bash
   docker stats gamecontrol-backend gamecontrol-frontend
   ```

5. **Cleanup**: Remove old server volumes
   ```bash
   docker volume prune
   ```

## 🚀 Roadmap & Future Features

- [ ] Multi-game support (Valheim, Satisfactory, etc.)
- [ ] User authentication and roles
- [ ] Advanced scheduling (auto-backups, auto-restart)
- [ ] Discord notifications
- [ ] Performance graphs and analytics
- [ ] Player management (kick, ban, whitelist)
- [ ] World backups and restore
- [ ] Multiple region support
- [ ] Database persistence layer
- [ ] Mobile app companion

## 🤝 Contributing

This is an open-source project. Contributions welcome!

- Report bugs as GitHub issues
- Submit improvements via pull requests
- Help with documentation

## 📝 License

MIT License - Use freely for personal and commercial projects.

## 💬 Support

- **Issues**: GitHub Issues tab
- **Discussions**: GitHub Discussions
- **Documentation**: Full API docs at `/docs`

## 🎓 Learning Resources

- [Palworld Dedicated Server Guide](https://docs.palworldgame.com/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Docker Documentation](https://docs.docker.com/)

---

**Made with ❤️ for game server enthusiasts**

Built with FastAPI, React, Tailwind CSS, Docker, and open-source passion.