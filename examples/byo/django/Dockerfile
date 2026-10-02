# A real `django-admin startproject` app (default SQLite, no external database): the generator runs at build time.
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1
WORKDIR /work
RUN pip install --no-cache-dir django \
 && django-admin startproject app . \
 && python manage.py migrate --noinput
# runserver must listen beyond loopback (0.0.0.0) and on the port TDK assigns.
CMD ["sh", "-c", "python manage.py runserver 0.0.0.0:${PORT:-8000} --noreload"]
