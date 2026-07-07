import { ArrowLeft } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import Badge from '../components/Badge'
import Boton from '../components/Boton'
import EstadoVacio from '../components/EstadoVacio'
import KpiCard from '../components/KpiCard'
import Panel from '../components/Panel'
import Tabla from '../components/Tabla'
import * as api from '../lib/api'
import { ApiError, type Ficha as DatosFicha, type Unidad } from '../lib/types'

const dinero = (n: number) => '$' + n.toLocaleString('en-US')

export default function Ficha() {
  const { id } = useParams()
  const [ficha, setFicha] = useState<DatosFicha | null>(null)
  const [unidades, setUnidades] = useState<Unidad[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [noEncontrada, setNoEncontrada] = useState(false)

  const cargar = useCallback(async () => {
    if (!id) return
    setCargando(true)
    setError(null)
    setNoEncontrada(false)
    try {
      const [f, us] = await Promise.all([api.getFicha(id), api.getUnidades()])
      setFicha(f)
      setUnidades(us)
    } catch (e) {
      if (e instanceof ApiError && e.codigo === 'not_found') setNoEncontrada(true)
      else setError(e instanceof Error ? e.message : 'No se pudieron cargar los datos.')
    } finally {
      setCargando(false)
    }
  }, [id])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const nombreUnidad = (idNum: number | null) =>
    unidades.find((u) => u.id === idNum)?.id_unidad ?? '—'

  if (noEncontrada) {
    return (
      <div className="flex flex-col items-center gap-4">
        <h1 className="sr-only">Unidad no encontrada</h1>
        <EstadoVacio mensaje="Unidad no encontrada" />
        <Link to="/catalogo">
          <Boton variante="oscuro">Ir al catálogo</Boton>
        </Link>
      </div>
    )
  }

  const esYonke = ficha?.unidad.estado === 'Yonke'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/catalogo"
          aria-label="Volver al catálogo"
          className="rounded-md p-2 text-wh-muted hover:text-wh-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-wh-orange-focus"
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </Link>
        <h1 className="font-display text-[34px] font-bold uppercase leading-none">
          {id}
        </h1>
        {ficha && (
          <>
            <Badge tipo="estadoUnidad" valor={ficha.unidad.estado} />
            <span className="text-wh-muted">{ficha.unidad.tipo}</span>
            {ficha.unidad.candidata_reincidencia && (
              <Badge tipo="origen" valor="Yonke" texto="Candidata a reincidencia" />
            )}
          </>
        )}
      </div>

      <section aria-label="KPIs de la unidad" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard etiqueta="Diésel" valor={ficha ? dinero(ficha.kpis.diesel) : null} cargando={cargando} />
        <KpiCard etiqueta="Refacciones" valor={ficha ? dinero(ficha.kpis.refacciones) : null} cargando={cargando} />
        <KpiCard etiqueta="Taller" valor={ficha ? dinero(ficha.kpis.taller) : null} cargando={cargando} />
        <KpiCard
          etiqueta="Valor de referencia"
          valor={ficha ? (ficha.unidad.valor_referencia !== null ? dinero(ficha.unidad.valor_referencia) : null) : null}
          cargando={cargando}
        />
      </section>

      {esYonke ? (
        <Panel titulo="Piezas donadas a otras unidades">
          <Tabla
            etiqueta="Piezas donadas"
            columnas={[
              { titulo: 'Pieza', render: (p) => <span className="font-semibold">{p.descripcion_pieza}</span> },
              {
                titulo: 'Destino',
                render: (p) => (
                  <Link
                    to={`/ficha/${p.unidad_destino}`}
                    className="font-display font-bold text-wh-orange-ink underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-wh-orange-focus"
                  >
                    {p.unidad_destino}
                  </Link>
                ),
              },
              {
                titulo: 'Costo',
                alinear: 'right',
                render: (p) => (
                  <span className="inline-flex items-center gap-2">
                    <Badge tipo="origen" valor="Yonke" texto="Estimado" />
                    {dinero(p.costo_estimado)}
                  </span>
                ),
              },
              { titulo: 'Fecha', render: (p) => p.fecha },
            ]}
            filas={ficha?.piezas_donadas ?? null}
            cargando={cargando}
            error={error}
            onReintentar={() => void cargar()}
            textoVacio="Esta unidad Yonke aún no dona piezas"
            claveFila={(p) => p.descripcion_pieza + p.fecha}
          />
        </Panel>
      ) : (
        <>
          <Panel titulo="Historial de reparaciones">
            <Tabla
              etiqueta="Historial de reparaciones"
              columnas={[
                { titulo: 'Ingreso', render: (r) => r.fecha_ingreso },
                { titulo: 'Diagnóstico', render: (r) => <span className="font-semibold">{r.diagnostico}</span> },
                { titulo: 'Criticidad', render: (r) => <Badge tipo="criticidad" valor={r.criticidad} /> },
                {
                  titulo: 'Liberación',
                  render: (r) =>
                    r.tipo_liberacion ? (
                      <span className="inline-flex items-center gap-2">
                        <Badge tipo="liberacion" valor={r.tipo_liberacion} />
                        {r.es_reincidencia && <Badge tipo="origen" valor="Yonke" texto="Reincidencia" />}
                      </span>
                    ) : (
                      <Badge tipo="neutral" valor="En taller" />
                    ),
                },
                {
                  titulo: 'Días en taller',
                  alinear: 'right',
                  render: (r) => (
                    // Estilo de días largos (RF-FIC-02): ≥60 días resaltado
                    <span className={r.dias_en_taller >= 60 ? 'font-bold text-wh-orange-ink' : ''}>
                      {r.dias_en_taller}
                    </span>
                  ),
                },
                { titulo: 'Costo', alinear: 'right', render: (r) => dinero(r.costo_taller) },
              ]}
              filas={ficha?.reparaciones ?? null}
              cargando={cargando}
              error={error}
              onReintentar={() => void cargar()}
              textoVacio="Sin reparaciones registradas"
              claveFila={(r) => r.fecha_ingreso + r.diagnostico}
            />
          </Panel>

          <Panel titulo="Piezas instaladas">
            <Tabla
              etiqueta="Piezas instaladas"
              columnas={[
                {
                  titulo: 'Pieza',
                  render: (p) => (
                    <span>
                      <span className="block font-semibold">{p.descripcion_pieza}</span>
                      {p.origen === 'Yonke' && (
                        <span className="block text-xs text-wh-muted">
                          donada por {nombreUnidad(p.unidad_donante_id)}
                        </span>
                      )}
                    </span>
                  ),
                },
                { titulo: 'Origen', render: (p) => <Badge tipo="origen" valor={p.origen} /> },
                { titulo: 'Urgencia', render: (p) => <Badge tipo="criticidad" valor={p.urgencia} /> },
                {
                  titulo: 'Costo',
                  alinear: 'right',
                  render: (p) => (
                    // RF-INT-02: un estimado jamás se presenta como facturado
                    <span className="inline-flex items-center gap-2">
                      {p.es_estimado && <Badge tipo="origen" valor="Yonke" texto="Estimado" />}
                      {dinero(p.es_estimado ? (p.costo_estimado ?? 0) : (p.costo_real ?? 0))}
                    </span>
                  ),
                },
                { titulo: 'Fecha', render: (p) => p.fecha_solicitud },
              ]}
              filas={ficha?.piezas_instaladas ?? null}
              cargando={cargando}
              error={error}
              onReintentar={() => void cargar()}
              textoVacio="Sin piezas instaladas"
              claveFila={(p) => p.id}
            />
          </Panel>
        </>
      )}
    </div>
  )
}
