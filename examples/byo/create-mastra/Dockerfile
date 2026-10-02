# A real create-mastra project (empty template): the scaffolder runs at build time.
FROM node:22-alpine
RUN apk add --no-cache git
WORKDIR /work
RUN npm create mastra@latest app -- --empty --no-git --no-skills --no-install
WORKDIR /work/app
RUN npm install && grep -A8 '"scripts"' package.json
CMD ["npm", "run", "dev"]
