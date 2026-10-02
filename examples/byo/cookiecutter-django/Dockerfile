# A real cookiecutter-django project (no Docker, no Celery, no mail catcher): the generator runs at build time.
FROM python:3.12
ENV PYTHONUNBUFFERED=1
COPY --from=ghcr.io/astral-sh/uv:0.9.26 /uv /uvx /bin/
RUN pip install --no-cache-dir cookiecutter
WORKDIR /work
RUN cookiecutter gh:cookiecutter/cookiecutter-django --no-input project_name="TDK Demo" project_slug=app \
    use_docker=n use_celery=n use_mailpit=n frontend_pipeline=None
WORKDIR /work/app
RUN uv sync --frozen
ENV PATH="/work/app/.venv/bin:$PATH"
COPY tdk_settings.py config/settings/tdk.py
COPY ensure_db.py entrypoint.sh /
CMD ["sh", "/entrypoint.sh"]
