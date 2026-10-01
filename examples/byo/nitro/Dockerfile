FROM node:22-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/.output ./.output
# Nitro's node server reads PORT and HOST from the environment.
ENV HOST=0.0.0.0
CMD ["node", ".output/server/index.mjs"]
