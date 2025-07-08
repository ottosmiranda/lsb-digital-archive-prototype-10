
#!/bin/bash

# Development script for Docker
echo "🐳 Starting LSB Biblioteca development environment..."

# Build and run development container
docker-compose --profile dev up --build lsb-biblioteca-dev

echo "🚀 Development server running at http://localhost:5173"
