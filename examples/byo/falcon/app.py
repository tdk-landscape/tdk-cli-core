import falcon.asgi


class Health:
    async def on_get(self, req, resp):
        resp.media = {"status": "ok", "service": "falcon"}


class Root:
    async def on_get(self, req, resp):
        resp.media = {"service": "falcon", "endpoints": ["/health"]}


app = falcon.asgi.App()
app.add_route("/health", Health())
app.add_route("/", Root())
