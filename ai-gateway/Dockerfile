FROM python:3.12-slim
WORKDIR /srv
COPY ai-gateway/requirements.txt /srv/requirements.txt
RUN pip install --no-cache-dir -r /srv/requirements.txt \
    && mkdir -p /srv/gateway-state \
    && chown 10001:10001 /srv/gateway-state
COPY ai-gateway/app /srv/app
COPY ai-gateway/prompts /srv/prompts
COPY academic/*.py /srv/academic/
COPY academic/knowledge /srv/academic/knowledge
ENV AI_STATE_DIR=/srv/gateway-state PYTHONDONTWRITEBYTECODE=1
USER 10001:10001
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "app.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000", "--no-access-log"]
