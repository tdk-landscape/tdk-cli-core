import polka from "polka";

const send = (res, body) => {
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
};

// Bring-your-own contract: read PORT, bind 0.0.0.0, answer a health route.
polka()
  .get("/health", (_req, res) => send(res, { status: "ok", service: "polka" }))
  .get("/", (_req, res) => send(res, { service: "polka", endpoints: ["/health"] }))
  .listen(Number(process.env.PORT ?? 3000), "0.0.0.0", () => {
    console.log("polka listening");
  });
