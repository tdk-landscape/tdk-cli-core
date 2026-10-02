# A real express-generator app (no view engine): the scaffolder runs at build time.
FROM node:22-alpine
WORKDIR /work
RUN npx --yes express-generator@4 app --no-view
WORKDIR /work/app
RUN npm install
# The generated bin/www reads PORT and listens on all interfaces.
CMD ["node", "./bin/www"]
