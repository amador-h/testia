export type Dificultad = 'facil' | 'media' | 'dificil'

export interface GenerarRequest {
  apuntes: string
  num_preguntas: number
  dificultad: Dificultad
  idioma: 'es' | 'en'
}

export interface Pregunta {
  enunciado: string
  opciones: string[]
  correcta: number
  explicacion: string
  feedback_opciones: string[]
}

export const MAX_APUNTES = 4000

export async function generarTest(req: GenerarRequest): Promise<Pregunta[]> {
  let res: Response
  try {
    res = await fetch('/api/generar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req),
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión.')
  }

  if (!res.ok) {
    if (res.status === 422) throw new Error('Revisa los datos del formulario.')
    if (res.status === 401) throw new Error('Debes iniciar sesión para generar un test.')
    const body = await res.json().catch(() => null)
    throw new Error(
      typeof body?.detail === 'string'
        ? body.detail
        : 'No se pudo generar el test. Inténtalo de nuevo.',
    )
  }
  const data = await res.json()
  return data.preguntas as Pregunta[]
}
