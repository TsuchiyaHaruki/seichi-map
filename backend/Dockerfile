# 本番用イメージ(compose.prod.yml から利用)
# テストはDBが必要なためイメージビルドでは実行しない。ビルド前にローカルで ./mvnw clean verify を実行する。

FROM eclipse-temurin:21-jdk AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN ./mvnw -B -q dependency:go-offline
COPY src src
RUN ./mvnw -B -q package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --no-create-home app \
    && mkdir -p /data/spot-images \
    && chown app /data/spot-images
COPY --from=build /app/target/*.jar app.jar
USER app
ENV SPOT_IMAGE_DIR=/data/spot-images
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
