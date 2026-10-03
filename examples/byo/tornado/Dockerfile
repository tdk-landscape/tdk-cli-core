# A minimal Tornado app (Tornado has no project generator, so the app is the files next to this Dockerfile).
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py ./
# app.py binds 0.0.0.0 and reads PORT, which TDK sets.
CMD ["python", "app.py"]
