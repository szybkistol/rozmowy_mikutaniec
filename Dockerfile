# Stage 1: Build
FROM node:20-alpine as builder

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

# Argument for API Key (required during build time for Vite)
ARG GEMINI_API_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY

RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
