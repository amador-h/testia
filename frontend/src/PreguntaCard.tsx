import { useState } from 'react'
import type { Pregunta } from './api'
import { IconCheck, IconX } from './icons'

interface Props {
  numero: number
  pregunta: Pregunta
  onResponder: (acierto: boolean) => void
}

const letra = (i: number) => String.fromCharCode(65 + i)

export default function PreguntaCard({ numero, pregunta, onResponder }: Props) {
  const [elegida, setElegida] = useState<number | null>(null)
  const respondida = elegida !== null
  const acierto = elegida === pregunta.correcta

  function elegir(i: number) {
    if (respondida) return
    setElegida(i)
    onResponder(i === pregunta.correcta)
  }

  function estiloOpcion(i: number): string {
    const base = 'flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[15px] transition '
    if (!respondida)
      return (
        base +
        'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/60 active:scale-[0.995] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/10'
      )
    if (i === pregunta.correcta)
      return base + 'border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100'
    if (i === elegida)
      return base + 'border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100'
    return base + 'border-slate-200 bg-transparent text-slate-400 dark:border-slate-800 dark:text-slate-600'
  }

  function chip(i: number) {
    const base = 'mt-px flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold '
    if (respondida && i === pregunta.correcta)
      return (
        <span className={base + 'bg-emerald-600 text-white'} aria-hidden="true">
          <IconCheck className="size-4" />
        </span>
      )
    if (respondida && i === elegida)
      return (
        <span className={base + 'bg-rose-600 text-white'} aria-hidden="true">
          <IconX className="size-4" />
        </span>
      )
    return (
      <span
        className={base + 'border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400'}
        aria-hidden="true"
      >
        {letra(i)}
      </span>
    )
  }

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white tabular-nums">
          {numero}
        </span>
        <h3 className="pt-0.5 text-[17px] leading-snug font-semibold text-balance">{pregunta.enunciado}</h3>
      </div>

      <ul className="space-y-2.5">
        {pregunta.opciones.map((opcion, i) => (
          <li key={i}>
            <button type="button" className={estiloOpcion(i)} onClick={() => elegir(i)} disabled={respondida}>
              {chip(i)}
              <span>{opcion}</span>
              {respondida && i === pregunta.correcta && <span className="sr-only"> (respuesta correcta)</span>}
              {respondida && i === elegida && !acierto && <span className="sr-only"> (tu respuesta)</span>}
            </button>
          </li>
        ))}
      </ul>

      {respondida && (
        <div
          role="status"
          className={`mt-4 flex gap-3 rounded-xl px-4 py-3.5 text-sm leading-relaxed ${
            acierto
              ? 'bg-emerald-50 text-emerald-950 dark:bg-emerald-500/10 dark:text-emerald-100'
              : 'bg-rose-50 text-rose-950 dark:bg-rose-500/10 dark:text-rose-100'
          }`}
        >
          {acierto ? (
            <IconCheck className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <IconX className="mt-0.5 size-5 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <div className="space-y-1">
            <p className="font-semibold">
              {acierto ? '¡Correcto!' : `Incorrecto · la correcta es la ${letra(pregunta.correcta)}`}
            </p>
            {!acierto && <p>{pregunta.feedback_opciones[elegida]}</p>}
            <p className="opacity-80">{pregunta.explicacion}</p>
          </div>
        </div>
      )}
    </article>
  )
}
