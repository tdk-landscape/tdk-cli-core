import Hapi from "@hapi/hapi";

// Bring-your-own contract: read PORT, bind 0.0.0.0, answer a health route.
const server = Hapi.server({
  port: Number(process.env.PORT ?? 3000),
  host: "0.0.0.0",
});

server.route({
  method: "GET",
  path: "/health",
  handler: () => ({ status: "ok", service: "hapi" }),
});

server.route({
  method: "GET",
  path: "/",
  handler: () => ({ service: "hapi", endpoints: ["/health"] }),
});

await server.start();
console.log(`hapi listening on ${server.info.uri}`);
