import asyncio
import json
import os
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional, List
import docker
from docker.errors import DockerException
from fastapi import FastAPI, WebSocket, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
DATA_DIR = Path(os.getenv("DATA_DIR", "/gamecontrol/data"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

GAME_SERVERS_DIR = DATA_DIR / "game_servers"
GAME_SERVERS_DIR.mkdir(exist_ok=True)

PORT_MAPPING_FILE = DATA_DIR / "port_mapping.json"
NEXT_PORT = 8211

# Initialize FastAPI app
app = FastAPI(title="GameControl API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Docker client
# Try to connect to Docker daemon via Unix socket
docker_client = None
try:
    # First, try auto-detection with from_env
    docker_client = docker.from_env(timeout=10)
    logger.info("Connected to Docker daemon")
except DockerException as e:
    logger.error(f"Failed to connect to Docker: {e}")
    # Fallback: try explicit Unix socket
    try:
        docker_client = docker.DockerClient(
            base_url='unix:///var/run/docker.sock',
            timeout=10
        )
        logger.info("Connected to Docker daemon via explicit socket")
    except Exception as e2:
        logger.error(f"Failed to connect via explicit socket: {e2}")
        docker_client = None

# ==================== Models ====================

class ServerConfig(BaseModel):
    server_name: str
    server_password: str
    max_players: int = 32
    description: str = "Palworld Server"
    exp_rate: float = 1.0
    pal_capture_rate: float = 1.0
    pal_spawn_num_rate: float = 1.0

class ServerSettings(BaseModel):
    exp_rate: Optional[float] = None
    pal_capture_rate: Optional[float] = None
    pal_spawn_num_rate: Optional[float] = None
    admin_password: Optional[str] = None

class ServerInfo(BaseModel):
    server_id: str
    server_name: str
    status: str
    port: int
    max_players: int
    description: str
    created_at: str
    cpu_percent: float
    memory_mb: float

# ==================== Port Management ====================

def load_port_mapping() -> dict:
    """Load port mapping from file"""
    if PORT_MAPPING_FILE.exists():
        try:
            with open(PORT_MAPPING_FILE, 'r') as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_port_mapping(mapping: dict) -> None:
    """Save port mapping to file"""
    with open(PORT_MAPPING_FILE, 'w') as f:
        json.dump(mapping, f, indent=2)

def get_next_available_port() -> int:
    """Get next available port sequentially"""
    port_mapping = load_port_mapping()
    used_ports = set(int(p) for p in port_mapping.values())
    
    port = NEXT_PORT
    while port in used_ports:
        port += 1
    
    return port

# ==================== Server Management ====================

def get_container_stats(container_id: str) -> tuple[float, float]:
    """Get CPU and memory usage for container"""
    try:
        container = docker_client.containers.get(container_id)
        stats = container.stats(stream=False)
        
        # Calculate CPU percentage
        cpu_delta = stats['cpu_stats']['cpu_usage']['total_usage'] - \
                    stats['precpu_stats']['cpu_usage']['total_usage']
        system_delta = stats['cpu_stats']['system_cpu_usage'] - \
                      stats['precpu_stats']['system_cpu_usage']
        cpu_percent = (cpu_delta / system_delta) * len(stats['cpu_stats']['cpus']) * 100.0
        
        # Calculate memory in MB
        memory_mb = stats['memory_stats']['usage'] / 1024 / 1024
        
        return cpu_percent, memory_mb
    except Exception as e:
        logger.error(f"Error getting stats for {container_id}: {e}")
        return 0.0, 0.0

def load_server_config(server_id: str) -> Optional[dict]:
    """Load server configuration from file"""
    config_file = GAME_SERVERS_DIR / server_id / "config.json"
    if config_file.exists():
        try:
            with open(config_file, 'r') as f:
                return json.load(f)
        except:
            return None
    return None

def save_server_config(server_id: str, config: dict) -> None:
    """Save server configuration to file"""
    server_dir = GAME_SERVERS_DIR / server_id
    server_dir.mkdir(exist_ok=True)
    
    config_file = server_dir / "config.json"
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)

# ==================== API Endpoints ====================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "docker_connected": docker_client is not None,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/servers")
async def create_server(config: ServerConfig, background_tasks: BackgroundTasks):
    """Create a new game server"""
    if not docker_client:
        raise HTTPException(status_code=500, detail="Docker not connected")
    
    try:
        server_id = f"palworld-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        port = get_next_available_port()
        
        # Get port mapping and save it
        port_mapping = load_port_mapping()
        port_mapping[server_id] = str(port)
        save_port_mapping(port_mapping)
        
        # Create server directory
        server_dir = GAME_SERVERS_DIR / server_id
        server_dir.mkdir(exist_ok=True)
        
        # Save configuration
        config_data = {
            "server_id": server_id,
            "server_name": config.server_name,
            "server_password": config.server_password,
            "admin_password": "adminPass123",
            "max_players": config.max_players,
            "description": config.description,
            "port": port,
            "exp_rate": config.exp_rate,
            "pal_capture_rate": config.pal_capture_rate,
            "pal_spawn_num_rate": config.pal_spawn_num_rate,
            "status": "installing",
            "created_at": datetime.utcnow().isoformat()
        }
        save_server_config(server_id, config_data)
        
        # Run container creation in background
        background_tasks.add_task(
            run_container,
            server_id,
            port,
            config
        )
        
        return {
            "server_id": server_id,
            "status": "installing",
            "port": port,
            "message": "Server creation started"
        }
    
    except Exception as e:
        logger.error(f"Error creating server: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def run_container(server_id: str, port: int, config: ServerConfig):
    """Run the Palworld container"""
    try:
        server_dir = GAME_SERVERS_DIR / server_id
        config_data = load_server_config(server_id)
        
        # Pull latest image
        logger.info(f"Pulling Docker image for {server_id}...")
        docker_client.images.pull("thijsvanloef/palworld-server-docker:latest")
        
        # Create and start container
        logger.info(f"Creating container for {server_id}...")
        container = docker_client.containers.run(
            "thijsvanloef/palworld-server-docker:latest",
            name=server_id,
            detach=True,
            restart_policy={"Name": "unless-stopped"},
            stop_grace_period=30,
            ports={
                "8211/udp": port,
                "27015/udp": port + 10000,
                "25575/tcp": port + 100
            },
            volumes={
                str(server_dir / "data"): {"bind": "/palworld", "mode": "rw"}
            },
            environment={
                "PUID": "1000",
                "PGID": "1000",
                "PORT": "8211",
                "PLAYERS": str(config.max_players),
                "SERVER_PASSWORD": config.server_password,
                "ADMIN_PASSWORD": config_data["admin_password"],
                "SERVER_NAME": config.server_name,
                "SERVER_DESCRIPTION": config.description,
                "MULTITHREADING": "true",
                "UPDATE_ON_BOOT": "true",
                "RCON_ENABLED": "true",
                "RCON_PORT": "25575",
                "COMMUNITY": "false",
                "EXP_RATE": str(config.exp_rate),
                "PAL_CAPTURE_RATE": str(config.pal_capture_rate),
                "PAL_SPAWN_NUM_RATE": str(config.pal_spawn_num_rate),
                "TZ": "UTC"
            }
        )
        
        config_data["status"] = "running"
        config_data["container_id"] = container.id
        save_server_config(server_id, config_data)
        
        logger.info(f"Server {server_id} started successfully")
    
    except Exception as e:
        logger.error(f"Error running container for {server_id}: {e}")
        config_data = load_server_config(server_id)
        if config_data:
            config_data["status"] = "error"
            config_data["error"] = str(e)
            save_server_config(server_id, config_data)

@app.get("/api/servers")
async def list_servers() -> List[ServerInfo]:
    """List all game servers"""
    try:
        servers = []
        
        if not GAME_SERVERS_DIR.exists():
            return servers
        
        for server_dir in GAME_SERVERS_DIR.iterdir():
            if server_dir.is_dir():
                config = load_server_config(server_dir.name)
                if config:
                    cpu_percent, memory_mb = 0.0, 0.0
                    
                    if config.get("container_id"):
                        try:
                            container = docker_client.containers.get(config["container_id"])
                            # Get actual container status
                            config["status"] = container.status
                            cpu_percent, memory_mb = get_container_stats(config["container_id"])
                        except:
                            config["status"] = "error"
                    
                    servers.append(ServerInfo(
                        server_id=server_dir.name,
                        server_name=config.get("server_name", "Unknown"),
                        status=config.get("status", "unknown"),
                        port=config.get("port", 0),
                        max_players=config.get("max_players", 32),
                        description=config.get("description", ""),
                        created_at=config.get("created_at", ""),
                        cpu_percent=cpu_percent,
                        memory_mb=memory_mb
                    ))
        
        return servers
    
    except Exception as e:
        logger.error(f"Error listing servers: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/servers/{server_id}/start")
async def start_server(server_id: str):
    """Start a server"""
    try:
        config = load_server_config(server_id)
        if not config:
            raise HTTPException(status_code=404, detail="Server not found")
        
        container_id = config.get("container_id")
        if container_id:
            container = docker_client.containers.get(container_id)
            if container.status != "running":
                container.start()
                return {"status": "started", "server_id": server_id}
        
        return {"status": "already running", "server_id": server_id}
    
    except Exception as e:
        logger.error(f"Error starting server {server_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/servers/{server_id}/stop")
async def stop_server(server_id: str):
    """Stop a server"""
    try:
        config = load_server_config(server_id)
        if not config:
            raise HTTPException(status_code=404, detail="Server not found")
        
        container_id = config.get("container_id")
        if container_id:
            container = docker_client.containers.get(container_id)
            if container.status == "running":
                container.stop(timeout=30)
                return {"status": "stopped", "server_id": server_id}
        
        return {"status": "already stopped", "server_id": server_id}
    
    except Exception as e:
        logger.error(f"Error stopping server {server_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/servers/{server_id}/restart")
async def restart_server(server_id: str):
    """Restart a server"""
    try:
        config = load_server_config(server_id)
        if not config:
            raise HTTPException(status_code=404, detail="Server not found")
        
        container_id = config.get("container_id")
        if container_id:
            container = docker_client.containers.get(container_id)
            container.restart(timeout=30)
            return {"status": "restarting", "server_id": server_id}
        
        raise HTTPException(status_code=400, detail="Server not running")
    
    except Exception as e:
        logger.error(f"Error restarting server {server_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/servers/{server_id}")
async def delete_server(server_id: str):
    """Delete a server and its volume"""
    try:
        config = load_server_config(server_id)
        if not config:
            raise HTTPException(status_code=404, detail="Server not found")
        
        container_id = config.get("container_id")
        if container_id:
            container = docker_client.containers.get(container_id)
            if container.status == "running":
                container.stop(timeout=30)
            container.remove(v=True, force=True)
        
        # Remove server directory
        server_dir = GAME_SERVERS_DIR / server_id
        if server_dir.exists():
            import shutil
            shutil.rmtree(server_dir)
        
        # Remove from port mapping
        port_mapping = load_port_mapping()
        if server_id in port_mapping:
            del port_mapping[server_id]
            save_port_mapping(port_mapping)
        
        return {"status": "deleted", "server_id": server_id}
    
    except Exception as e:
        logger.error(f"Error deleting server {server_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.patch("/api/servers/{server_id}/settings")
async def update_settings(server_id: str, settings: ServerSettings):
    """Update server settings"""
    try:
        config = load_server_config(server_id)
        if not config:
            raise HTTPException(status_code=404, detail="Server not found")
        
        # Update settings
        if settings.exp_rate is not None:
            config["exp_rate"] = settings.exp_rate
        if settings.pal_capture_rate is not None:
            config["pal_capture_rate"] = settings.pal_capture_rate
        if settings.pal_spawn_num_rate is not None:
            config["pal_spawn_num_rate"] = settings.pal_spawn_num_rate
        if settings.admin_password is not None:
            config["admin_password"] = settings.admin_password
        
        save_server_config(server_id, config)
        
        return {"status": "updated", "server_id": server_id}
    
    except Exception as e:
        logger.error(f"Error updating settings for {server_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/logs/{server_id}")
async def websocket_logs(websocket: WebSocket, server_id: str):
    """WebSocket endpoint for live server logs"""
    await websocket.accept()
    
    try:
        config = load_server_config(server_id)
        if not config:
            await websocket.send_json({"error": "Server not found"})
            await websocket.close()
            return
        
        container_id = config.get("container_id")
        if not container_id:
            await websocket.send_json({"error": "Container not found"})
            await websocket.close()
            return
        
        container = docker_client.containers.get(container_id)
        
        # Stream logs
        for line in container.logs(stream=True, follow=True):
            try:
                message = line.decode('utf-8').strip()
                if message:
                    await websocket.send_json({
                        "type": "log",
                        "message": message,
                        "timestamp": datetime.utcnow().isoformat()
                    })
            except Exception as e:
                logger.error(f"Error streaming logs: {e}")
                break
    
    except Exception as e:
        logger.error(f"WebSocket error for {server_id}: {e}")
        await websocket.send_json({"error": str(e)})
    finally:
        await websocket.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)