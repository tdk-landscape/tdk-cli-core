# One-shot migration job: `typeorm migration:run` applies migrations/ to TDK's Postgres and exits 0.
FROM node:22-alpine
WORKDIR /job
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY data-source.js ensure-db.js ./
COPY migrations ./migrations
CMD ["sh", "-c", "node ensure-db.js && npx typeorm migration:run -d data-source.js"]
