# A real create-adonisjs app (slim starter kit, no database): the scaffolder runs at build time.
FROM node:22-alpine
RUN apk add --no-cache git
WORKDIR /work
RUN npm create adonisjs@latest app -- --kit=github:adonisjs/slim-starter-kit --pkg=npm --skip-migrations </dev/null
WORKDIR /work/app
# The app reads PORT and HOST from the environment; HOST must be beyond loopback.
ENV HOST=0.0.0.0
CMD ["npm", "run", "dev"]
