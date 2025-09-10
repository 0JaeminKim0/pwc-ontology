# Railway 배포용 Dockerfile - 독립 서버 전용
FROM node:18-alpine

WORKDIR /app

# Install only runtime dependencies (no build needed)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code and static files
COPY . .

# Create dist directory (no build processes needed)
RUN mkdir -p dist

# Expose port
EXPOSE 3000

# Start command for Railway - use independent server
CMD ["node", "railway-server.js"]