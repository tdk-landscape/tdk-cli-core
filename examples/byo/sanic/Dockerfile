# A minimal Sanic app (Sanic has no project generator, so the app is the files next to this Dockerfile).
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py ./
# The server must listen beyond loopback (--host) and on the port TDK assigns.
CMD ["sh", "-c", "sanic app:app --host 0.0.0.0 --port ${PORT:-8000} --single-process"]
