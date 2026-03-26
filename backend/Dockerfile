# Use Java 17
FROM openjdk:17-jdk-slim

WORKDIR /app

# Copy jar file
COPY target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","app.jar"]
