import { useState, useEffect } from 'react'
import Kicker from '../components/Kicker'
import { getColaCompras, type FilaCompras } from '../lib/api'
import { useDemo } from '../lib/demo'
import { card, FD, fmt, h2Titulo, h3Titulo, subTitulo, tdCell, theadRow } from '../lib/estilos'

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

  // CSV Generator Helper
  const descargarCSV = (headers: string[], rows: string[][], filename: string) => {
    const csvContent =
      '\uFEFF' + // UTF-8 BOM
      [headers.join(','), ...rows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast(`Reporte ${filename} descargado exitosamente.`)
  }

  const exportarFlota = () => {
    const headers = ['ID Unidad', 'Tipo', 'Estado', 'Fecha de Alta', 'Valor de Referencia (MXN)', 'Costo Acumulado (MXN)']
    const rows = unidades.map((u) => [
      String(u.id_unidad),
      String(u.tipo === 'Servicio' ? 'Camioneta de servicio' : u.tipo),
      String(u.estado),
      String(u.fecha_alta ?? '—'),
      u.valor_referencia !== null ? String(u.valor_referencia) : '—',
      String(u.costo_real_acumulado ?? 0),
    ])
    descargarCSV(headers, rows, `Reporte_Flota_${new Date().toISOString().split('T')[0]}.csv`)
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
    descargarCSV(headers, rows, `Reporte_Compras_${new Date().toISOString().split('T')[0]}.csv`)
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
            <p style={{ margin: '8px 0 0', fontSize: 14, color: '#6F6A60', lineHeight: 1.5 }}>
              Detalle estructurado de todos los vehículos activos, inactivos, donantes (Yonke) y vendidos, con costos consolidados individuales.
            </p>
            <div style={{ marginTop: 14, background: '#FAF7F0', padding: 12, borderRadius: 8, fontSize: 13, color: '#4A4438', fontWeight: 600 }}>
              📊 Total de registros: {unidades.length} unidades
            </div>
          </div>
          <button
            onClick={exportarFlota}
            className="hv-naranja"
            style={{
              padding: '12px 18px', background: '#F2620F', color: '#fff', border: 'none', borderRadius: 8,
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
            <p style={{ margin: '8px 0 0', fontSize: 14, color: '#6F6A60', lineHeight: 1.5 }}>
              Histórico consolidado de compras y requisiciones con estatus en tiempo real, costos reales facturados y costos estimados de Yonke.
            </p>
            <div style={{ marginTop: 14, background: '#FAF7F0', padding: 12, borderRadius: 8, fontSize: 13, color: '#4A4438', fontWeight: 600 }}>
              📊 Total de registros: {cargando ? 'Calculando...' : `${compras.length} piezas`}
            </div>
          </div>
          <button
            onClick={exportarCompras}
            disabled={cargando}
            className="hv-naranja"
            style={{
              padding: '12px 18px', background: '#F2620F', color: '#fff', border: 'none', borderRadius: 8,
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
              <th style={tdCell}>Tipo</th>
              <th style={tdCell}>Estado</th>
              <th style={{ ...tdCell, textAlign: 'right' }}>Valor Ref.</th>
              <th style={{ ...tdCell, textAlign: 'right' }}>Costo Acum.</th>
            </tr>
          </thead>
          <tbody>
            {unidades.slice(0, 5).map((u) => (
              <tr key={u.id} className="hv-fila">
                <td style={{ ...tdCell, fontWeight: 700, fontFamily: FD, fontSize: 16, color: '#16191E' }}>{u.id_unidad}</td>
                <td style={tdCell}>{u.tipo === 'Servicio' ? 'Camioneta de servicio' : u.tipo}</td>
                <td style={tdCell}>{u.estado}</td>
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
