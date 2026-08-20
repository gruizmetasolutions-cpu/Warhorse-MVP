import { useState, useEffect } from 'react'
import Kicker from '../components/Kicker'
import { getColaCompras, type FilaCompras } from '../lib/api'
import { useDemo } from '../lib/demo'
import { card, FD, fmt, h2Titulo, h3Titulo, subTitulo, tdCell, theadRow } from '../lib/estilos'
import { descargarCSV } from '../lib/csv'

export default function Reportes() {
  const { unidades, toast } = useDemo()
  const [compras, setCompras] = useState<FilaCompras[]>([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    const cargarCompras = async () => {
      setCargando(true)
      try {
        setCompras(await getColaCompras())
      } catch (e) {
        console.error('Error al cargar datos para reportes', e)
      } finally {
        setCargando(false)
      }
    }
    void cargarCompras()
  }, [])

  const exportarFlota = () => {
    const headers = ['ID Unidad', 'VIN', 'Tipo', 'Vehículo', 'Placas', 'Estado', 'Fecha de Alta', 'Valor de Referencia (MXN)', 'Costo Acumulado (MXN)']
    const rows = unidades.map((u) => [
      String(u.id_unidad),
      String(u.vin || '-'),
      String(u.tipo === 'Servicio' ? 'UTILITARIO' : u.tipo),
      String(u.marca || '-'),
      String(u.placas || '-'),
      String(u.estado),
      String(u.fecha_alta ?? '—'),
      u.valor_referencia !== null ? String(u.valor_referencia) : '—',
      String(u.costo_real_acumulado ?? 0),
    ])
    const filename = `Reporte_Flota_${new Date().toISOString().split('T')[0]}.csv`
    descargarCSV(headers, rows, filename)
    toast(`Reporte ${filename} descargado exitosamente.`)
  }

  const exportarCompras = () => {
    const headers = ['ID', 'Unidad Destino', 'Pieza', 'Origen', 'Costo (MXN)', 'Costo Tipo', 'Estado', 'Urgencia', 'Fecha Solicitud', 'Número Factura']
    const rows = compras.map((c) => [
      String(c.id),
      String(c.unidad_destino),
      String(c.descripcion_pieza),
      String(c.origen),
      String(c.costo_real ?? c.costo_estimado ?? 0),
      c.costo_real !== null ? 'Real' : 'Estimado',
      String(c.estado),
      String(c.urgencia),
      String(c.fecha_solicitud),
      String(c.numero_factura ?? '—'),
    ])
    const filename = `Reporte_Compras_${new Date().toISOString().split('T')[0]}.csv`
    descargarCSV(headers, rows, filename)
    toast(`Reporte ${filename} descargado exitosamente.`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeUp 0.35s ease' }}>
      <div>
        <Kicker texto="Módulo de Analítica" />
        <h2 style={h2Titulo}>Módulo de Reportes</h2>
        <p style={subTitulo}>
          Exportación de datos tabulares consolidados en formato CSV compatible con Microsoft Excel y herramientas BI.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        {/* Flota Report Card */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
          <div>
            <h3 style={h3Titulo}>🚗 Reporte de Flota y Unidades</h3>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Detalle estructurado de todos los vehículos activos, inactivos, donantes (Yonke) y vendidos, con costos consolidados individuales.
            </p>
            <div style={{ marginTop: 14, background: 'var(--bg-input)', padding: 12, borderRadius: 8, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
              📊 Total de registros: {unidades.length} unidades
            </div>
          </div>
          <button
            onClick={exportarFlota}
            className="hv-naranja"
            style={{
              padding: '12px 18px', background: 'var(--accent-gold)', color: 'var(--text-main)', border: 'none', borderRadius: 8,
              fontFamily: FD, fontWeight: 700, fontSize: 15.5, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(242,98,15,0.15)'
            }}
          >
            Descargar CSV de Flota
          </button>
        </div>

        {/* Compras Report Card */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 14 }}>
          <div>
            <h3 style={h3Titulo}>🛒 Reporte de Compras y Requisiciones</h3>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Histórico consolidado de compras y requisiciones con estatus en tiempo real, costos reales facturados y costos estimados de Yonke.
            </p>
            <div style={{ marginTop: 14, background: 'var(--bg-input)', padding: 12, borderRadius: 8, fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
              📊 Total de registros: {cargando ? 'Calculando...' : `${compras.length} piezas`}
            </div>
          </div>
          <button
            onClick={exportarCompras}
            disabled={cargando}
            className="hv-naranja"
            style={{
              padding: '12px 18px', background: 'var(--accent-gold)', color: 'var(--text-main)', border: 'none', borderRadius: 8,
              fontFamily: FD, fontWeight: 700, fontSize: 15.5, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(242,98,15,0.15)', opacity: cargando ? 0.6 : 1
            }}
          >
            {cargando ? 'Procesando...' : 'Descargar CSV de Compras'}
          </button>
        </div>
      </div>

      {/* Live Preview Section */}
      <div style={{ ...card, padding: '16px 20px', overflowX: 'auto' }}>
        <h3 style={{ ...h3Titulo, fontSize: 16, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          👀 Vista Previa del Reporte de Flota (Primeras 5 Unidades)
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={theadRow}>
              <th style={tdCell}>ID Unidad</th>
              <th style={tdCell}>VIN</th>
              <th style={tdCell}>Tipo</th>
              <th style={tdCell}>Vehículo</th>
              <th style={tdCell}>Placas</th>
              <th style={tdCell}>Estado</th>
              <th style={tdCell}>Fecha Alta</th>
              <th style={{ ...tdCell, textAlign: 'right' }}>Valor Ref.</th>
              <th style={{ ...tdCell, textAlign: 'right' }}>Costo Acum.</th>
            </tr>
          </thead>
          <tbody>
            {unidades.slice(0, 5).map((u) => (
              <tr key={u.id} className="hv-fila">
                <td style={{ ...tdCell, fontWeight: 700, fontFamily: FD, fontSize: 16, color: 'var(--text-main)' }}>{u.id_unidad}</td>
                <td style={tdCell}>{u.vin || '-'}</td>
                <td style={tdCell}>{u.tipo === 'Servicio' ? 'UTILITARIO' : u.tipo}</td>
                <td style={tdCell}>
                  <div style={{ fontWeight: 500 }}>{u.marca || '-'}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{u.modelo || '-'}</div>
                </td>
                <td style={tdCell}>{u.placas || '-'}</td>
                <td style={tdCell}>{u.estado}</td>
                <td style={tdCell}>{u.fecha_alta ?? '—'}</td>
                <td style={{ ...tdCell, textAlign: 'right' }}>{u.valor_referencia ? fmt(u.valor_referencia) : '—'}</td>
                <td style={{ ...tdCell, textAlign: 'right', fontWeight: 600 }}>{fmt(u.costo_real_acumulado ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
