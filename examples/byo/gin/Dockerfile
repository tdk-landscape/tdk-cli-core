# A minimal Gin app (Gin has no project generator, so the app is the two files next to this Dockerfile).
FROM golang:1.25-alpine AS build
WORKDIR /src
COPY go.mod main.go ./
# `go mod tidy` resolves Gin and writes go.sum at build time, so no go.sum is committed.
RUN go mod tidy && CGO_ENABLED=0 go build -o /out/app .

FROM alpine:3.20
ENV GIN_MODE=release
COPY --from=build /out/app /app
CMD ["/app"]
