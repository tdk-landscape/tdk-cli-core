# A minimal Echo v4 app (Echo has no project generator, so the app is the two files next to this Dockerfile).
FROM golang:1.25-alpine AS build
WORKDIR /src
COPY go.mod main.go ./
# `go mod tidy` resolves Echo and writes go.sum at build time, so no go.sum is committed.
RUN go mod tidy && CGO_ENABLED=0 go build -o /out/app .

FROM alpine:3.20
COPY --from=build /out/app /app
CMD ["/app"]
