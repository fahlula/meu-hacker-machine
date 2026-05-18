FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm install --legacy-peer-deps

COPY backend/tsconfig.json ./
COPY backend/src ./src
COPY exercises ./exercises

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
