from starlette.applications import Starlette
from starlette.responses import JSONResponse
from starlette.routing import Route


async def health(request):
    return JSONResponse({"status": "ok", "service": "starlette"})


async def root(request):
    return JSONResponse({"service": "starlette", "endpoints": ["/health"]})


app = Starlette(routes=[Route("/health", health), Route("/", root)])
