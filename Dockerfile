# Imagen única con la app completa: FastAPI sirve la API (/api/*) y la SPA compilada (/).
# Los secretos NO entran en la imagen: se inyectan al ejecutar (docker run --env-file).

# --- Etapa 1: compilar la SPA (solo se usa durante la construcción) ---
FROM node:24-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Clave PÚBLICA de Clerk: Vite la incrusta en el bundle al compilar. Si cambia, hay que reconstruir.
ARG VITE_CLERK_PUBLISHABLE_KEY
RUN test -n "$VITE_CLERK_PUBLISHABLE_KEY" || (echo "Falta --build-arg VITE_CLERK_PUBLISHABLE_KEY" && exit 1)
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
RUN npm run build

# --- Etapa 2: imagen final de ejecución ---
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

# Dependencias leídas de pyproject.toml (misma fuente que usa Vercel).
COPY pyproject.toml ./
RUN python -c "import tomllib; print('\n'.join(tomllib.load(open('pyproject.toml','rb'))['project']['dependencies']))" > requirements.txt \
    && pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY --from=frontend /app/frontend/dist ./frontend/dist

# Sin privilegios de root dentro del contenedor.
RUN useradd --system --uid 10001 app
USER app

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=2)"

# 0.0.0.0: escucha en todas las interfaces del contenedor para que el puerto publicado llegue.
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
