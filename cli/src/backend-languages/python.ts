import type { BackendLanguageProvider } from "./types.js";

export const PYTHON_DEV_COMMAND =
  "uvicorn main:app --app-dir src --host 0.0.0.0 --port ${PORT:-3000} --reload --reload-dir src";

export const pythonBackendProvider: BackendLanguageProvider = {
  id: "python",
  label: "Python 3.12 + FastAPI",
  devCommand: PYTHON_DEV_COMMAND,
  watch: ["src/**/*"],
  installHint: 'pip install -e ".[dev]"   # optional: Docker builds the image for you',
  createFiles(name) {
    return [
      {
        filename: "pyproject.toml",
        content: `[project]
name = "${name}"
version = "0.0.1"
requires-python = ">=3.12"
dependencies = [
  "fastapi==0.115.6",
  "uvicorn[standard]==0.34.0",
]

[project.optional-dependencies]
dev = [
  "pytest==8.3.4",
  "httpx==0.28.1",
]

[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

# Only the dependencies are installed into the image; the source is synced for live reload.
[tool.setuptools]
py-modules = []

[tool.pytest.ini_options]
pythonpath = ["src"]
testpaths = ["tests"]
`,
        description: "Generating pyproject.toml",
        emoji: "📦",
      },
      {
        filename: "src/main.py",
        content: `import os

from fastapi import FastAPI

app = FastAPI(title="${name}")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "${name}"}


@app.get("/")
def root() -> dict[str, object]:
    return {"service": "${name}", "version": "1.0.0", "endpoints": ["/health"]}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", "3000")))
`,
        description: "Generating backend source",
        emoji: "💻",
      },
      {
        filename: "tests/test_health.py",
        content: `from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "${name}"}
`,
        description: "Generating test file",
        emoji: "🧪",
      },
      {
        filename: "Dockerfile",
        content: `FROM python:3.12-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends curl \\
  && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
RUN pip install --no-cache-dir .

COPY src ./src

FROM base AS test
RUN pip install --no-cache-dir ".[dev]"
COPY tests ./tests
RUN pytest

FROM base AS production

HEALTHCHECK --interval=10s --timeout=5s --retries=3 \\
  CMD curl -f http://localhost:\${PORT:-3000}/health || exit 1

EXPOSE 3000

CMD ["sh", "-c", "${PYTHON_DEV_COMMAND.replaceAll('"', '\\"')}"]
`,
        description: "Generating Dockerfile",
        emoji: "🐳",
      },
    ];
  },
};
