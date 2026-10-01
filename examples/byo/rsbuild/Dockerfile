# A real create-rsbuild app: the scaffolder runs at build time.
FROM node:22-alpine
WORKDIR /work
RUN npm create rsbuild@latest -- --dir app --template react-ts --tools none
WORKDIR /work/app
RUN npm install
CMD npx rsbuild dev --host 0.0.0.0 --port ${PORT:-3000}
