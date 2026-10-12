import logging
from pathlib import Path
from typing import Callable

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from . import ai_client
from .schemas import GenerarRequest, GenerarResponse

load_dotenv()
logger = logging.getLogger("test_repaso")

app = FastAPI(title="Testia")


def get_generador() -> Callable[[GenerarRequest], GenerarResponse]:
    """Dependencia sustituible en los tests por un proveedor simulado."""
    return ai_client.generar_test


@app.exception_handler(ai_client.ProveedorTimeout)
async def _timeout(_: Request, __: ai_client.ProveedorTimeout) -> JSONResponse:
    # Sin registrar apuntes, tokens ni claves.
    logger.warning("Timeout del proveedor de IA")
    return JSONResponse(
        status_code=504,
        content={"detail": "El servicio de IA tardó demasiado. Inténtalo de nuevo."},
    )


@app.exception_handler(ai_client.ProveedorError)
async def _proveedor(_: Request, exc: ai_client.ProveedorError) -> JSONResponse:
    logger.warning("Fallo del proveedor de IA: %s", type(exc).__name__)
    return JSONResponse(
        status_code=502,
        content={"detail": "No se pudo generar el test ahora mismo. Inténtalo de nuevo."},
    )


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/generar", response_model=GenerarResponse)
def generar(
    req: GenerarRequest,
    generador: Callable[[GenerarRequest], GenerarResponse] = Depends(get_generador),
) -> GenerarResponse:
    return generador(req)


# Sirve la SPA compilada (Docker y Vercel). Va al final para no tapar /api/*.
_dist = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if _dist.is_dir():
    app.mount("/", StaticFiles(directory=_dist, html=True), name="frontend")
