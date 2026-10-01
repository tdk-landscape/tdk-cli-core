from litestar import Litestar, get


@get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@get("/orders")
async def orders() -> list[dict[str, object]]:
    return [{"id": 1, "item": "tea"}]


app = Litestar(route_handlers=[health, orders])
