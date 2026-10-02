# A real ember-cli app from the Vite blueprint: the scaffolder runs at build time.
FROM node:22-alpine
RUN apk add --no-cache git
WORKDIR /work
RUN npx --yes ember-cli@latest new tdk-ember-app --blueprint @ember/app-blueprint --skip-git --skip-npm
WORKDIR /work/tdk-ember-app
RUN npm install
# Vite must listen beyond loopback (--host) and on the port TDK assigns.
CMD ["sh", "-c", "npx vite --host 0.0.0.0 --port ${PORT:-4200}"]
