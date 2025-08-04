FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p data uploads

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "run", "dev"] 