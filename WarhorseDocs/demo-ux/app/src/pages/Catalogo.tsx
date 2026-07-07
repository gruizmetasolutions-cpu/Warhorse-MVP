import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import Badge from '../components/Badge'
import Panel from '../components/Panel'
import Tabla from '../components/Tabla'
import * as api from '../lib/api'
import type { EstadoUnidad, Unidad } from '../lib/types'

const dinero = (n: number) => '$' + n.toLocaleString('en-US')

const filtros: (EstadoUnidad | 'Todos')[] = ['Todos', 'Activo', 'Yonke', 'Inactivo']

export default function Catalogo() {
  const navigate = useNavigate()
  const [unidades, setUnidades] = useState<Unidad[] | null>(null)
  const [filtro, setFiltro] = useState<EstadoUnidad | 'Todos'>('Todos')
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async (estado: EstadoUnidad | 'Todos' = 'Todos') => {
    setCargando(true)
    setError(null)
    try {
      setUnidades(await api.getUnidades(estado === 'Todos' ? undefined : estado))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los datos.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const cambiarFiltro = (f: EstadoUnidad | 'Todos') => {
    setFiltro(f)
    void cargar(f)
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-[34px] font-bold uppercase leading-none">
        Catálogo de unidades
      </h1>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
        {filtros.map((f) => (
          <button
            key={f}
            onClick={() => cambiarFiltro(f)}
            aria-pressed={filtro === f}
            className={`rounded-full border px-4 py-1.5 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-wh-orange-focus ${
              filtro === f
                ? 'border-wh-orange bg-wh-orange text-white'
                : 'border-wh-border bg-white text-wh-muted hover:text-wh-ink'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <Panel>
        <Tabla
          etiqueta="Catálogo maestro de unidades"
          columnas={[
            {
              titulo: 'Unidad',
              render: (u) => (
                <span className="font-display text-base font-bold uppercase">{u.id_unidad}</span>
              ),
            },
            { titulo: 'Tipo', render: (u) => u.tipo },
            {
              titulo: 'Estado',
              render: (u) => (
                <span className="inline-flex items-center gap-2">
                  <Badge tipo="estadoUnidad" valor={u.estado} />
                  {u.candidata_reincidencia && (
                    <Badge tipo="origen" valor="Yonke" texto="Reincidencia" />
                  )}
                </span>
              ),
            },
            {
              titulo: 'Valor de referencia',
              alinear: 'right',
              render: (u) =>
                u.valor_referencia !== null ? (
                  dinero(u.valor_referencia)
                ) : (
                  <Badge tipo="neutral" valor="Pendiente" />
                ),
            },
            {
              titulo: 'Costo real acumulado',
              alinear: 'right',
              render: (u) => dinero(u.costo_real_acumulado),
            },
          ]}
          filas={unidades}
          cargando={cargando}
          error={error}
          onReintentar={() => void cargar(filtro)}
          onFila={(u) => navigate(`/ficha/${u.id_unidad}`)}
          textoVacio="Aún no hay unidades en esta vista"
          claveFila={(u) => u.id}
        />
      </Panel>
    </div>
  )
}
