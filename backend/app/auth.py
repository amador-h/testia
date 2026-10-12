import logging
import os

from clerk_backend_api.security import authenticate_request
from clerk_backend_api.security.types import AuthenticateRequestOptions
from fastapi import HTTPException, Request

logger = logging.getLogger("test_repaso")


def _authorized_parties() -> list[str]:
    """Orígenes de la SPA admitidos en el claim `azp` (CLERK_AUTHORIZED_PARTIES, separados por comas)."""
    valor = os.getenv("CLERK_AUTHORIZED_PARTIES", "")
    return [o.strip().rstrip("/") for o in valor.split(",") if o.strip()]


def usuario_autenticado(request: Request) -> str:
    """Valida el token de sesión de Clerk (firma, caducidad y azp) y devuelve el id del usuario.

    El SDK oficial descarga la JWKS de la instancia con CLERK_SECRET_KEY y comprueba firma,
    `exp`/`nbf` y que `azp` sea uno de los orígenes permitidos.
    """
    secret_key = os.getenv("CLERK_SECRET_KEY")
    if not secret_key:
        logger.error("Falta CLERK_SECRET_KEY: se rechazan todas las peticiones a la IA")
    estado = authenticate_request(
        request,
        AuthenticateRequestOptions(
            secret_key=secret_key,
            authorized_parties=_authorized_parties() or None,
            accepts_token=["session_token"],
        ),
    )
    if not estado.is_signed_in:
        # Solo el motivo, nunca el token.
        logger.warning("Petición rechazada por autenticación: %s", estado.reason.name if estado.reason else "?")
        raise HTTPException(
            status_code=401,
            detail="Necesitas iniciar sesión para generar un test.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return estado.payload["sub"]
