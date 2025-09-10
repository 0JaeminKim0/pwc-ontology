# Railway 배포용 Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies (build에 필요한 devDependencies 포함)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Build inline HTML for Railway static file workaround
RUN npm run build:inline

# Remove devDependencies to reduce image size (build 후)
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start command for Railway - use independent server
CMD ["node", "railway-server.js"]