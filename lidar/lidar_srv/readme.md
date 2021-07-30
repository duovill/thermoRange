# API server
uvicorn main:app --reload

# Celery
celery -A tasks worker --loglevel=INFO -E