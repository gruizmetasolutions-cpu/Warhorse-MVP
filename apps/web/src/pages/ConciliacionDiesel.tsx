import { useState, type CSSProperties } from 'react'
import Kicker from '../components/Kicker'
import { badge, card, FD, fmt, h2Titulo, h3Titulo, subTitulo, tdCell, thCell, theadRow } from '../lib/estilos'
import { useDemo } from '../lib/demo'

const campo: CSSProperties = { padding: 12, border: '1px solid var(--border-color)', borderRadius: 9, fontSize: 15, background: 'var(--bg-input)', width: '100%' }
const etiqueta: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }

interface FilaConciliada {
  unidad: string
  litros: number
  costo: number
  distancia: number
  rendimiento: number // km / L
}

interface CargaExterna {
  id: number
  fecha: string
  litrosTotales: number
  costoTotal: number
  desglose: { unidad: string; litros: number }[]
}

export default function ConciliacionDiesel() {
  const { unidades, toast } = useDemo()
  const [combustibleCSV, setCombustibleCSV] = useState<string>('')
  const [samsaraCSV, setSamsaraCSV] = useState<string>('')
  const [resultados, setResultados] = useState<FilaConciliada[]>([])
  const [dragComb, setDragComb] = useState(false)
  const [dragSamsara, setDragSamsara] = useState(false)

  const handleFileDrop = (tipo: 'combustible' | 'samsara', file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      if (tipo === 'combustible') {
        setCombustibleCSV(text)
      } else {
        setSamsaraCSV(text)
      }
      toast(`Archivo "${file.name}" cargado correctamente.`)
    }
    reader.readAsText(file)
  }

  // Split loads state (mock dataset for external tanks)
  const [cargasExternas, setCargasExternas] = useState<CargaExterna[]>([
    { id: 1, fecha: '2026-07-25', litrosTotales: 150, costoTotal: 3450, desglose: [{ unidad: 'CJ12', litros: 50 }] },
    { id: 2, fecha: '2026-07-26', litrosTotales: 300, costoTotal: 6900, desglose: [] }
  ])

  const [desglosarCarga, setDesglosarCarga] = useState<CargaExterna | null>(null)
  const [nuevaUnidadDesglose, setNuevaUnidadDesglose] = useState('')
  const [nuevosLitrosDesglose, setNuevosLitrosDesglose] = useState('')

  const parsearYCruzar = () => {
    if (!combustibleCSV.trim() || !samsaraCSV.trim()) {
      return toast('Por favor, ingresa los datos crudos en ambos campos de texto CSV.')
    }

    // Mock client-side parser to read and cross-reference CSV lines
    try {
      const lineasComb = combustibleCSV.split('\n').map(l => l.split(',')).filter(l => l.length >= 3)
      const lineasSamsara = samsaraCSV.split('\n').map(l => l.split(',')).filter(l => l.length >= 2)

      const mapaComb: Record<string, { litros: number; costo: number }> = {}
      lineasComb.forEach((row, i) => {
        if (i === 0) return // Skip header
        const unidad = row[0]?.trim()
        const litros = Number(row[1]) || 0
        const costo = Number(row[2]) || 0
        if (unidad) {
          if (!mapaComb[unidad]) mapaComb[unidad] = { litros: 0, costo: 0 }
          mapaComb[unidad].litros += litros
          mapaComb[unidad].costo += costo
        }
      })

      const mapaSamsara: Record<string, number> = {}
      lineasSamsara.forEach((row, i) => {
        if (i === 0) return // Skip header
        const unidad = row[0]?.trim()
        const distancia = Number(row[1]) || 0
        if (unidad) {
          if (!mapaSamsara[unidad]) mapaSamsara[unidad] = 0
          mapaSamsara[unidad] += distancia
        }
      })

      const cruzados: FilaConciliada[] = []
      Object.keys(mapaComb).forEach(unidad => {
        const comb = mapaComb[unidad]
        const dist = mapaSamsara[unidad] ?? 0
        const rend = comb.litros > 0 ? Number((dist / comb.litros).toFixed(2)) : 0
        cruzados.push({
          unidad,
          litros: comb.litros,
          costo: comb.costo,
          distancia: dist,
          rendimiento: rend
        })
      })

      setResultados(cruzados)
      toast('Cruces de telemetría de Samsara y combustible calculados exitosamente.')
    } catch (e) {
      toast('Error al parsear los archivos CSV. Verifica el formato.')
    }
  }

  const agregarDesglose = () => {
    if (!desglosarCarga) return
    const l = Number(nuevosLitrosDesglose)
    if (!nuevaUnidadDesglose) return toast('Selecciona la unidad destino.')
    if (isNaN(l) || l <= 0) return toast('Ingresa una cantidad de litros válida.')

    const litrosAsignados = desglosarCarga.desglose.reduce((sum, item) => sum + item.litros, 0)
    if (litrosAsignados + l > desglosarCarga.litrosTotales) {
      return toast('La suma del desglose supera el total de litros disponibles en el tanque.')
    }

    const nuevoDesglose = [...desglosarCarga.desglose, { unidad: nuevaUnidadDesglose, litros: l }]
    const actualizada = { ...desglosarCarga, desglose: nuevoDesglose }

    setCargasExternas(prev => prev.map(c => c.id === desglosarCarga.id ? actualizada : c))
    setDesglosarCarga(actualizada)
    setNuevaUnidadDesglose('')
    setNuevosLitrosDesglose('')
    toast('Carga parcial asignada exitosamente.')
  }

  const limpiarDesglose = (idx: number) => {
    if (!desglosarCarga) return
    const nuevoDesglose = desglosarCarga.desglose.filter((_, i) => i !== idx)
    const actualizada = { ...desglosarCarga, desglose: nuevoDesglose }

    setCargasExternas(prev => prev.map(c => c.id === desglosarCarga.id ? actualizada : c))
    setDesglosarCarga(actualizada)
    toast('Asignación de carga removida.')
  }

  return (
    <>
      <div style={{ animation: 'fadeUp 0.35s ease' }}>
        <Kicker texto="Diésel y Combustible" />
        <h2 style={h2Titulo}>Conciliación Automática de Telemetría</h2>
        <p style={subTitulo}>
          Carga archivos de combustible y telemetría Samsara en crudo CSV para comparar distancias recorridas contra litros dispensados.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 18, animation: 'fadeUp 0.4s ease' }}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragComb(true) }}
          onDragLeave={() => setDragComb(false)}
          onDrop={(e) => { e.preventDefault(); setDragComb(false); const f = e.dataTransfer.files?.[0]; if (f) handleFileDrop('combustible', f) }}
          style={{
            ...card,
            border: dragComb ? '2px dashed #C5A059' : '1px solid #E7E0D2',
            background: dragComb ? '#FDF3EC' : '#fff',
            transition: 'all 0.2s ease'
          }}
        >
          <label style={etiqueta}>
            CSV Combustible Crudo (Unidad, Litros, Costo)
            <textarea
              style={{ ...campo, height: 120, fontFamily: 'monospace', fontSize: 13 }}
              placeholder="Unidad,Litros,Costo&#10;WH101,150,3450&#10;WH104,220,5060"
              value={combustibleCSV}
              onChange={(e) => setCombustibleCSV(e.target.value)}
            />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
              📂 Suelta tu archivo CSV de combustible aquí para cargarlo automáticamente
            </span>
          </label>
        </div>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragSamsara(true) }}
          onDragLeave={() => setDragSamsara(false)}
          onDrop={(e) => { e.preventDefault(); setDragSamsara(false); const f = e.dataTransfer.files?.[0]; if (f) handleFileDrop('samsara', f) }}
          style={{
            ...card,
            border: dragSamsara ? '2px dashed #C5A059' : '1px solid #E7E0D2',
            background: dragSamsara ? '#FDF3EC' : '#fff',
            transition: 'all 0.2s ease'
          }}
        >
          <label style={etiqueta}>
            CSV Samsara Telemetría Cruda (Unidad, Kilómetros)
            <textarea
              style={{ ...campo, height: 120, fontFamily: 'monospace', fontSize: 13 }}
              placeholder="Unidad,Kilometros&#10;WH101,340&#10;WH104,510"
              value={samsaraCSV}
              onChange={(e) => setSamsaraCSV(e.target.value)}
            />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
              📂 Suelta tu archivo CSV de Samsara aquí para cargarlo automáticamente
            </span>
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14, animation: 'fadeUp 0.42s ease' }}>
        <button
          onClick={parsearYCruzar}
          className="hv-naranja"
          style={{ padding: '12px 28px', background: 'var(--accent-gold)', color: 'var(--text-main)', border: 'none', borderRadius: 9, fontFamily: FD, fontSize: 17, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
        >
          Procesar y Conciliar
        </button>
      </div>

      {resultados.length > 0 && (
        <div style={{ ...card, padding: '14px 20px', overflowX: 'auto', marginTop: 18, animation: 'fadeUp 0.45s ease' }}>
          <h3 style={{ ...h3Titulo, marginBottom: 12 }}>Resultados de Eficiencia Cruzada</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 600 }}>
            <thead>
              <tr style={theadRow}>
                <th style={thCell}>Unidad</th>
                <th style={{ ...thCell, textAlign: 'right' }}>Litros Dispensados</th>
                <th style={{ ...thCell, textAlign: 'right' }}>Costo Total</th>
                <th style={{ ...thCell, textAlign: 'right' }}>Distancia Samsara (km)</th>
                <th style={{ ...thCell, textAlign: 'right' }}>Rendimiento Calculado (km/L)</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r, idx) => (
                <tr key={idx} className="hv-fila">
                  <td style={{ ...tdCell, fontFamily: FD, fontWeight: 700, fontSize: 16 }}>{r.unidad}</td>
                  <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.litros} L</td>
                  <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(r.costo)}</td>
                  <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{r.distancia} km</td>
                  <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: 700, color: r.rendimiento > 2 ? '#2C7A44' : '#C53030' }}>
                    {r.rendimiento} km/L
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Split external loads section */}
      <div style={{ ...card, padding: '14px 20px', overflowX: 'auto', marginTop: 24, animation: 'fadeUp 0.48s ease' }}>
        <h3 style={{ ...h3Titulo, marginBottom: 12 }}>Desglose de Tanques Externos / Cargas Compartidas</h3>
        <p style={{ margin: '0 0 16px', color: 'var(--text-muted)', fontSize: 14 }}>
          Selecciona una carga general realizada a un contenedor o tanque externo para fragmentarla y asignarla a unidades/cajas individuales.
        </p>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={theadRow}>
              <th style={thCell}>Fecha</th>
              <th style={{ ...thCell, textAlign: 'right' }}>Litros Totales</th>
              <th style={{ ...thCell, textAlign: 'right' }}>Costo</th>
              <th style={thCell}>Desglose Asignado</th>
              <th style={{ ...thCell, padding: '12px 10px', borderBottom: '2px solid rgba(197, 160, 89, 0.3)' }} />
            </tr>
          </thead>
          <tbody>
            {cargasExternas.map((c) => {
              const litrosAsignados = c.desglose.reduce((sum, item) => sum + item.litros, 0)
              return (
                <tr key={c.id} className="hv-fila">
                  <td style={tdCell}>{c.fecha}</td>
                  <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{c.litrosTotales} L</td>
                  <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(c.costoTotal)}</td>
                  <td style={tdCell}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {c.desglose.map((d, idx) => (
                        <span key={idx} style={badge('#E3ECF7', '#1B4E8C', '#9FC0E4')}>
                          {d.unidad}: {d.litros} L
                        </span>
                      ))}
                      {c.desglose.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sin desglose aún</span>}
                    </div>
                  </td>
                  <td style={{ ...tdCell, textAlign: 'right' }}>
                    <button
                      onClick={() => { setDesglosarCarga(c) }}
                      className="hv-op85"
                      style={{ padding: '6px 12px', background: 'transparent', border: '1px solid rgba(197, 160, 89, 0.4)', borderRadius: 7, fontSize: 12.5, fontWeight: 700, color: 'var(--accent-gold)', cursor: 'pointer' }}
                    >
                      Fragmentar Carga ({c.litrosTotales - litrosAsignados} L Libres)
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Modal Desglose ── */}
      {desglosarCarga && (
        <div
          onClick={() => setDesglosarCarga(null)}
          style={{ position: 'fixed', inset: 0, background: 'var(--bg-overlay)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: 14, maxWidth: 480, width: '100%', padding: 26, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', borderTop: '5px solid #C5A059' }}
          >
            <h3 style={{ fontFamily: FD, fontWeight: 700, fontSize: 22, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-main)', margin: '0 0 10px' }}>
              Fragmentar Contenedor Externo
            </h3>
            <p style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Tanque del día <strong style={{ color: 'var(--text-main)' }}>{desglosarCarga.fecha}</strong> · Litros totales: <strong style={{ color: 'var(--text-main)' }}>{desglosarCarga.litrosTotales} L</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                <label style={{ ...etiqueta, flex: 2 }}>
                  Unidad Destino
                  <select style={campo} value={nuevaUnidadDesglose} onChange={(e) => setNuevaUnidadDesglose(e.target.value)}>
                    <option value="">Selecciona unidad...</option>
                    {unidades.map(u => (
                      <option key={u.id} value={u.id_unidad}>{u.id_unidad} ({u.tipo})</option>
                    ))}
                  </select>
                </label>
                <label style={{ ...etiqueta, flex: 1 }}>
                  Litros
                  <input type="number" min={1} style={campo} placeholder="Ej. 30" value={nuevosLitrosDesglose} onChange={(e) => setNuevosLitrosDesglose(e.target.value)} />
                </label>
                <button
                  onClick={agregarDesglose}
                  className="hv-naranja"
                  style={{ padding: 12, background: 'var(--accent-gold)', border: 'none', borderRadius: 8, color: 'var(--text-main)', fontWeight: 700, cursor: 'pointer' }}
                >
                  Asignar
                </button>
              </div>

              <div style={{ borderTop: '1px solid #E7E0D2', paddingTop: 10, marginTop: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, display: 'block', marginBottom: 8 }}>
                  Desglose Registrado:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {desglosarCarga.desglose.map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-input)', padding: '6px 10px', borderRadius: 6, fontSize: 13 }}>
                      <span><strong>{d.unidad}</strong>: {d.litros} Litros</span>
                      <button onClick={() => limpiarDesglose(i)} style={{ background: 'transparent', border: 'none', color: '#C53030', cursor: 'pointer' }}>✕</button>
                    </div>
                  ))}
                  {desglosarCarga.desglose.length === 0 && (
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Asigna partes del tanque arriba.</span>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setDesglosarCarga(null)}
                className="hv-naranja"
                style={{ padding: '10px 20px', background: 'var(--accent-gold)', border: 'none', borderRadius: 8, fontFamily: FD, fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                Cerrar y Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
