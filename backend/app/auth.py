import logging
import os
import re

from clerk_backend_api.security import authenticate_request
from clerk_backend_api.security.types import AuthenticateRequestOptions
from fastapi import HTTPException, Request

logger = logging.getLogger("test_repaso")


def _authorized_parties() -> list[str]:
    """Orígenes de la SPA admitidos en el claim `azp` (CLERK_AUTHORIZED_PARTIES, separados por comas)."""
    valor = os.getenv("CLERK_AUTHORIZED_PARTIES", "")
    return [o.strip().rstrip("/") for o in valor.split(",") if o.strip()]


def _origen_permitido(azp: str | None, permitidos: list[str]) -> bool:
    """Coincidencia exacta; `*` solo sustituye un trozo de subdominio (p. ej. URLs de Preview de Vercel)."""
    for origen in permitidos:
        patron = "".join("[a-z0-9-]+" if parte == "*" else re.escape(parte) for parte in re.split(r"(\*)", origen))
        if azp and re.fullmatch(patron, azp):
            return True
    return False


def _rechazar(motivo: str) -> HTTPException:
    # Solo el motivo, nunca el token.
    logger.warning("Petición rechazada por autenticación: %s", motivo)
    return HTTPException(
        status_code=401,
        detail="Necesitas iniciar sesión para generar un test.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def usuario_autenticado(request: Request) -> str:
    """Valida el token de sesión de Clerk (firma, caducidad y azp) y devuelve el id del usuario.

    El SDK oficial descarga la JWKS de la instancia con CLERK_SECRET_KEY y comprueba firma y
    `exp`/`nbf`; después se exige que `azp` sea uno de los orígenes permitidos.
    """
    secret_key = os.getenv("CLERK_SECRET_KEY")
    if not secret_key:
        logger.error("Falta CLERK_SECRET_KEY: se rechazan todas las peticiones a la IA")
    permitidos = _authorized_parties()
    estado = authenticate_request(
        request,
        AuthenticateRequestOptions(secret_key=secret_key, accepts_token=["session_token"]),
    )
    if not estado.is_signed_in:
        raise _rechazar(estado.reason.name if estado.reason else "?")
    if permitidos and not _origen_permitido(estado.payload.get("azp"), permitidos):
        raise _rechazar("AZP_NO_PERMITIDO")
    return estado.payload["sub"]
