ARG NODE_VERSION=22-alpine
FROM node:${NODE_VERSION} AS base


WORKDIR /app


RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 -G nodejs && \
    chown -R nodejs:nodejs /app


FROM base AS deps


COPY package*.json ./


RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --omit=dev

RUN chown -R nodejs:nodejs /app


#BUILD DEPEDENCIES STAGE

FROM base AS build-deps


COPY package*.json ./


RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci --no-audit --no-fund


COPY --chown=nodejs:nodejs . .


RUN npm run build


RUN chown -R nodejs:nodejs /app


# DEVELOPMENT STAGE

FROM build-deps as development


ENV NODE_ENV=development \
    NPM_CONFIG_LOGLEVEL=warn


COPY . .

# Ensure all directories have proper permissions
RUN mkdir -p /app/node_modules/.vite && \
    chown -R nodejs:nodejs /app && \
    chmod -R 755 /app

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3000

# Start development server

CMD ["npm", "run", "start"]


