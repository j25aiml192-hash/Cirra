FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DISABLE_SQLALCHEMY_CEXT=1

COPY pyproject.toml README.md ./
RUN pip install --no-cache-dir .

COPY app/ ./app/

CMD ["python", "-m", "app.main"]
