from fastapi.testclient import TestClient

import pytest

from backend.app import ai_client
from backend.app.auth import usuario_autenticado
from backend.app.main import app, get_generador
from backend.app.schemas import GenerarRequest, GenerarResponse, Pregunta

client = TestClient(app)

VALIDO = {"apuntes": "La fotosíntesis convierte luz en energía química.", "num_preguntas": 3}


def _pregunta() -> Pregunta:
    return Pregunta(
        enunciado="¿Qué convierte la fotosíntesis?",
        opciones=["Luz en energía química", "Agua en sal", "Calor en frío", "Nada"],
        correcta=0,
        explicacion="Transforma energía lumínica en química.",
        feedback_opciones=["Correcta.", "No: no produce sal.", "No: no enfría.", "No: sí convierte."],
    )


def _usar(generador):
    app.dependency_overrides[get_generador] = lambda: generador


@pytest.fixture(autouse=True)
def sesion_simulada():
    """Por defecto, usuario autenticado; el test de rechazo usa la validación real de Clerk."""
    app.dependency_overrides[usuario_autenticado] = lambda: "user_test"
    yield
    app.dependency_overrides.clear()


def test_entrada_valida_con_proveedor_simulado():
    _usar(lambda req: GenerarResponse(preguntas=[_pregunta()] * req.num_preguntas))
    r = client.post("/api/generar", json=VALIDO)
    assert r.status_code == 200
    preguntas = r.json()["preguntas"]
    assert len(preguntas) == 3
    assert {"enunciado", "opciones", "correcta", "explicacion", "feedback_opciones"} <= preguntas[0].keys()


def test_entrada_incorrecta_devuelve_422():
    _usar(lambda req: GenerarResponse(preguntas=[]))  # no debe llegar a llamarse
    for cuerpo in (
        {**VALIDO, "apuntes": "   "},
        {**VALIDO, "num_preguntas": 50},
        {**VALIDO, "apuntes": "x" * 5000},
    ):
        assert client.post("/api/generar", json=cuerpo).status_code == 422


def test_fallo_del_proveedor_es_error_controlado():
    def roto(req):
        raise ai_client.ProveedorError("detalle interno con sk-or-secreto")

    _usar(roto)
    r = client.post("/api/generar", json=VALIDO)
    assert r.status_code == 502
    assert "sk-or" not in r.text and "interno" not in r.text


def test_json_invalido_del_modelo_es_error_controlado(monkeypatch):
    class _Msg:
        content = "esto no es json"

    class _Choice:
        message = _Msg()

    class _Completion:
        choices = [_Choice()]

    class _Client:
        class chat:
            class completions:
                @staticmethod
                def create(**_):
                    return _Completion()

    monkeypatch.setattr(ai_client, "_client", lambda: _Client())
    r = client.post("/api/generar", json=VALIDO)
    assert r.status_code == 502


def test_sin_token_valido_se_rechaza_sin_llamar_a_la_ia(monkeypatch):
    monkeypatch.setenv("CLERK_SECRET_KEY", "sk_test_ficticia")
    del app.dependency_overrides[usuario_autenticado]  # validación real con el SDK de Clerk
    llamadas = []
    _usar(lambda req: llamadas.append(req))

    sin_token = client.post("/api/generar", json=VALIDO)
    token_falso = client.post("/api/generar", json=VALIDO, headers={"Authorization": "Bearer no-es-un-jwt"})

    assert sin_token.status_code == 401 and token_falso.status_code == 401
    assert sin_token.headers["www-authenticate"] == "Bearer"
    assert llamadas == []


def test_origenes_permitidos_admiten_comodin_de_preview():
    from backend.app.auth import _origen_permitido

    permitidos = ["https://testia.vercel.app", "https://testia-*-ies-zaidin-vergeles.vercel.app"]
    assert _origen_permitido("https://testia.vercel.app", permitidos)
    assert _origen_permitido("https://testia-96ssdr00x-ies-zaidin-vergeles.vercel.app", permitidos)
    assert not _origen_permitido("https://testia-x.evil.com/-ies-zaidin-vergeles.vercel.app", permitidos)
    assert not _origen_permitido("https://otra.vercel.app", permitidos)
    assert not _origen_permitido(None, permitidos)
