import { useEffect, useRef } from 'react'

const SEPARACION = 26 // px entre puntos
const NIVELES = 8 // los puntos se agrupan por opacidad para dibujarlos con pocas llamadas
const MS_POR_FOTOGRAMA = 1000 / 30 // ~30 fps: suficiente para un fondo y barato para la CPU

/**
 * Fondo decorativo: retícula de puntos que ondula como el agua (suma de ondas senoidales que
 * cambian la altura, el tamaño y la opacidad de cada punto). Con "reducir movimiento" queda quieto.
 */
export default function FondoOndas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const lienzo = ref.current
    const ctx = lienzo?.getContext('2d')
    if (!lienzo || !ctx) return

    const reducirMovimiento = matchMedia('(prefers-reduced-motion: reduce)')
    const oscuro = matchMedia('(prefers-color-scheme: dark)')
    let ancho = 0
    let alto = 0
    let animacion = 0
    let ultimo = 0

    function ajustarTamano() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      ancho = window.innerWidth
      alto = window.innerHeight
      lienzo!.width = Math.round(ancho * dpr)
      lienzo!.height = Math.round(alto * dpr)
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    function dibujar(segundos: number) {
      const [r, g, b] = oscuro.matches ? [129, 140, 248] : [79, 70, 229]
      const opacidadBase = oscuro.matches ? 0.05 : 0.04
      const opacidadExtra = oscuro.matches ? 0.7 : 0.6
      const capas = Array.from({ length: NIVELES }, () => new Path2D())

      for (let y = SEPARACION / 2; y < alto + SEPARACION; y += SEPARACION) {
        for (let x = SEPARACION / 2; x < ancho + SEPARACION; x += SEPARACION) {
          // Tres ondas que viajan en direcciones distintas: su suma (−3..3) da la "cresta".
          const ola =
            Math.sin(x * 0.011 + segundos * 0.9) +
            Math.sin(y * 0.017 - segundos * 0.7) +
            Math.sin((x + y) * 0.007 + segundos * 0.5)
          const cresta = ((ola + 3) / 6) ** 2 // 0..1; al cuadrado, las crestas destacan sobre los valles
          const desplazamiento = Math.sin(x * 0.009 + segundos * 1.1) * 8 * cresta
          const radio = 0.4 + cresta * 2.2
          const nivel = Math.min(NIVELES - 1, Math.floor(cresta * NIVELES))
          capas[nivel].moveTo(x + radio, y + desplazamiento)
          capas[nivel].arc(x, y + desplazamiento, radio, 0, Math.PI * 2)
        }
      }

      ctx!.clearRect(0, 0, ancho, alto)
      capas.forEach((capa, nivel) => {
        ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacidadBase + (opacidadExtra * (nivel + 0.5)) / NIVELES})`
        ctx!.fill(capa)
      })
    }

    function fotograma(ahora: number) {
      animacion = requestAnimationFrame(fotograma)
      if (ahora - ultimo < MS_POR_FOTOGRAMA) return
      ultimo = ahora
      dibujar(ahora / 1000)
    }

    function arrancar() {
      cancelAnimationFrame(animacion)
      if (reducirMovimiento.matches) dibujar(0)
      else animacion = requestAnimationFrame(fotograma)
    }

    function alRedimensionar() {
      ajustarTamano()
      if (reducirMovimiento.matches) dibujar(0)
    }

    ajustarTamano()
    arrancar()
    window.addEventListener('resize', alRedimensionar)
    reducirMovimiento.addEventListener('change', arrancar)
    oscuro.addEventListener('change', arrancar)
    return () => {
      cancelAnimationFrame(animacion)
      window.removeEventListener('resize', alRedimensionar)
      reducirMovimiento.removeEventListener('change', arrancar)
      oscuro.removeEventListener('change', arrancar)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 size-full [mask-image:linear-gradient(to_bottom,black_0%,rgb(0_0_0/0.55)_55%,rgb(0_0_0/0.3)_100%)]"
    />
  )
}
