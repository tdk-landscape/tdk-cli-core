from sanic import Sanic
from sanic.response import json

app = Sanic("sanic-example")


@app.get("/health")
async def health(request):
    return json({"status": "ok", "service": "sanic"})


@app.get("/")
async def root(request):
    return json({"service": "sanic", "endpoints": ["/health"]})
