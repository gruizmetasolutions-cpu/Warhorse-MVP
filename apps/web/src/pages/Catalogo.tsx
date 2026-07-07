import { useState } from 'react'
import { useNavigate } from 'react-router'
import Camion from '../components/Camion'
import Kicker from '../components/Kicker'
import { useDemo } from '../lib/demo'
import { badge, card, estadoUnidadColors, FD, filtroPill, fmt, h2Titulo, subTitulo, tdCell, thCell, theadRow } from '../lib/estilos'
import type { EstadoUnidad } from '../lib/types'

const filtros: ('Todos' | EstadoUnidad)[] = ['Todos', 'Activo', 'Yonke', 'Inactivo']

export default function Catalogo() {
  const { datos } = useDemo()
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState<'Todos' | EstadoUnidad>('Todos')
  if (!datos) return null

  const filas = datos.tractos.filter((t) => filtro === 'Todos' || t.estado === filtro)
  const nYonke = datos.tractos.filter((t) => t.estado === 'Yonke').length

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', animation: 'fadeUp 0.35s ease' }}>
        <div>
          <Kicker texto="Flota" />
          <h2 style={h2Titulo}>Catálogo de Unidades</h2>
          <p style={subTitulo}>
            {nYonke + ' unidades Yonke disponibles como donantes ahora mismo · ' + datos.tractos.length + ' unidades en total'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {filtros.map((f) => (
            <button key={f} onClick={() => setFiltro(f)} className="hv-borde-ink" style={filtroPill(filtro === f)}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div data-tour="catalogo" style={{ ...card, padding: '6px 20px 14px', overflowX: 'auto', animation: 'fadeUp 0.4s ease' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 560 }}>
          <thead>
            <tr style={theadRow}>
              <th style={thCell}>Unidad</th>
              <th style={thCell}>Tipo</th>
              <th style={thCell}>Estado</th>
              <th style={{ ...thCell, textAlign: 'right' }}>Costo total acumulado</th>
              <th style={thCell}></th>
            </tr>
          </thead>
          <tbody>
            {filas.map((t) => {
              const c = estadoUnidadColors[t.estado]
              return (
                <tr key={t.id} className="hv-fila">
                  <td style={{ ...tdCell, fontFamily: FD, fontWeight: 700, fontSize: 17, color: '#16191E' }}>{t.id}</td>
                  <td style={tdCell}>{t.tipo}</td>
                  <td style={tdCell}>
                    <span style={badge(c[0], c[1], c[2])}>{t.estado}</span>
                  </td>
                  <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {t.costo_total ? fmt(t.costo_total) : '—'}
                  </td>
                  <td style={{ ...tdCell, textAlign: 'right' }}>
                    <button
                      onClick={() => navigate('/ficha/' + t.id)}
                      className="hv-inkfill"
                      style={{ padding: '7px 12px', background: '#F3EFE7', border: '1px solid #D8D2C4', borderRadius: 7, fontSize: 12.5, fontWeight: 700, color: '#16191E', cursor: 'pointer' }}
                    >
                      Ver ficha
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filas.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 30, color: '#6F6A60', fontSize: 14 }}>
            <Camion stroke="#16191E" strokeWidth={3} style={{ width: 120, opacity: 0.35 }} />
            Aún no hay unidades en esta vista.
          </div>
        )}
      </div>
    </>
  )
}
