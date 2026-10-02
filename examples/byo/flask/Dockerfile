# A minimal Flask app (Flask has no project generator, so the app is the two files next to this Dockerfile).
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 FLASK_APP=app
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py ./
# flask run must listen beyond loopback (--host) and on the port TDK assigns.
CMD ["sh", "-c", "flask run --host 0.0.0.0 --port ${PORT:-5000}"]
