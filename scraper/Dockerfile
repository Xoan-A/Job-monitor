FROM python:3.11-slim

WORKDIR /app

COPY scraper/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY scraper/ ./scraper/

EXPOSE 8000

CMD ["uvicorn", "scraper.api:app", "--host", "0.0.0.0", "--port", "8000"]