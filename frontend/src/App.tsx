import { Show, SignInButton, SignOutButton, UserButton, useAuth } from '@clerk/react'
import { useRef, useState, type FormEvent } from 'react'
import { MAX_APUNTES, generarTest, type Dificultad, type Pregunta } from './api'
import { IconMinus, IconPlus, IconSpark } from './icons'
import PreguntaCard from './PreguntaCard'

const DIFICULTADES: { valor: Dificultad; etiqueta: string }[] = [
  { valor: 'facil', etiqueta: 'Fácil' },
  { valor: 'media', etiqueta: 'Media' },
  { valor: 'dificil', etiqueta: 'Difícil' },
]

const PASOS = [
  ['Pega tus apuntes', 'Hasta 4.000 caracteres de cualquier tema.'],
  ['Elige el nivel', 'Número de preguntas y dificultad.'],
  ['Practica y aprende', 'Cada respuesta viene explicada.'],
]

const entrada =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] transition ' +
  'placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 ' +
  'dark:border-slate-800 dark:bg-slate-900 dark:placeholder:text-slate-600'

const botonPrincipal =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-[15px] font-semibold text-white ' +
  'shadow-sm shadow-indigo-600/30 transition hover:bg-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70'

const botonCabecera =
  'rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition ' +
  'hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'

const botonPaso =
  'flex size-10 items-center justify-center text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 ' +
  'disabled:opacity-40 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'

export default function App() {
  const { getToken } = useAuth()
  const [apuntes, setApuntes] = useState('')
  const [numPreguntas, setNumPreguntas] = useState(5)
  const [dificultad, setDificultad] = useState<Dificultad>('media')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [aciertos, setAciertos] = useState(0)
  const [respondidas, setRespondidas] = useState(0)
  const apuntesRef = useRef<HTMLTextAreaElement>(null)

  const ajustar = (n: number) => setNumPreguntas(Math.min(10, Math.max(3, n)))

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!apuntes.trim()) {
      setError('Escribe o pega tus apuntes.')
      apuntesRef.current?.focus()
      return
    }
    setCargando(true)
    setPreguntas([])
    setAciertos(0)
    setRespondidas(0)
    try {
      setPreguntas(
        await generarTest(
          { apuntes: apuntes.trim(), num_preguntas: numPreguntas, dificultad, idioma: 'es' },
          await getToken(),
        ),
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado.')
    } finally {
      setCargando(false)
    }
  }

  function registrar(acierto: boolean) {
    setRespondidas((n) => n + 1)
    if (acierto) setAciertos((n) => n + 1)
  }

  function nuevoTest() {
    setPreguntas([])
    setAciertos(0)
    setRespondidas(0)
    apuntesRef.current?.focus()
    apuntesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const total = preguntas.length
  const terminado = total > 0 && respondidas === total
  const ratio = total ? aciertos / total : 0
  const mensaje = ratio === 1 ? '¡Perfecto!' : ratio >= 0.7 ? '¡Muy bien!' : ratio >= 0.4 ? 'Vas por buen camino' : 'A repasar un poco más'

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16">
      <header className="flex items-center gap-2.5 py-5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/30">
          <IconSpark className="size-5" />
        </span>
        <span className="text-[15px] font-semibold tracking-tight">Testia</span>
        <div className="ml-auto flex items-center gap-2">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button type="button" className={botonCabecera}>
                Iniciar sesión
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <SignOutButton>
              <button type="button" className={botonCabecera}>
                Cerrar sesión
              </button>
            </SignOutButton>
            <UserButton />
          </Show>
        </div>
      </header>

      <div className="mt-8 mb-10 max-w-2xl sm:mt-12">
        <h1 className="text-4xl leading-[1.1] font-bold tracking-tight text-balance sm:text-5xl">
          Convierte tus apuntes en{' '}
          <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text whitespace-nowrap text-transparent dark:from-indigo-400 dark:to-violet-300">
            un test
          </span>
        </h1>
        <p className="mt-4 text-lg text-slate-600 text-pretty dark:text-slate-400">
          Pega un texto y practica con preguntas que te explican cada respuesta.
        </p>
      </div>

      <main className="grid items-start gap-6 lg:grid-cols-[26rem_minmax(0,1fr)] lg:gap-8">
        <form
          onSubmit={enviar}
          className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex flex-col">
            <div className="mb-2 flex items-baseline justify-between">
              <label htmlFor="apuntes" className="text-sm font-medium">
                Apuntes
              </label>
              <span className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
                {apuntes.length}/{MAX_APUNTES}
              </span>
            </div>
            <textarea
              id="apuntes"
              ref={apuntesRef}
              rows={10}
              maxLength={MAX_APUNTES}
              value={apuntes}
              onChange={(e) => setApuntes(e.target.value)}
              className={`${entrada} min-h-40 resize-y leading-relaxed`}
              placeholder="Pega aquí el texto que quieres repasar…"
            />
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <label htmlFor="num" className="mb-2 block text-sm font-medium">
                Preguntas
              </label>
              <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                <button
                  type="button"
                  className={botonPaso}
                  onClick={() => ajustar(numPreguntas - 1)}
                  disabled={numPreguntas <= 3}
                  aria-label="Una pregunta menos"
                >
                  <IconMinus className="size-4" />
                </button>
                <input
                  id="num"
                  type="number"
                  min={3}
                  max={10}
                  value={numPreguntas}
                  onChange={(e) => ajustar(Number(e.target.value) || 3)}
                  className="h-10 w-11 [appearance:textfield] bg-transparent text-center text-[15px] font-medium tabular-nums focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  className={botonPaso}
                  onClick={() => ajustar(numPreguntas + 1)}
                  disabled={numPreguntas >= 10}
                  aria-label="Una pregunta más"
                >
                  <IconPlus className="size-4" />
                </button>
              </div>
            </div>

            <fieldset className="min-w-0 flex-1">
              <legend className="mb-2 text-sm font-medium">Dificultad</legend>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                {DIFICULTADES.map(({ valor, etiqueta }) => (
                  <label key={valor} className="cursor-pointer">
                    <input
                      type="radio"
                      name="dificultad"
                      value={valor}
                      checked={dificultad === valor}
                      onChange={() => setDificultad(valor)}
                      className="peer sr-only"
                    />
                    <span className="block rounded-lg px-1 py-2 text-center text-sm text-slate-600 transition peer-checked:bg-white peer-checked:font-semibold peer-checked:text-indigo-700 peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-indigo-500 dark:text-slate-400 dark:peer-checked:bg-slate-700 dark:peer-checked:text-white">
                      {etiqueta}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {/* Solo es comodidad de interfaz: quien protege la IA es FastAPI validando el token. */}
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button type="button" className={botonPrincipal}>
                Inicia sesión para generar
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <button type="submit" disabled={cargando} className={botonPrincipal}>
              {cargando ? (
                <span
                  className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                  aria-hidden="true"
                />
              ) : (
                <IconSpark className="size-4" />
              )}
              {cargando ? 'Generando…' : 'Generar test'}
            </button>
          </Show>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:bg-rose-500/10 dark:text-rose-200"
            >
              {error}
            </p>
          )}
        </form>

        <section
          aria-live="polite"
          aria-busy={cargando}
          className="min-w-0 space-y-5 lg:self-stretch"
        >
          {total === 0 && !cargando && (
            <div className="flex h-full flex-col justify-center rounded-2xl border border-dashed border-slate-300 bg-white/40 p-6 sm:p-10 dark:border-slate-700 dark:bg-slate-900/30">
              <h2 className="text-lg font-semibold">Tu test aparecerá aquí</h2>
              <ol className="mt-5 space-y-4">
                {PASOS.map(([titulo, detalle], i) => (
                  <li key={titulo} className="flex gap-3.5">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium">{titulo}</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{detalle}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-xs text-slate-500 dark:text-slate-500">
                Tus apuntes no se guardan: se envían una sola vez para generar el test.
              </p>
            </div>
          )}

          {cargando &&
            Array.from({ length: Math.min(numPreguntas, 3) }, (_, i) => (
              <div
                key={i}
                className="animate-pulse space-y-3 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                {[0, 1, 2, 3].map((n) => (
                  <div key={n} className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
                ))}
              </div>
            ))}

          {total > 0 && (
            <>
              <div className="sticky top-3 z-10 rounded-xl border border-slate-200 bg-white/85 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/85">
                <div className="mb-2 flex items-baseline justify-between text-sm">
                  <span className="font-semibold">Tu test</span>
                  <span className="text-slate-600 tabular-nums dark:text-slate-400">
                    {respondidas}/{total} · {aciertos} {aciertos === 1 ? 'acierto' : 'aciertos'}
                  </span>
                </div>
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={total}
                  aria-valuenow={respondidas}
                  aria-label="Preguntas respondidas"
                >
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all"
                    style={{ width: `${(respondidas / total) * 100}%` }}
                  />
                </div>
              </div>

              {preguntas.map((p, i) => (
                <PreguntaCard key={`${i}-${p.enunciado}`} numero={i + 1} pregunta={p} onResponder={registrar} />
              ))}

              {terminado && (
                <div className="rounded-2xl bg-indigo-600 p-6 text-white shadow-lg shadow-indigo-600/25 sm:p-8">
                  <p className="text-sm font-medium text-indigo-100">Resultado</p>
                  <p className="mt-1 text-4xl font-bold tabular-nums">
                    {aciertos}/{total}
                  </p>
                  <p className="mt-1 text-indigo-50">{mensaje}</p>
                  <button
                    type="button"
                    onClick={nuevoTest}
                    className="mt-5 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50"
                  >
                    Hacer otro test
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}
