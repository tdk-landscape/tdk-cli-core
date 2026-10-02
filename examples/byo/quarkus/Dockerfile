# A real Quarkus project from the Quarkus generator (code.quarkus.io: Maven, REST + SmallRye Health, no database),
# downloaded at build time.
FROM maven:3-eclipse-temurin-21 AS build
WORKDIR /work
RUN apt-get update -qq && apt-get install -y -qq curl unzip >/dev/null \
 && curl -fsSL "https://code.quarkus.io/d?g=dev.tdk&a=app&b=MAVEN&e=rest&e=smallrye-health&nc=true" -o starter.zip \
 && unzip -q starter.zip && rm starter.zip && ls
WORKDIR /work/app
RUN mvn -q -B -DskipTests package && ls target/quarkus-app

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /work/app/target/quarkus-app/ /app/
# Quarkus listens on 0.0.0.0 by default in a packaged jar; the port comes from QUARKUS_HTTP_PORT, set from TDK's PORT.
CMD ["sh", "-c", "QUARKUS_HTTP_PORT=${PORT:-8080} exec java -jar /app/quarkus-run.jar"]
