import { useState } from 'react'
import Kicker from '../components/Kicker'
import { useDemo } from '../lib/demo'
import { badge, card, critStyle, estadoReqColors, FD, filtroPill, fmt, h2Titulo, subTitulo, tdCell, thCell, theadRow } from '../lib/estilos'
import type { EstadoRequisicion } from '../lib/types'

const flujo: EstadoRequisicion[] = ['Solicitado', 'Cotizado', 'Comprado', 'Instalado']
const urgPeso: Record<string, number> = { Crítica: 0, Media: 1, Rápida: 2 }

export default function Compras() {
  const { reqs, avanzarReq, setConfirmar, toast } = useDemo()
  const [filtro, setFiltro] = useState<'Todos' | EstadoRequisicion>('Todos')

  const filas = reqs
    .filter((q) => filtro === 'Todos' || q.estado === filtro)
    .sort((a, b) => urgPeso[a.urgencia] - urgPeso[b.urgencia])

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
            <button key={f} onClick={() => setFiltro(f)} className="hv-borde-ink" style={filtroPill(filtro === f)}>
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
              const next = yk && q.estado === 'Solicitado' ? 'Instalado' : flujo[flujo.indexOf(q.estado) + 1]
              const ec = estadoReqColors[q.estado] ?? estadoReqColors.Solicitado
              const avanzar = () => {
                if (next === 'Instalado') {
                  setConfirmar({ id: q.id, pieza: q.descripcion_pieza, destino: q.tracto_destino_id, next })
                } else if (next) {
                  avanzarReq(q.id, next)
                  toast(q.descripcion_pieza + ' → ' + next)
                }
              }
              return (
                <tr key={q.id} className="hv-fila">
                  <td style={{ ...tdCell, fontFamily: FD, fontWeight: 700, fontSize: 17, color: '#16191E' }}>
                    {q.tracto_destino_id}
                  </td>
                  <td style={{ ...tdCell, fontWeight: 600 }}>
                    {q.descripcion_pieza}
                    <div style={{ fontWeight: 400, fontSize: 12.5, color: '#6F6A60' }}>
                      {yk ? 'Donante: ' + q.tracto_donante_id + ' (yonke interno)' : 'Compra a proveedor externo'}
                    </div>
                  </td>
                  <td style={tdCell}>
                    <span style={yk ? badge('#FDE8DC', '#B4430A', '#F2620F') : badge('#EAE6DC', '#16191E', '#C9C2B2')}>
                      {q.origen}
                    </span>
                  </td>
                  <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {q.costo_estimado ? fmt(q.costo_estimado) : 'Por cotizar'}{' '}
                    {yk && (
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
                    {next ? (
                      <button
                        onClick={avanzar}
                        className="hv-inkfill"
                        style={{ padding: '7px 12px', background: '#F3EFE7', border: '1px solid #D8D2C4', borderRadius: 7, fontSize: 12.5, fontWeight: 700, color: '#16191E', cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        → {next}
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
    </>
  )
}
