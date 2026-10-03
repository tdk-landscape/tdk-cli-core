import asyncio
import os

import tornado.web


class Health(tornado.web.RequestHandler):
    def get(self):
        self.write({"status": "ok", "service": "tornado"})


class Root(tornado.web.RequestHandler):
    def get(self):
        self.write({"service": "tornado", "endpoints": ["/health"]})


async def main():
    app = tornado.web.Application([(r"/health", Health), (r"/", Root)])
    # Bring-your-own contract: read PORT, bind 0.0.0.0, answer a health route.
    app.listen(int(os.environ.get("PORT", "8888")), address="0.0.0.0")
    await asyncio.Event().wait()


if __name__ == "__main__":
    asyncio.run(main())
