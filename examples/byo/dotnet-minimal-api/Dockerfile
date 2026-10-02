# A real `dotnet new web` project (ASP.NET Core minimal API): the template is generated at build time.
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ENV DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_NOLOGO=1
WORKDIR /src
RUN dotnet new web --name App --output . --no-restore \
 && dotnet publish -c Release -o /out
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /out .
# Kestrel must listen beyond loopback (0.0.0.0) and on the port TDK assigns.
CMD ["sh", "-c", "ASPNETCORE_URLS=http://0.0.0.0:${PORT:-8080} exec dotnet App.dll"]
