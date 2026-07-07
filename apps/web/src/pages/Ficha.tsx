import { useNavigate, useParams } from 'react-router'
import Camion from '../components/Camion'
import { useDemo } from '../lib/demo'
import { badge, card, critStyle, estadoUnidadColors, FD, fmt, h2Titulo, h3Titulo, tdCell, thCell, theadRow } from '../lib/estilos'

export default function Ficha() {
  const { id } = useParams()
  const { datos, reqs } = useDemo()
  const navigate = useNavigate()
  if (!datos) return null

  const ft = datos.tractos.find((t) => t.id === id) ?? datos.tractos[0]
  const esYonke = ft.estado === 'Yonke'
  const fc = estadoUnidadColors[ft.estado] ?? estadoUnidadColors.Activo

  const fichaReps = datos.reparaciones.filter((r) => r.tracto_id === ft.id)
  const fichaPiezas = reqs.filter((q) => q.tracto_destino_id === ft.id)
  const fichaDonaciones = reqs.filter((q) => q.tracto_donante_id === ft.id)
  const fichaKpis = [
    { label: 'Gasto Diésel', valor: fmt(ft.gasto_diesel) },
    { label: 'Gasto Refacciones', valor: fmt(ft.gasto_refacciones) },
    { label: 'Gasto Taller', valor: fmt(ft.gasto_taller) },
    { label: 'Valor estimado de la unidad', valor: ft.valor_estimado ? fmt(ft.valor_estimado) : '—' },
  ]

  const selloEstimado = (
    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: '#FDE8DC', color: '#B4430A', border: '1px dashed #F2620F', borderRadius: 5, padding: '3px 8px' }}>
      Estimado
    </span>
  )

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', animation: 'fadeUp 0.35s ease' }}>
        <button
          onClick={() => navigate('/dashboard')}
          className="hv-borde-naranja"
          style={{ background: '#fff', border: '1px solid #D8D2C4', borderRadius: 8, padding: '9px 14px', fontSize: 13.5, fontWeight: 600, color: '#16191E', cursor: 'pointer' }}
        >
          ← Tablero
        </button>
        <h2 style={h2Titulo}>Ficha · {ft.id}</h2>
        <span style={{ ...badge(fc[0], fc[1], fc[2]), fontSize: 13, padding: '5px 14px' }}>{ft.estado}</span>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontFamily: FD, fontSize: 12.5, fontWeight: 600, color: '#8A8374', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
            Costo total acumulado
          </div>
          <div style={{ fontFamily: FD, fontSize: 34, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {fmt(ft.costo_total)}
          </div>
        </div>
      </div>

      {!esYonke && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, animation: 'fadeUp 0.4s ease' }}>
            {fichaKpis.map((k) => (
              <div key={k.label} style={{ background: '#fff', border: '1px solid #E7E0D2', borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 2px rgba(20,24,29,0.05)' }}>
                <div style={{ fontFamily: FD, fontSize: 12.5, fontWeight: 600, color: '#8A8374', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{k.label}</div>
                <div style={{ fontFamily: FD, fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{k.valor}</div>
              </div>
            ))}
          </div>

          <div style={card}>
            <h3 style={{ ...h3Titulo, margin: '0 0 14px' }}>Historial de reparaciones</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 640 }}>
                <thead>
                  <tr style={theadRow}>
                    <th style={{ ...thCell, padding: '8px 10px' }}>Ingreso</th>
                    <th style={{ ...thCell, padding: '8px 10px' }}>Diagnóstico</th>
                    <th style={{ ...thCell, padding: '8px 10px' }}>Criticidad</th>
                    <th style={{ ...thCell, padding: '8px 10px' }}>Liberación</th>
                    <th style={{ ...thCell, padding: '8px 10px', textAlign: 'right' }}>Días en taller</th>
                    <th style={{ ...thCell, padding: '8px 10px', textAlign: 'right' }}>Costo taller</th>
                  </tr>
                </thead>
                <tbody>
                  {fichaReps.map((r) => (
                    <tr key={r.id} className="hv-fila">
                      <td style={{ ...tdCell, padding: 10, whiteSpace: 'nowrap' }}>{r.fecha_ingreso}</td>
                      <td style={{ ...tdCell, padding: 10, fontWeight: 600 }}>{r.diagnostico}</td>
                      <td style={{ ...tdCell, padding: 10 }}>
                        <span style={critStyle(r.criticidad)}>{r.criticidad}</span>
                      </td>
                      <td style={{ ...tdCell, padding: 10 }}>
                        <span style={r.tipo_liberacion === 'Total' ? badge('#E5F3E9', '#2C7A44', '#9FD4B0') : badge('#FDE8DC', '#B4430A', '#F2620F')}>
                          {r.tipo_liberacion}
                        </span>
                      </td>
                      <td style={{ ...tdCell, padding: 10, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: r.dias_en_taller >= 30 ? 700 : 400 }}>
                        {r.dias_en_taller + (r.dias_en_taller === 1 ? ' día' : ' días')}
                      </td>
                      <td style={{ ...tdCell, padding: 10, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(r.costo_estimado_taller)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ ...h3Titulo, margin: '0 0 4px' }}>Piezas instaladas</h3>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: '#6F6A60' }}>
              Las piezas de Yonke llevan costo <em>estimado</em>: es una asignación interna, no una factura.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {fichaPiezas.map((q) => (
                <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', border: '1px solid #EFEAE0', borderRadius: 10, padding: '12px 16px' }}>
                  <span style={q.origen === 'Yonke' ? badge('#FDE8DC', '#B4430A', '#F2620F') : badge('#EAE6DC', '#16191E', '#C9C2B2')}>
                    {q.origen}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 14.5 }}>{q.descripcion_pieza}</span>
                  <span style={{ fontSize: 13, color: '#6F6A60' }}>
                    {q.origen === 'Yonke' ? 'donada por ' + q.tracto_donante_id : 'compra a proveedor'}
                  </span>
                  <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: FD, fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 18 }}>
                      {q.costo_estimado ? fmt(q.costo_estimado) : 'Pendiente'}
                    </span>
                    {q.origen === 'Yonke' && selloEstimado}
                  </span>
                  <span style={{ fontSize: 12.5, color: '#6F6A60', whiteSpace: 'nowrap' }}>
                    {q.estado} · {q.fecha_instalacion || q.fecha_solicitud}
                  </span>
                </div>
              ))}
              {fichaPiezas.length === 0 && (
                <div style={{ textAlign: 'center', padding: 24, color: '#6F6A60', fontSize: 14 }}>
                  Sin piezas registradas para esta unidad.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {esYonke && (
        <div style={card}>
          <h3 style={{ ...h3Titulo, margin: '0 0 4px' }}>Piezas donadas a otras unidades</h3>
          <p style={{ margin: '0 0 14px', fontSize: 13, color: '#6F6A60' }}>
            Esta unidad es donante del yonke interno. Cada pieza que sale lleva un costo estimado asignado.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {fichaDonaciones.map((q) => (
              <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', border: '1px solid #EFEAE0', borderRadius: 10, padding: '12px 16px' }}>
                <span style={{ fontWeight: 700, fontSize: 14.5 }}>{q.descripcion_pieza}</span>
                <span style={{ fontSize: 13.5, color: '#6F6A60' }}>
                  → instalada en <strong style={{ color: '#F2620F' }}>{q.tracto_destino_id}</strong>
                </span>
                <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: FD, fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: 18 }}>
                    {fmt(q.costo_estimado || 0)}
                  </span>
                  {selloEstimado}
                </span>
                <span style={{ fontSize: 12.5, color: '#6F6A60' }}>{q.fecha_instalacion || q.fecha_solicitud}</span>
              </div>
            ))}
            {fichaDonaciones.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 28, color: '#6F6A60', fontSize: 14 }}>
                <Camion stroke="#16191E" strokeWidth={3} style={{ width: 120, opacity: 0.35 }} />
                Aún no hay piezas donadas registradas de esta unidad.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
