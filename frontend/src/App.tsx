import { SignInButton, SignOutButton, SignUpButton, UserButton, useAuth } from '@clerk/react'
import { useRef, useState, type FormEvent } from 'react'
import { MAX_APUNTES, generarTest, type Dificultad, type Pregunta } from './api'
import FondoOndas from './FondoOndas'
import { IconBulb, IconCheck, IconList, IconMinus, IconPlus, IconShield, IconSpark, IconWand } from './icons'
import PreguntaCard from './PreguntaCard'

const DIFICULTADES: { valor: Dificultad; etiqueta: string }[] = [
  { valor: 'facil', etiqueta: 'Fácil' },
  { valor: 'media', etiqueta: 'Media' },
  { valor: 'dificil', etiqueta: 'Difícil' },
]

const VENTAJAS = [
  { icono: IconBulb, texto: 'Cada respuesta, explicada' },
  { icono: IconList, texto: 'De 3 a 10 preguntas' },
  { icono: IconShield, texto: 'Tus apuntes no se guardan' },
]

const EJEMPLO =
  'El ciclo del agua describe el movimiento continuo del agua en la Tierra. Empieza con la evaporación: el calor del Sol ' +
  'convierte en vapor el agua de mares, ríos y lagos, y las plantas también aportan vapor mediante la transpiración. Al ' +
  'ascender, el vapor se enfría y se condensa en pequeñas gotas que forman las nubes. Cuando las gotas crecen lo suficiente, ' +
  'caen como precipitación en forma de lluvia, nieve o granizo. Parte del agua se infiltra en el suelo y alimenta los ' +
  'acuíferos; otra parte escurre por la superficie hasta los ríos y vuelve al mar, donde el ciclo comienza de nuevo.'

const MIN_PREGUNTAS = 3
const MAX_PREGUNTAS = 10

const entrada =
  'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[15px] transition ' +
  'placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15 ' +
  'dark:border-slate-800 dark:bg-slate-950/60 dark:placeholder:text-slate-600'

const botonPrincipal =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 px-5 py-3 ' +
  'text-[15px] font-semibold text-white shadow-md shadow-indigo-600/25 ring-1 ring-indigo-700/50 ring-inset transition ' +
  'hover:from-indigo-600 hover:to-indigo-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70'

const botonSecundario =
  'rounded-full px-4 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-900/5 ' +
  'dark:text-slate-200 dark:hover:bg-white/10'

const botonCuenta =
  'rounded-full bg-slate-900 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 ' +
  'dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'

const botonPaso =
  'flex size-10 items-center justify-center text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 ' +
  'disabled:opacity-40 disabled:hover:bg-transparent dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'

const tarjeta =
  'rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgb(15_23_42/0.04),0_8px_24px_-12px_rgb(15_23_42/0.12)] ' +
  'dark:border-slate-800 dark:bg-slate-900'

export default function App() {
  // isLoaded evita el "salto" al cargar: hasta que Clerk responde se pintan huecos del mismo tamaño.
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const [apuntes, setApuntes] = useState('')
  const [numPreguntas, setNumPreguntas] = useState(5)
  const [dificultad, setDificultad] = useState<Dificultad>('media')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preguntas, setPreguntas] = useState<Pregunta[]>([])
  const [aciertos, setAciertos] = useState(0)
  const [respondidas, setRespondidas] = useState(0)
  const apuntesRef = useRef<HTMLTextAreaElement>(null)

  const ajustar = (n: number) => setNumPreguntas(Math.min(MAX_PREGUNTAS, Math.max(MIN_PREGUNTAS, n)))

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
  const mensaje =
    ratio === 1 ? '¡Perfecto!' : ratio >= 0.7 ? '¡Muy bien!' : ratio >= 0.4 ? 'Vas por buen camino' : 'A repasar un poco más'

  return (
    <div className="flex min-h-dvh flex-col desk:h-dvh">
      <FondoOndas />
      <header className="mx-auto flex w-full max-w-6xl items-center gap-2.5 px-5 py-4">
        <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-600/30">
          <IconSpark className="size-5" />
        </span>
        <span className="text-[17px] font-semibold tracking-tight">Testia</span>

        {/* Ancho mínimo reservado para que la cabecera no salte cuando Clerk termina de cargar. */}
        <nav className="ml-auto flex min-w-56 items-center justify-end gap-1.5" aria-label="Cuenta">
          {!isLoaded && (
            <span className="flex gap-1.5" aria-hidden="true">
              <span className="h-8 w-28 animate-pulse rounded-full bg-slate-200/80 dark:bg-slate-800" />
              <span className="h-8 w-28 animate-pulse rounded-full bg-slate-200/80 dark:bg-slate-800" />
            </span>
          )}
          {isLoaded && !isSignedIn && (
            <>
              <SignInButton mode="modal">
                <button type="button" className={botonSecundario}>
                  Iniciar sesión
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button type="button" className={botonCuenta}>
                  Crear cuenta
                </button>
              </SignUpButton>
            </>
          )}
          {isLoaded && isSignedIn && (
            <>
              <SignOutButton>
                <button type="button" className={botonSecundario}>
                  Cerrar sesión
                </button>
              </SignOutButton>
              <span className="flex size-8 items-center justify-center">
                <UserButton />
              </span>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto w-full max-w-6xl px-5 pt-6 pb-8 sm:pt-10 desk:flex desk:items-end desk:justify-between desk:gap-8 desk:pt-1 desk:pb-5">
        <div className="max-w-2xl">
          <h1 className="text-4xl leading-[1.1] font-bold tracking-tight text-balance sm:text-5xl desk:text-[2.15rem]">
            Convierte tus apuntes en{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text whitespace-nowrap text-transparent dark:from-indigo-400 dark:to-violet-300">
              un test
            </span>
          </h1>
          <p className="mt-3 text-lg text-slate-600 text-pretty desk:mt-1.5 desk:text-base dark:text-slate-400">
            Pega un texto y practica con preguntas que te explican cada respuesta.
          </p>
        </div>
        <ul className="mt-5 flex flex-wrap gap-2 desk:mt-0 desk:justify-end">
          {VENTAJAS.map(({ icono: Icono, texto }) => (
            <li
              key={texto}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-[13px] text-slate-600 backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300"
            >
              <Icono className="size-4 text-indigo-600 dark:text-indigo-400" />
              {texto}
            </li>
          ))}
        </ul>
      </section>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-start gap-6 px-5 pb-8 lg:grid-cols-[26rem_minmax(0,1fr)] desk:min-h-0 desk:grid-rows-[minmax(0,1fr)] desk:items-stretch desk:pb-5">
        <form
          onSubmit={enviar}
          className={`${tarjeta} flex flex-col gap-5 p-5 sm:p-6 lg:sticky lg:top-6 desk:static desk:min-h-0 desk:overflow-y-auto`}
        >
          <div className="flex flex-col desk:min-h-32 desk:flex-1">
            <div className="mb-2 flex items-center justify-between gap-2">
              <label htmlFor="apuntes" className="text-sm font-medium">
                Apuntes
              </label>
              <button
                type="button"
                onClick={() => {
                  setApuntes(EJEMPLO)
                  apuntesRef.current?.focus()
                }}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium text-indigo-600 transition hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
              >
                <IconWand className="size-3.5" />
                Probar con un ejemplo
              </button>
            </div>
            <textarea
              id="apuntes"
              ref={apuntesRef}
              rows={9}
              maxLength={MAX_APUNTES}
              value={apuntes}
              onChange={(e) => setApuntes(e.target.value)}
              aria-describedby="apuntes-contador"
              className={`${entrada} min-h-40 resize-y leading-relaxed desk:min-h-0 desk:flex-1 desk:resize-none`}
              placeholder="Pega aquí el texto que quieres repasar…"
            />
            <p id="apuntes-contador" className="mt-1.5 text-right text-xs text-slate-500 tabular-nums dark:text-slate-400">
              {apuntes.length.toLocaleString('es-ES')} / {MAX_APUNTES.toLocaleString('es-ES')}
            </p>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <span id="num-etiqueta" className="mb-2 block text-sm font-medium">
                Preguntas
              </span>
              <div
                role="group"
                aria-labelledby="num-etiqueta"
                className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/60"
              >
                <button
                  type="button"
                  className={botonPaso}
                  onClick={() => ajustar(numPreguntas - 1)}
                  disabled={numPreguntas <= MIN_PREGUNTAS}
                  aria-label="Una pregunta menos"
                >
                  <IconMinus className="size-4" />
                </button>
                <output aria-live="polite" className="w-9 text-center text-[15px] font-semibold tabular-nums">
                  {numPreguntas}
                </output>
                <button
                  type="button"
                  className={botonPaso}
                  onClick={() => ajustar(numPreguntas + 1)}
                  disabled={numPreguntas >= MAX_PREGUNTAS}
                  aria-label="Una pregunta más"
                >
                  <IconPlus className="size-4" />
                </button>
              </div>
            </div>

            {/* radiogroup con etiqueta normal (no fieldset/legend): así queda alineada con "Preguntas". */}
            <div className="min-w-0 flex-1">
              <span id="dif-etiqueta" className="mb-2 block text-sm font-medium">
                Dificultad
              </span>
              <div
                role="radiogroup"
                aria-labelledby="dif-etiqueta"
                className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80"
              >
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
                    <span className="block rounded-lg px-1 py-[7px] text-center text-sm text-slate-600 transition peer-checked:bg-white peer-checked:font-semibold peer-checked:text-indigo-700 peer-checked:shadow-sm peer-focus-visible:outline-2 peer-focus-visible:outline-indigo-500 dark:text-slate-400 dark:peer-checked:bg-slate-700 dark:peer-checked:text-white">
                      {etiqueta}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Solo es comodidad de interfaz: quien protege la IA es FastAPI validando el token. */}
          <div className="space-y-2.5">
            {!isLoaded && (
              <button type="button" disabled className={botonPrincipal}>
                <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                Cargando…
              </button>
            )}
            {isLoaded && !isSignedIn && (
              <>
                <SignInButton mode="modal">
                  <button type="button" className={botonPrincipal}>
                    <IconSpark className="size-4" />
                    Entra para generar tu test
                  </button>
                </SignInButton>
                <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                  ¿Aún no tienes cuenta?{' '}
                  <SignUpButton mode="modal">
                    <button type="button" className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                      Créala gratis
                    </button>
                  </SignUpButton>
                </p>
              </>
            )}
            {isLoaded && isSignedIn && (
              <button type="submit" disabled={cargando} className={botonPrincipal}>
                {cargando ? (
                  <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
                ) : (
                  <IconSpark className="size-4" />
                )}
                {cargando ? 'Generando…' : 'Generar test'}
              </button>
            )}
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:bg-rose-500/10 dark:text-rose-200"
            >
              {error}
            </p>
          )}

          <p className="mt-auto text-center text-[11px] text-balance text-slate-400 dark:text-slate-500">
            <IconShield className="mr-1 inline size-3.5 align-[-2px]" />
            Los apuntes se envían solo para generar el test. La IA puede equivocarse.
          </p>
        </form>

        <section
          aria-label="Tu test"
          aria-live="polite"
          aria-busy={cargando}
          className={`${tarjeta} flex min-w-0 flex-col desk:min-h-0`}
        >
          {total > 0 && (
            <div className="sticky top-0 z-10 rounded-t-2xl border-b border-slate-200/80 bg-white/90 px-5 py-3.5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 desk:static">
              <div className="mb-2 flex items-baseline justify-between text-sm">
                <h2 className="font-semibold">Tu test</h2>
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
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${(respondidas / total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex-1 space-y-4 p-4 sm:p-5 desk:min-h-0 desk:overflow-y-auto desk:[scrollbar-width:thin]">
            {total === 0 && !cargando && <EstadoVacio />}

            {cargando && (
              <>
                <p className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="size-3.5 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-500" aria-hidden="true" />
                  Preparando {numPreguntas} preguntas… suele tardar unos segundos.
                </p>
                {Array.from({ length: Math.min(numPreguntas, 3) }, (_, i) => (
                  <div key={i} className="animate-pulse space-y-3 rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                    <div className="h-5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                    {[0, 1, 2, 3].map((n) => (
                      <div key={n} className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800/60" />
                    ))}
                  </div>
                ))}
              </>
            )}

            {preguntas.map((p, i) => (
              <PreguntaCard key={`${i}-${p.enunciado}`} numero={i + 1} pregunta={p} onResponder={registrar} />
            ))}

            {terminado && (
              <div className="aparecer relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white shadow-lg shadow-indigo-600/25 sm:p-7">
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
          </div>
        </section>
      </main>
    </div>
  )
}

/** Vista previa decorativa de una pregunta: muestra qué se obtiene antes de generar nada. */
function EstadoVacio() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-7 py-6 text-center">
      <div aria-hidden="true" className="pointer-events-none relative w-full max-w-sm select-none">
        <div className="absolute inset-x-6 -top-3 h-full rounded-2xl border border-slate-200 bg-white/60 dark:border-slate-800 dark:bg-slate-900/60" />
        <div className="relative rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">1</span>
            <span className="text-sm font-semibold">¿Dónde se forman las nubes?</span>
          </div>
          <div className="space-y-1.5 text-[13px]">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100">
              <span className="flex size-4 items-center justify-center rounded bg-emerald-600 text-white">
                <IconCheck className="size-3" />
              </span>
              Al condensarse el vapor en el aire
            </div>
            {['En los acuíferos', 'En el estroma de las hojas'].map((t, i) => (
              <div key={t} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-400 dark:border-slate-800 dark:text-slate-500">
                <span className="flex size-4 items-center justify-center rounded border border-slate-200 text-[9px] font-semibold dark:border-slate-700">
                  {String.fromCharCode(66 + i)}
                </span>
                {t}
              </div>
            ))}
          </div>
          <p className="mt-3 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[12px] text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200">
            El vapor asciende, se enfría y se condensa en gotas.
          </p>
        </div>
      </div>

      <div className="max-w-sm">
        <h2 className="text-lg font-semibold">Tu test aparecerá aquí</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Pega tus apuntes, elige cuántas preguntas quieres y la dificultad. Al responder verás por qué cada opción es
          correcta o no.
        </p>
      </div>
    </div>
  )
}
