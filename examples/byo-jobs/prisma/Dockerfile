# One-shot migration job: `prisma migrate deploy` applies prisma/migrations to TDK's Postgres and exits 0.
FROM node:22-alpine
RUN apk add --no-cache openssl
WORKDIR /job
# Prisma 6; Prisma 7 moved the datasource URL into prisma.config.ts.
RUN npm install --no-audit --no-fund prisma@6
COPY prisma ./prisma
# TDK's DATABASE_URL is already Prisma-style (?schema=public), so it is used as is.
CMD ["npx", "prisma", "migrate", "deploy"]
