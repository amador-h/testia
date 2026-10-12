from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

MAX_APUNTES = 4000


class GenerarRequest(BaseModel):
    apuntes: str = Field(max_length=MAX_APUNTES)
    num_preguntas: int = Field(ge=3, le=10)
    dificultad: Literal["facil", "media", "dificil"] = "media"
    idioma: Literal["es", "en"] = "es"

    @field_validator("apuntes")
    @classmethod
    def apuntes_no_vacios(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Los apuntes no pueden estar vacíos")
        return v


class Pregunta(BaseModel):
    enunciado: str = Field(min_length=1)
    opciones: list[str] = Field(min_length=4, max_length=4)
    correcta: int = Field(ge=0, le=3)
    explicacion: str = Field(min_length=1)
    feedback_opciones: list[str] = Field(min_length=4, max_length=4)

    @model_validator(mode="after")
    def textos_no_vacios(self) -> "Pregunta":
        if any(not o.strip() for o in self.opciones) or any(
            not f.strip() for f in self.feedback_opciones
        ):
            raise ValueError("Opciones y feedback no pueden estar vacíos")
        return self


class GenerarResponse(BaseModel):
    preguntas: list[Pregunta]
