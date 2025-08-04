# Multi-stage build for Confessly
FROM node:18-alpine AS base

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install root dependencies
RUN npm ci --only=production

# Copy server package files
COPY server/package*.json ./server/

# Install server dependencies
RUN cd server && npm ci --only=production

# Copy client package files
COPY client/package*.json ./client/

# Install client dependencies (including dev dependencies for build)
RUN cd client && npm ci --include=dev

# Copy source code
COPY . .

# Build the React app
RUN cd client && npm run build

# Create production stage
FROM node:18-alpine AS production

# Install curl for health checks
RUN apk add --no-cache curl nginx

WORKDIR /app

# Copy built React app to nginx
COPY --from=base /app/client/build /usr/share/nginx/html

# Copy nginx configuration
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

# Copy server files
COPY --from=base /app/server ./server
COPY --from=base /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production
RUN cd server && npm ci --only=production

# Create necessary directories
RUN mkdir -p data uploads

# Expose ports
EXPOSE 5000 3000

# Create startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'nginx &' >> /app/start.sh && \
    echo 'cd /app/server && node index.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Start both nginx and the server
CMD ["/app/start.sh"] 