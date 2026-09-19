# syntax=docker/dockerfile:1

# ---- Build stage -----------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

# Vite reads VITE_* vars from .env in the project root automatically, so
# copying the existing (untouched) .env into the build context is enough.
# ARG below is only an *optional* override hook for docker-compose — if it
# is passed, it's written to .env.local, which Vite loads with higher
# precedence than .env. If it's not passed, nothing is written and Vite
# just uses the existing .env file as-is.
ARG VITE_API_BASE_URL=""
COPY . .
RUN if [ -n "$VITE_API_BASE_URL" ]; then \
      echo "VITE_API_BASE_URL=$VITE_API_BASE_URL" >> .env.local; \
    fi
RUN npm run build

# ---- Serve stage -------------------------------------------------------
FROM nginx:1.27-alpine AS serve

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
