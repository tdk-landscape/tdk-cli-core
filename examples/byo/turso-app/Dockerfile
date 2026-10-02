# A small Node service that talks to Turso's server (examples/byo/turso) with @libsql/client over HTTP.
FROM node:22-slim
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY server.mjs ./
# Override at run time if the Turso resource has another name or port.
ENV LIBSQL_URL=http://turso:4500
CMD ["node", "server.mjs"]
