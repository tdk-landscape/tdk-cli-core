# A real Spring Initializr project (Maven, Java, Spring Web + Actuator, no database), downloaded at build time.
FROM maven:3-eclipse-temurin-21 AS build
WORKDIR /work
RUN apt-get update -qq && apt-get install -y -qq curl unzip >/dev/null \
 && curl -fsSL https://start.spring.io/starter.zip \
      -d type=maven-project -d language=java -d name=app -d artifactId=app -d groupId=dev.tdk \
      -d dependencies=web,actuator -o starter.zip \
 && unzip -q starter.zip && rm starter.zip
RUN mvn -q -B -DskipTests package && ls target/*.jar

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /work/target/app-*.jar /app/app.jar
# Spring binds all interfaces by default; the port comes from SERVER_PORT, which we set from TDK's PORT.
CMD ["sh", "-c", "SERVER_PORT=${PORT:-8080} exec java -jar /app/app.jar"]
