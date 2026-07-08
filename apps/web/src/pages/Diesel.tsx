import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import Kicker from '../components/Kicker'
import { ApiError, getDiesel, registrarCarga, type CargaDieselApi } from '../lib/api'
import { useDemo } from '../lib/demo'
import { card, FD, fmt, h2Titulo, h3Titulo, subTitulo, tdCell, thCell, theadRow } from '../lib/estilos'

const campo: CSSProperties = { padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0', width: '100%' }
const etiqueta: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }

export default function Diesel() {
  const { unidades, toast } = useDemo()
  const [cargas, setCargas] = useState<CargaDieselApi[]>([])
  const [unidadId, setUnidadId] = useState('')
  const [fecha, setFecha] = useState('')
  const [litros, setLitros] = useState('')
  const [costo, setCosto] = useState('')
  const [km, setKm] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const cargar = useCallback(async () => {
    setCargas(await getDiesel())
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const registrar = async () => {
    setError('')
    if (!unidadId) return setError('Selecciona la unidad que cargó diésel.')
    if (!fecha) return setError('Captura la fecha de la carga.')
    if (litros === '') return setError('Captura los litros cargados.')
    if (costo === '') return setError('Captura el costo total de la carga.')
    if (km === '') return setError('Captura los kilómetros recorridos desde la última carga.')
    setEnviando(true)
    try {
      const carga = await registrarCarga({
        unidad_id: Number(unidadId),
        fecha,
        litros: Number(litros),
        costo_total: Number(costo),
        km_recorridos: Number(km),
      })
      setUnidadId(''); setFecha(''); setLitros(''); setCosto(''); setKm('')
      toast(`Carga registrada — el consolidado de ${carga.id_unidad} ya la refleja.`)
      await cargar()
    } catch (e) {
      if (e instanceof ApiError) {
        const campos = e.fields ? Object.values(e.fields).flat() : []
        setError(campos[0] ?? e.message)
      } else {
        setError('No se pudo registrar la carga. Intenta de nuevo.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <div style={{ animation: 'fadeUp 0.35s ease' }}>
        <Kicker texto="Combustible" />
        <h2 style={h2Titulo}>Control de Diésel</h2>
        <p style={subTitulo}>
          Cada carga suma al costo real de su unidad y alimenta la eficiencia km/L del Tablero.
          Litros, costo y kilómetros se validan contra el catálogo.
        </p>
      </div>

      <div data-tour="diesel" style={{ ...card, animation: 'fadeUp 0.4s ease' }}>
        <h3 style={{ ...h3Titulo, margin: '0 0 14px' }}>Registrar carga</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, alignItems: 'end' }}>
          <label style={etiqueta}>
            Unidad
            <select style={campo} value={unidadId} onChange={(e) => { setUnidadId(e.target.value); setError('') }}>
              <option value="">Selecciona unidad…</option>
              {unidades
                .filter((u) => u.estado === 'Activo')
                .map((u) => (
                  <option key={u.id} value={String(u.id)}>{u.id_unidad + ' · ' + u.tipo}</option>
                ))}
            </select>
          </label>
          <label style={etiqueta}>
            Fecha de la carga
            <input type="date" style={campo} value={fecha} onChange={(e) => { setFecha(e.target.value); setError('') }} />
          </label>
          <label style={etiqueta}>
            Litros
            <input type="number" min={0} step="0.01" style={campo} placeholder="320.5" value={litros} onChange={(e) => { setLitros(e.target.value); setError('') }} />
          </label>
          <label style={etiqueta}>
            Costo total (MXN)
            <input type="number" min={0} step="0.01" style={campo} placeholder="8975.00" value={costo} onChange={(e) => { setCosto(e.target.value); setError('') }} />
          </label>
          <label style={etiqueta}>
            Kilómetros recorridos
            <input type="number" min={0} style={campo} placeholder="410" value={km} onChange={(e) => { setKm(e.target.value); setError('') }} />
          </label>
          <button
            onClick={() => void registrar()}
            disabled={enviando}
            className="hv-naranja"
            style={{ padding: '12px 20px', background: '#F2620F', color: '#fff', border: 'none', borderRadius: 9, fontFamily: FD, fontWeight: 700, fontSize: 16, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', opacity: enviando ? 0.7 : 1 }}
          >
            Registrar carga
          </button>
        </div>
        {error && (
          <div role="alert" style={{ marginTop: 14, background: '#FBEBE8', border: '1px solid #E8A99D', color: '#9B2C2C', borderRadius: 9, padding: '12px 14px', fontSize: 14 }}>
            {error}
          </div>
        )}
      </div>

      <div style={{ ...card, padding: '6px 20px 14px', overflowX: 'auto', animation: 'fadeUp 0.45s ease' }}>
        <h3 style={{ ...h3Titulo, margin: '14px 0' }}>Cargas recientes</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 640 }}>
          <thead>
            <tr style={theadRow}>
              <th style={thCell}>Unidad</th>
              <th style={thCell}>Fecha</th>
              <th style={{ ...thCell, textAlign: 'right' }}>Litros</th>
              <th style={{ ...thCell, textAlign: 'right' }}>Costo</th>
              <th style={{ ...thCell, textAlign: 'right' }}>Km recorridos</th>
              <th style={{ ...thCell, textAlign: 'right' }}>km/L</th>
            </tr>
          </thead>
          <tbody>
            {cargas.map((c) => (
              <tr key={c.id} className="hv-fila">
                <td style={{ ...tdCell, fontFamily: FD, fontWeight: 700, fontSize: 17 }}>{c.id_unidad}</td>
                <td style={{ ...tdCell, whiteSpace: 'nowrap' }}>{c.fecha}</td>
                <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.litros} L</td>
                <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(c.costo_total)}</td>
                <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.km_recorridos} km</td>
                <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                  {c.litros > 0 ? (c.km_recorridos / c.litros).toFixed(1) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cargas.length === 0 && (
          <div style={{ textAlign: 'center', padding: 24, color: '#6F6A60', fontSize: 14 }}>
            Sin cargas registradas todavía.
          </div>
        )}
      </div>
    </>
  )
}
