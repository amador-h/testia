from fastapi.testclient import TestClient

from backend.app import ai_client
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


def teardown_function():
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

