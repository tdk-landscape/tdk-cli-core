# One-shot migration job: `mikro-orm migration:up` applies migrations/ to TDK's Postgres and exits 0.
FROM node:22-alpine
WORKDIR /job
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY mikro-orm.config.js ./
COPY migrations ./migrations
ENV MIKRO_ORM_CLI_CONFIG=./mikro-orm.config.js
CMD ["npx", "mikro-orm", "migration:up"]
