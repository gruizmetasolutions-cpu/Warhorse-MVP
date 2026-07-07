import { useState, type CSSProperties } from 'react'
import Ayuda from '../components/Ayuda'
import Kicker from '../components/Kicker'
import { ApiError, crearRequisicion } from '../lib/api'
import { useDemo } from '../lib/demo'
import { FD, fmt, h2Titulo, subTitulo, urgColors } from '../lib/estilos'
import type { Origen, Urgencia } from '../lib/types'

const etiqueta: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }
const ayudaCampo: CSSProperties = { fontSize: 12.5, fontWeight: 400, color: '#6F6A60' }

export default function Requisicion() {
  const { unidades, toast } = useDemo()
  const [destino, setDestino] = useState('')
  const [origen, setOrigen] = useState<Origen>('Compra')
  const [donante, setDonante] = useState('')
  const [pieza, setPieza] = useState('')
  const [costo, setCosto] = useState('')
  const [urgencia, setUrgencia] = useState<Urgencia>('Media')
  const [foto, setFoto] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Catálogo VIVO (RF-UNI-01): los selectores leen de la API, no del mock
  const destinoOpts = unidades.filter((t) => t.estado === 'Activo')
  const donanteOpts = unidades.filter((t) => t.estado === 'Yonke')
  const esYonke = origen === 'Yonke'

  const origBtn = (act: boolean, acento: 'o' | 'b'): CSSProperties => ({
    padding: '13px 10px', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer',
    background: act ? (acento === 'o' ? '#FDE8DC' : '#EAE6DC') : '#fff',
    color: act ? (acento === 'o' ? '#B4430A' : '#16191E') : '#6F6A60',
    border: act ? '2px solid ' + (acento === 'o' ? '#F2620F' : '#16191E') : '1px solid #D8D2C4',
  })

  const limpiarError = () => setError('')

  const enviar = async () => {
    // Validación inmediata en cliente (mensajes del demo); el backend
    // re-valida todo server-side (doc 04)
    if (!destino) return setError('Selecciona el tracto destino.')
    if (!pieza.trim()) return setError('Describe la pieza solicitada.')
    if (esYonke && !donante) return setError('El origen Yonke obliga a registrar la unidad donante.')
    if (!foto) return setError('La foto de la pieza o número de serie es obligatoria.')

    setEnviando(true)
    try {
      const creada = await crearRequisicion({
        unidad_destino_id: Number(destino),
        origen,
        unidad_donante_id: esYonke ? Number(donante) : null,
        descripcion_pieza: pieza.trim(),
        numero_parte: null,
        urgencia,
        costo_estimado_manual: costo === '' ? null : Number(costo),
        foto,
      })
      setDestino(''); setDonante(''); setPieza(''); setCosto(''); setUrgencia('Media'); setOrigen('Compra'); setFoto(null); setError('')
      const detalleCosto = creada.costo_estimado !== null
        ? ` Costo estimado: ${fmt(creada.costo_estimado)} (${creada.origen_costo_estimado}).`
        : ''
      toast('Requisición enviada — Compras la verá en su panel.' + detalleCosto)
    } catch (e) {
      if (e instanceof ApiError) {
        const campos = e.fields ? Object.values(e.fields).flat() : []
        setError(campos[0] ?? e.message)
      } else {
        setError('No se pudo enviar la requisición. Intenta de nuevo.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ maxWidth: 640, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18, animation: 'fadeUp 0.35s ease' }}>
      <div>
        <Kicker texto="Piso de taller" />
        <h2 style={h2Titulo}>Requisición de refacciones</h2>
        <p style={subTitulo}>Solicitud completa con foto y origen de la pieza, para que Compras no tenga que pedir más datos.</p>
      </div>
      <div data-tour="reqform" style={{ background: '#fff', border: '1px solid #E7E0D2', borderRadius: 14, padding: 26, boxShadow: '0 1px 2px rgba(20,24,29,0.05)', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <label style={etiqueta}>
          Tracto destino
          <select
            value={destino}
            onChange={(e) => { setDestino(e.target.value); limpiarError() }}
            style={{ padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0' }}
          >
            <option value="">Selecciona unidad…</option>
            {destinoOpts.map((t) => (
              <option key={t.id} value={String(t.id)}>{t.id_unidad + ' · ' + t.tipo}</option>
            ))}
          </select>
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Origen de la refacción</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button onClick={() => { setOrigen('Compra'); limpiarError() }} className="hv-borde-ink" style={origBtn(!esYonke, 'b')}>
              🛒 Solicitud de Compra
            </button>
            <button onClick={() => { setOrigen('Yonke'); limpiarError() }} className="hv-borde-naranja-solo" style={origBtn(esYonke, 'o')}>
              Canibalizado de Yonke
            </button>
          </div>
        </div>

        {esYonke && (
          <div style={{ background: '#FDF3EC', border: '1px dashed #F2620F', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={etiqueta}>
              Tracto donante (obligatorio)
              <select
                value={donante}
                onChange={(e) => { setDonante(e.target.value); limpiarError() }}
                style={{ padding: 12, border: '1px solid #F0C4A4', borderRadius: 9, fontSize: 15, background: '#fff' }}
              >
                <option value="">Selecciona unidad Yonke…</option>
                {donanteOpts.map((t) => (
                  <option key={t.id} value={String(t.id)}>{t.id_unidad + ' · Yonke donante'}</option>
                ))}
              </select>
              <span style={ayudaCampo}>Solo unidades con estado Yonke pueden donar piezas.</span>
            </label>
            <label style={etiqueta}>
              Costo estimado (MXN)
              <input
                type="number"
                value={costo}
                onChange={(e) => { setCosto(e.target.value); limpiarError() }}
                placeholder="0.00"
                min={0}
                style={{ padding: 12, border: '1px solid #F0C4A4', borderRadius: 9, fontSize: 15, background: '#fff' }}
              />
              <span style={ayudaCampo}>
                Si la pieza tiene histórico de compra o catálogo, el sistema calcula el estimado solo;
                si no, captúralo aquí — así el costo real del tracto no se pierde (ADR-002).
              </span>
            </label>
          </div>
        )}

        <label style={etiqueta}>
          Descripción de la pieza
          <input
            type="text"
            value={pieza}
            onChange={(e) => { setPieza(e.target.value); limpiarError() }}
            placeholder="Ej. Turbo, número de parte si se conoce"
            style={{ padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0' }}
          />
          <span style={ayudaCampo}>Entre más completa, menos idas y vueltas con Compras.</span>
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
            Foto de la pieza o número de serie <span style={{ color: '#F2620F' }}>*</span>
            <Ayuda tip="Obligatoria: evita compras a ciegas. Compras ve la pieza o su número de serie exacto antes de cotizar." />
          </span>
          <input
            id="foto-pieza"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e) => { setFoto(e.target.files?.[0] ?? null); limpiarError() }}
          />
          <label
            htmlFor="foto-pieza"
            className="hv-borde-naranja-solo"
            style={{
              border: '2px dashed ' + (foto ? '#3FA65C' : '#C9C2B2'),
              background: foto ? '#F0F7F1' : '#FAF7F0',
              borderRadius: 10, padding: 16, cursor: 'pointer', textAlign: 'left', width: '100%', display: 'block',
            }}
          >
            {foto ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 44, height: 44, borderRadius: 8, background: 'repeating-linear-gradient(45deg,#EFE7D8,#EFE7D8 6px,#F8F4EB 6px,#F8F4EB 12px)', border: '1px solid #D8D2C4', flex: 'none' }} />
                <span style={{ fontSize: 14, color: '#16191E', fontWeight: 600 }}>{foto.name} adjunta ✓</span>
              </span>
            ) : (
              <span style={{ fontSize: 14, color: '#6F6A60' }}>📷 Toca para adjuntar fotografía (obligatorio)</span>
            )}
          </label>
          <span style={{ fontSize: 12.5, color: '#6F6A60' }}>
            La foto evita compras a ciegas: Compras ve la pieza o su etiqueta de serie exacta.
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Urgencia</span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(['Rápida', 'Media', 'Crítica'] as const).map((u) => {
              const act = urgencia === u
              const c = urgColors[u]
              return (
                <button
                  key={u}
                  onClick={() => setUrgencia(u)}
                  className="hv-op85"
                  style={{
                    padding: '10px 20px', borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    background: act ? c[0] : '#fff', color: act ? c[1] : '#6F6A60',
                    border: act ? '2px solid ' + c[2] : '1px solid #D8D2C4',
                  }}
                >
                  {u}
                </button>
              )
            })}
          </div>
        </div>

        <button
          onClick={() => void enviar()}
          disabled={enviando}
          className="hv-naranja"
          style={{ padding: 15, background: '#F2620F', color: '#fff', border: 'none', borderRadius: 10, fontFamily: FD, fontWeight: 700, fontSize: 19, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 4px 12px rgba(242,98,15,0.3)' }}
        >
          {enviando ? 'Enviando…' : 'Enviar requisición'}
        </button>
        {error && (
          <div role="alert" style={{ background: '#FBEBE8', border: '1px solid #E8A99D', color: '#9B2C2C', borderRadius: 9, padding: '12px 14px', fontSize: 14 }}>
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
