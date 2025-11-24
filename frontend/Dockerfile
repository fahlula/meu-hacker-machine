FROM node:20-alpine

WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies with legacy peer deps flag (this layer will be cached)
RUN npm install --legacy-peer-deps

# Copy config files
COPY tsconfig.json ./
COPY tsconfig.node.json ./
COPY vite.config.ts ./

# Copy source code
COPY src ./src
COPY index.html ./

# Expose port
EXPOSE 3000

# Start dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
