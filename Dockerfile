# Railway 전용 Dockerfile with ImageMagick
FROM node:20-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    imagemagick \
    ghostscript \
    libgs-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Configure ImageMagick security policy
RUN sed -i 's/<policy domain="coder" rights="none" pattern="PDF" \/>/<policy domain="coder" rights="read|write" pattern="PDF" \/>/g' /etc/ImageMagick-6/policy.xml

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start command
CMD ["npm", "run", "start:railway"]