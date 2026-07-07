import { useCallback, useEffect, useRef, useState } from 'react'
import Boton from './Boton'
import { useSesion } from '../lib/session'
import type { Rol } from '../lib/types'

interface Paso {
  objetivo: string
  titulo: string
  texto: string
}

// Recorrido guiado de ~1 minuto por rol (RF-AUTH-04). Los objetivos son
// atributos data-tour presentes en la vista de aterrizaje de cada rol.
const pasosPorRol: Record<Rol, Paso[]> = {
  admin: [
    { objetivo: 'nav', titulo: 'Navegación por rol', texto: 'Cada rol ve solo sus módulos. Como Dirección ves todo: tablero, requisiciones, compras, catálogo y usuarios.' },
    { objetivo: 'kpis', titulo: 'KPIs consolidados', texto: 'Diésel + refacciones + taller de toda la flota, bajo una sola llave: el ID del tracto.' },
    { objetivo: 'barras', titulo: 'Gasto por tracto', texto: 'La barra rayada en naranja es el tracto más costoso. Haz clic en cualquier barra para analizar esa unidad.' },
    { objetivo: 'veredicto', titulo: 'Veredicto de rentabilidad', texto: '¿Vale la pena meterle más lana? El sistema compara el costo acumulado contra el valor del activo y te da la razón con evidencia.' },
    { objetivo: 'parametros', titulo: 'Parámetros ajustables', texto: 'El umbral (%) y la ventana (meses) del veredicto se ajustan en runtime, sin tocar código.' },
  ],
  taller: [
    { objetivo: 'nav', titulo: 'Tus módulos', texto: 'Como Taller ves Requisición y Catálogo. Todo lo que pidas queda ligado a una unidad.' },
    { objetivo: 'destino', titulo: 'Tracto destino', texto: 'Toda requisición nace vinculada a una unidad válida del catálogo. Sin destino no hay pieza.' },
    { objetivo: 'origen', titulo: 'Compra o Yonke', texto: 'Si la pieza sale de una unidad donante (Yonke), registra el donante y un costo estimado: la canibalización deja de ser invisible.' },
    { objetivo: 'foto', titulo: 'Foto obligatoria', texto: 'Ninguna requisición viaja sin foto de la pieza o su número de serie.' },
  ],
  compras: [
    { objetivo: 'nav', titulo: 'Tus módulos', texto: 'Como Compras ves tu panel y el catálogo de unidades.' },
    { objetivo: 'filtros', titulo: 'Cola priorizada', texto: 'Las requisiciones llegan ordenadas por urgencia (Crítica → Media → Rápida) y se filtran por estado.' },
    { objetivo: 'cola', titulo: 'Ciclo y origen', texto: 'Avanza cada pieza por su ciclo. El costo Yonke siempre se marca como Estimado: nunca se confunde con un costo facturado.' },
  ],
  diesel: [],
}

const retardoInicial = import.meta.env.MODE === 'test' ? 0 : 700

export default function Tour() {
  const { sesion } = useSesion()
  const [pasoIdx, setPasoIdx] = useState<number | null>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const botonRef = useRef<HTMLButtonElement>(null)
  const focoPrevio = useRef<HTMLElement | null>(null)

  const rol = sesion?.usuario.rol
  const pasos = rol ? pasosPorRol[rol] : []

  const cerrar = useCallback(() => {
    if (rol) localStorage.setItem('wh-tour-visto-' + rol, '1')
    setPasoIdx(null)
    focoPrevio.current?.focus()
  }, [rol])

  // Primer ingreso por rol: el tour se dispara solo (persistido en localStorage)
  useEffect(() => {
    if (!rol || !pasos.length) return
    if (localStorage.getItem('wh-tour-visto-' + rol)) return
    const t = setTimeout(() => {
      focoPrevio.current = document.activeElement as HTMLElement
      setPasoIdx(0)
    }, retardoInicial)
    return () => clearTimeout(t)
  }, [rol, pasos.length])

  // Re-lanzable desde el botón "Tutorial" del nav
  useEffect(() => {
    const abrir = () => {
      focoPrevio.current = document.activeElement as HTMLElement
      setPasoIdx(0)
    }
    window.addEventListener('wh-abrir-tour', abrir)
    return () => window.removeEventListener('wh-abrir-tour', abrir)
  }, [])

  // Posición del recuadro resaltado sobre el elemento del paso
  useEffect(() => {
    if (pasoIdx === null || !pasos[pasoIdx]) return
    const el = document.querySelector(`[data-tour="${pasos[pasoIdx].objetivo}"]`)
    setRect(el ? el.getBoundingClientRect() : null)
    if (typeof el?.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' })
    botonRef.current?.focus()
  }, [pasoIdx, pasos])

  useEffect(() => {
    if (pasoIdx === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cerrar()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [pasoIdx, cerrar])

  if (pasoIdx === null || !pasos[pasoIdx]) return null
  const paso = pasos[pasoIdx]
  const ultimo = pasoIdx === pasos.length - 1

  return (
    <div className="fixed inset-0 z-[70]" role="presentation">
      {rect ? (
        <div
          aria-hidden="true"
          className="fixed rounded-lg ring-4 ring-wh-orange"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: '0 0 0 9999px rgba(22,25,30,0.6)',
          }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-wh-ink/60" />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Tutorial, paso ${pasoIdx + 1} de ${pasos.length}: ${paso.titulo}`}
        className="fixed w-[min(92vw,360px)] rounded-[13px] bg-wh-surface p-5 shadow-xl"
        style={{
          top: rect ? Math.min(rect.bottom + 16, Math.max(window.innerHeight - 240, 16)) : '30%',
          left: rect ? Math.min(Math.max(rect.left, 16), Math.max(window.innerWidth - 392, 16)) : '50%',
          transform: rect ? undefined : 'translateX(-50%)',
        }}
      >
        <p className="font-display text-[13px] font-semibold uppercase tracking-[0.16em] text-wh-muted-2">
          Paso {pasoIdx + 1} de {pasos.length}
        </p>
        <h2 className="mt-1 font-display text-[19px] font-bold uppercase">{paso.titulo}</h2>
        <p className="mt-2 text-sm leading-relaxed">{paso.texto}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Boton variante="outline" className="!px-4 !py-2 text-sm" onClick={cerrar}>
            Saltar
          </Boton>
          <Boton
            ref={botonRef}
            className="!px-4 !py-2 text-sm"
            onClick={() => (ultimo ? cerrar() : setPasoIdx(pasoIdx + 1))}
          >
            {ultimo ? 'Terminar' : 'Siguiente'}
          </Boton>
        </div>
      </div>
    </div>
  )
}
