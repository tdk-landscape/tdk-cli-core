import os

from fastapi import FastAPI

app = FastAPI(title="api-backend")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "api-backend"}


@app.get("/")
def root() -> dict[str, object]:
    return {"service": "api-backend", "version": "1.0.0", "endpoints": ["/health"]}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "3000")))
