FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN pip install debugpy

EXPOSE 8000
#EXPOSE 5678 
# Debugger port for debugpy

#CMD alembic upgrade head && \
#    python -m debugpy --listen 0.0.0.0:5678 --wait-for-client \
#   -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

CMD alembic upgrade head && \
    uvicorn main:app --host 0.0.0.0 --port 8000 --reload