import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import Kicker from '../components/Kicker'
import { ApiError, avanzarEstado, getColaCompras, type FilaCompras } from '../lib/api'
import { useDemo } from '../lib/demo'
import { badge, card, critStyle, estadoReqColors, FD, filtroPill, fmt, h2Titulo, subTitulo, tdCell, thCell, theadRow } from '../lib/estilos'
import type { EstadoRequisicion } from '../lib/types'

const flujo: EstadoRequisicion[] = ['Solicitado', 'Cotizado', 'Comprado', 'Instalado']

const campo: CSSProperties = { padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0', width: '100%' }
const etiqueta: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }

export default function Compras() {
  const { setConfirmar, toast } = useDemo()
  const [filas, setFilas] = useState<FilaCompras[]>([])
  const [filtro, setFiltro] = useState<'Todos' | EstadoRequisicion>('Todos')
  const [comprar, setComprar] = useState<FilaCompras | null>(null)
  const [costoReal, setCostoReal] = useState('')
  const [factura, setFactura] = useState('')
  const [errorModal, setErrorModal] = useState('')

  const cargar = useCallback(async (estado: 'Todos' | EstadoRequisicion = 'Todos') => {
    setFilas(await getColaCompras(estado === 'Todos' ? undefined : estado))
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const cambiarFiltro = (f: 'Todos' | EstadoRequisicion) => {
    setFiltro(f)
    void cargar(f)
  }

  const avanzar = async (q: FilaCompras, nuevo: EstadoRequisicion, extra: { costo_real?: number; numero_factura?: string } = {}) => {
    try {
      await avanzarEstado(q.id, { estado: nuevo, ...extra })
      toast(q.descripcion_pieza + ' → ' + nuevo)
      await cargar(filtro)
      return true
    } catch (e) {
      toast(e instanceof ApiError ? e.message : 'No se pudo avanzar el estado.')
      return false
    }
  }

  const registrarCompra = async () => {
    if (!comprar) return
    setErrorModal('')
    try {
      await avanzarEstado(comprar.id, {
        estado: 'Comprado',
        costo_real: costoReal === '' ? undefined : Number(costoReal),
        numero_factura: factura || undefined,
      })
      toast(comprar.descripcion_pieza + ' → Comprado (factura ' + factura + ')')
      setComprar(null)
      await cargar(filtro)
    } catch (e) {
      setErrorModal(e instanceof ApiError ? e.message : 'No se pudo registrar la compra.')
    }
  }

  const accionDe = (q: FilaCompras): { texto: string; ejecutar: () => void } | null => {
    if (q.origen === 'Yonke') {
      if (q.estado !== 'Solicitado') return null
      return {
        texto: '→ Instalado',
        ejecutar: () =>
          setConfirmar({
            pieza: q.descripcion_pieza,
            destino: q.unidad_destino,
            alConfirmar: () => void avanzar(q, 'Instalado'),
          }),
      }
    }
    switch (q.estado) {
      case 'Solicitado':
        return { texto: '→ Cotizado', ejecutar: () => void avanzar(q, 'Cotizado') }
      case 'Cotizado':
        return {
          texto: '→ Comprado',
          ejecutar: () => {
            setErrorModal('')
            setCostoReal('')
            setFactura('')
            setComprar(q)
          },
        }
      case 'Comprado':
        return {
          texto: '→ Instalado',
          ejecutar: () =>
            setConfirmar({
              pieza: q.descripcion_pieza,
              destino: q.unidad_destino,
              alConfirmar: () => void avanzar(q, 'Instalado'),
            }),
        }
      default:
        return null
    }
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', animation: 'fadeUp 0.35s ease' }}>
        <div>
          <Kicker texto="Compras" />
          <h2 style={h2Titulo}>Panel de Compras</h2>
          <p style={subTitulo}>
            Vista de Montzay · ciclo: Solicitado → Cotizado → Comprado → Instalado. Las piezas de Yonke ya
            traen costo estimado; solo se confirma instalación.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['Todos', ...flujo] as const).map((f) => (
            <button key={f} onClick={() => cambiarFiltro(f)} className="hv-borde-ink" style={filtroPill(filtro === f)}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div data-tour="compras" style={{ ...card, padding: '6px 20px 14px', overflowX: 'auto', animation: 'fadeUp 0.4s ease' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 820 }}>
          <thead>
            <tr style={theadRow}>
              <th style={thCell}>Destino</th>
              <th style={thCell}>Pieza</th>
              <th style={thCell}>Origen</th>
              <th style={{ ...thCell, textAlign: 'right' }}>Costo</th>
              <th style={thCell}>Urgencia</th>
              <th style={thCell}>Estado</th>
              <th style={thCell}>Solicitud</th>
              <th style={thCell}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((q) => {
              const yk = q.origen === 'Yonke'
              const ec = estadoReqColors[q.estado] ?? estadoReqColors.Solicitado
              const accion = accionDe(q)
              const esEstimado = yk && q.costo_real === null
              const costo = q.costo_real ?? q.costo_estimado
              return (
                <tr key={q.id} className="hv-fila">
                  <td style={{ ...tdCell, fontFamily: FD, fontWeight: 700, fontSize: 17, color: '#16191E' }}>
                    {q.unidad_destino}
                  </td>
                  <td style={{ ...tdCell, fontWeight: 600 }}>
                    {q.descripcion_pieza}
                    <div style={{ fontWeight: 400, fontSize: 12.5, color: '#6F6A60' }}>
                      {yk ? 'Donante: ' + (q.unidad_donante ?? '—') + ' (yonke interno)' : 'Compra a proveedor externo'}
                    </div>
                  </td>
                  <td style={tdCell}>
                    <span style={yk ? badge('#FDE8DC', '#B4430A', '#F2620F') : badge('#EAE6DC', '#16191E', '#C9C2B2')}>
                      {q.origen}
                    </span>
                  </td>
                  <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {costo !== null ? fmt(Number(costo)) : 'Por cotizar'}{' '}
                    {esEstimado && (
                      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', background: '#FDE8DC', color: '#B4430A', border: '1px dashed #F2620F', borderRadius: 4, padding: '2px 5px' }}>
                        Est.
                      </span>
                    )}
                  </td>
                  <td style={tdCell}>
                    <span style={critStyle(q.urgencia)}>{q.urgencia}</span>
                  </td>
                  <td style={tdCell}>
                    <span style={badge(ec[0], ec[1], ec[2])}>{q.estado}</span>
                  </td>
                  <td style={{ ...tdCell, color: '#6F6A60', whiteSpace: 'nowrap' }}>{q.fecha_solicitud}</td>
                  <td style={tdCell}>
                    {accion ? (
                      <button
                        onClick={accion.ejecutar}
                        className="hv-inkfill"
                        style={{ padding: '7px 12px', background: '#F3EFE7', border: '1px solid #D8D2C4', borderRadius: 7, fontSize: 12.5, fontWeight: 700, color: '#16191E', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        {accion.texto}
                      </button>
                    ) : (
                      <span style={{ fontSize: 12.5, color: '#2C7A44', fontWeight: 700 }}>✓ Cerrado</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {comprar && (
        <div
          onClick={() => setComprar(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,24,29,0.55)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Registrar compra"
            style={{ background: '#fff', borderRadius: 14, maxWidth: 480, width: '100%', padding: 26, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', borderTop: '5px solid #F2620F', animation: 'fadeUp 0.2s ease' }}
          >
            <h3 style={{ fontFamily: FD, fontWeight: 700, fontSize: 22, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#16191E', margin: '0 0 10px' }}>
              Registrar compra
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: 15, lineHeight: 1.55, color: '#4A4438' }}>
              <strong style={{ color: '#16191E' }}>{comprar.descripcion_pieza}</strong> para el tracto{' '}
              <strong style={{ color: '#F2620F' }}>{comprar.unidad_destino}</strong>: captura el costo real
              facturado para pasar a <strong style={{ color: '#1B4E8C' }}>Comprado</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <label style={etiqueta}>
                Costo real (MXN)
                <input type="number" min={0} style={campo} value={costoReal} onChange={(e) => setCostoReal(e.target.value)} />
              </label>
              <label style={etiqueta}>
                Número de factura
                <input type="text" style={campo} value={factura} placeholder="Ej. F-10233" onChange={(e) => setFactura(e.target.value)} />
              </label>
            </div>
            {errorModal && (
              <div role="alert" style={{ marginTop: 12, background: '#FBEBE8', border: '1px solid #E8A99D', color: '#9B2C2C', borderRadius: 9, padding: '12px 14px', fontSize: 14 }}>
                {errorModal}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setComprar(null)}
                className="hv-crema"
                style={{ padding: '10px 18px', background: '#fff', border: '1px solid #D8D2C4', borderRadius: 8, fontSize: 14, fontWeight: 700, color: '#16191E', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => void registrarCompra()}
                className="hv-naranja"
                style={{ padding: '10px 20px', background: '#F2620F', border: 'none', borderRadius: 8, fontFamily: FD, fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', cursor: 'pointer' }}
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
