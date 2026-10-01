FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py ./
# Shell form so $PORT is expanded at start-up.
CMD uvicorn app:app --host 0.0.0.0 --port ${PORT:-3000}
