
#!/bin/bash

# Build script for Docker
echo "🐳 Building LSB Biblioteca Docker image..."

# Build the production image
docker build -t lsb-biblioteca:latest .

# Tag with version if provided
if [ "$1" ]; then
    docker tag lsb-biblioteca:latest lsb-biblioteca:$1
    echo "✅ Tagged image as lsb-biblioteca:$1"
fi

echo "✅ Docker image built successfully!"
echo "📋 To run the container:"
echo "   docker run -p 3000:80 lsb-biblioteca:latest"
echo "📋 To run with docker-compose:"
echo "   docker-compose up"
