import { useState, useEffect, type CSSProperties } from 'react'
import Ayuda from '../components/Ayuda'
import Kicker from '../components/Kicker'
import { ApiError, crearRequisicion, getArticulosAlmacen, getOrdenesTrabajo, type ArticuloAlmacenApi, type OrdenTrabajoApi } from '../lib/api'
import { useDemo } from '../lib/demo'
import { FD, fmt, h2Titulo, subTitulo, urgColors } from '../lib/estilos'
import type { Origen, Urgencia } from '../lib/types'

const etiqueta: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }
const ayudaCampo: CSSProperties = { fontSize: 12.5, fontWeight: 400, color: '#6F6A60' }

export default function Requisicion() {
  const { unidades, toast } = useDemo()
  const [destino, setDestino] = useState('')
  const [destinoInput, setDestinoInput] = useState('')
  const [origen, setOrigen] = useState<Origen>('Compra')
  const [donante, setDonante] = useState('')
  const [pieza, setPieza] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [costo, setCosto] = useState('')
  const [urgencia, setUrgencia] = useState<Urgencia>('Medio')
  const [numeroParte, setNumeroParte] = useState('')
  const [fotos, setFotos] = useState<File[]>([])
  const [paraInventario, setParaInventario] = useState(false)
  const [origenRefaccion, setOrigenRefaccion] = useState('')
  const [almacen, setAlmacen] = useState('')
  const [numeroSerie, setNumeroSerie] = useState('')
  const [ordenTrabajoId, setOrdenTrabajoId] = useState('')
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<OrdenTrabajoApi[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [articulos, setArticulos] = useState<ArticuloAlmacenApi[]>([])
  const [selArticuloId, setSelArticuloId] = useState('')

  useEffect(() => {
    getArticulosAlmacen().then(setArticulos).catch(() => {})
    getOrdenesTrabajo().then(setOrdenesTrabajo).catch(() => {})
  }, [])

  // CatÃ¡logo VIVO (RF-UNI-01): los selectores leen de la API, no del mock
  const destinoOpts = unidades.filter((t) => t.estado === 'Activo')
  const donanteOpts = unidades.filter((t) => t.estado === 'Yonke')
  const esYonke = origen === 'Yonke'

  const limpiarError = () => setError('')

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files)
      if (fotos.length + files.length > 3) {
        setError('La carga de evidencias estÃ¡ limitada a un mÃ¡ximo de 3 fotografÃ­as.')
        return
      }
      setFotos((prev) => [...prev, ...files])
      limpiarError()
    }
  }

  const enviar = async () => {
    const esInventario = origen === 'Inventario'
    if (!paraInventario && !destino) return setError('Selecciona el tracto destino.')
    
    let descripcionPieza = pieza.trim()
    let sku = numeroParte.trim() || null
    let piezaCatId: number | null = null

    if (esInventario) {
      if (!selArticuloId) return setError('Selecciona el artÃ­culo del inventario.')
      const art = articulos.find(a => String(a.id) === selArticuloId)
      if (!art) return setError('ArtÃ­culo de catÃ¡logo invÃ¡lido.')
      if (art.stock_actual <= 0) return setError('No hay stock disponible en almacÃ©n para este artÃ­culo.')
      descripcionPieza = art.nombre_normalizado
      sku = art.numero_parte
      piezaCatId = art.id
    } else {
      if (!descripcionPieza) return setError('Describe la pieza solicitada.')
      if (descripcionPieza.length > 350) return setError('La descripciÃ³n de la pieza no puede exceder los 350 caracteres.')
      if (esYonke && !donante) return setError('El origen Yonke obliga a registrar la unidad donante.')
      
      // WH-004: part number is mandatory for Tractors/Service but optional for Cajas/Termos
      
    }
    
    if (fotos.length === 0) return setError('La foto de la pieza o etiqueta del VIN es obligatoria.')
    if (fotos.length > 3) return setError('La carga de evidencias estÃ¡ limitada a un mÃ¡ximo de 3 fotografÃ­as.')

    setEnviando(true)
    try {
      const creada = await crearRequisicion({
        unidad_destino_id: paraInventario ? null : Number(destino),
        origen,
        unidad_donante_id: esYonke ? Number(donante) : null,
        pieza_catalogo_id: piezaCatId,
        descripcion_pieza: descripcionPieza,
        cantidad: cantidad === '' ? 1 : Number(cantidad),
        numero_parte: sku,
        urgencia,
        costo_estimado_manual: costo === '' ? null : Number(costo),
        fotos,
        origen_refaccion: origenRefaccion.trim() || undefined,
        almacen: almacen.trim() || undefined,
        numero_serie: numeroSerie.trim() || undefined,
        orden_trabajo_id: ordenTrabajoId === '' ? null : Number(ordenTrabajoId),
      })
      setDestino(''); setDestinoInput(''); setDonante(''); setPieza(''); setCantidad('1'); setCosto(''); setUrgencia('Medio'); setNumeroParte(''); setOrigen('Compra'); setFotos([]); setError(''); setOrigenRefaccion(''); setAlmacen(''); setNumeroSerie(''); setParaInventario(false); setSelArticuloId(''); setOrdenTrabajoId('')
      const detalleCosto = creada.costo_estimado !== null
        ? ` Costo estimado: ${fmt(creada.costo_estimado)} (${creada.origen_costo_estimado}).`
        : ''
      toast('RequisiciÃ³n enviada â€” Compras la verÃ¡ en su panel.' + detalleCosto)
    } catch (e) {
      if (e instanceof ApiError) {
        const campos = e.fields ? Object.values(e.fields).flat() : []
        setError(campos[0] ?? e.message)
      } else {
        setError('No se pudo enviar la requisiciÃ³n. Intenta de nuevo.')
      }
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div style={{ maxWidth: 640, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18, animation: 'fadeUp 0.35s ease' }}>
      <div>
        <Kicker texto="Piso de taller" />
        <h2 style={h2Titulo}>RequisiciÃ³n de refacciones</h2>
        <p style={subTitulo}>Solicitud completa con foto y origen de la pieza, para que Compras no tenga que pedir mÃ¡s datos.</p>
      </div>
      <div data-tour="reqform" style={{ background: '#fff', border: '1px solid #E7E0D2', borderRadius: 14, padding: 26, boxShadow: '0 1px 2px rgba(20,24,29,0.05)', display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Nullable Destination trigger */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none', fontSize: 14, fontWeight: 700, color: '#16191E' }}>
          <input
            type="checkbox"
            checked={paraInventario}
            onChange={(e) => {
              setParaInventario(e.target.checked)
              if (e.target.checked) setDestino('')
              limpiarError()
            }}
            style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#F2620F' }}
          />
          ðŸ“¦ Agregar directamente al inventario general del almacÃ©n
        </label>

          {!paraInventario && (
            <label style={etiqueta}>
              Tracto destino
              <input
                list="tractos-list"
                placeholder="Escribe VIN o ID para buscar..."
                value={destinoInput}
                onChange={(e) => {
                  setDestinoInput(e.target.value)
                  const matched = destinoOpts.find(t => t.vin === e.target.value || t.id_unidad === e.target.value || ((t.vin || t.id_unidad) + ' — ' + (t.tipo === 'Servicio' ? 'UTILITARIO' : t.tipo)) === e.target.value)
                  if (matched) setDestino(String(matched.id))
                  else setDestino('')
                  limpiarError()
                }}
                style={{ padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0', width: '100%', boxSizing: 'border-box' }}
              />
              <datalist id="tractos-list">
                {destinoOpts.map((t) => (
                  <option key={t.id} value={(t.vin || t.id_unidad) + ' — ' + (t.tipo === 'Servicio' ? 'UTILITARIO' : t.tipo)} />
                ))}
              </datalist>
            </label>
          )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <label style={etiqueta}>
            Tipo de Origen
            <span style={ayudaCampo}>Â¿CÃ³mo se resolverÃ¡ esta requisiciÃ³n?</span>
            <select
              value={origen}
              onChange={(e) => {
                setOrigen(e.target.value as Origen)
                setError('')
              }}
              style={{ padding: '10px', border: '1px solid #D8D2C4', borderRadius: 8, fontSize: 14 }}
            >
              <option value="Compra">Compra Nueva</option>
              <option value="Inventario">Tomar de Inventario (Stock)</option>
              <option value="Yonke">Extraer de Yonke</option>
            </select>
          </label>
          <label style={etiqueta}>
            Orden de Trabajo (Folio de Taller)
            <span style={ayudaCampo}>Si la requisiciÃ³n pertenece a una orden activa de taller</span>
            <select
              value={ordenTrabajoId}
              onChange={(e) => setOrdenTrabajoId(e.target.value)}
              style={{ padding: '10px', border: '1px solid #D8D2C4', borderRadius: 8, fontSize: 14 }}
            >
              <option value="">-- Opcional --</option>
              {ordenesTrabajo.filter(ot => ot.estado === 'Activa').map((ot) => (
                <option key={ot.id} value={ot.id}>
                  {ot.folio} - {(ot.unidad?.id_unidad || `Unidad ${ot.unidad?.id || '?'}`)} ({ot.diagnostico})
                </option>
              ))}
            </select>
          </label>
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
                <option value="">Selecciona unidad Yonkeâ€¦</option>
                {donanteOpts.map((t) => (
                  <option key={t.id} value={String(t.id)}>{(t.vin || t.id_unidad) + ' Â· Yonke donante'}</option>
                ))}
              </select>
              <span style={ayudaCampo}>Solo unidades con estado Yonke pueden donar piezas.</span>
            </label>
            <label style={etiqueta}>
              Costo estimado o Valor de mercado (MXN)
              <input
                type="number"
                value={costo}
                onChange={(e) => { setCosto(e.target.value); limpiarError() }}
                placeholder="0.00"
                min={0}
                style={{ padding: 12, border: '1px solid #F0C4A4', borderRadius: 9, fontSize: 15, background: '#fff' }}
              />
              <span style={ayudaCampo}>
                Registra el costo referencial o valor comercial estimado de esta pieza.
              </span>
            </label>
          </div>
        )}

        

        {origen === 'Inventario' ? (
          <label style={etiqueta}>
            VIN (Identificador Ãšnico)
            <input
              type="text"
              value={numeroSerie}
              onChange={(e) => { setNumeroSerie(e.target.value); limpiarError() }}
              placeholder="Ej. SN-98234-XYZ"
              style={{ padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0' }}
            />
          </label>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label style={etiqueta}>
                VIN (Identificador Ãšnico)
                <input
                  type="text"
                  value={numeroSerie}
                  onChange={(e) => { setNumeroSerie(e.target.value); limpiarError() }}
                  placeholder="Ej. SN-98234-XYZ"
                  style={{ padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0' }}
                />
              </label>
                <label style={etiqueta}>
                  Número de Parte / SKU (Opcional)
                  <input
                    type="text"
                    value={numeroParte}
                    onChange={(e) => { setNumeroParte(e.target.value); limpiarError() }}
                    placeholder="Opcional"
                    style={{ padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0' }}
                  />
                </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 14 }}>
              <label style={etiqueta}>
                DescripciÃ³n de la pieza
                <input
                  type="text"
                  value={pieza}
                  maxLength={350}
                  onChange={(e) => { setPieza(e.target.value); limpiarError() }}
                  placeholder="Ej. Turbo, nÃºmero de parte si se conoce (mÃ¡x. 350 caracteres)"
                  style={{ padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0' }}
                />
                <span style={{ ...ayudaCampo, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Entre mÃ¡s completa, menos idas y vueltas con Compras.</span>
                  <span>{pieza.length} / 350</span>
                </span>
              </label>

              <label style={etiqueta}>
                Cantidad
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  style={{ padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0', textAlign: 'center' }}
                />
              </label>
            </div>
          </>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
            Evidencias FotogrÃ¡ficas <span style={{ color: '#F2620F' }}>*</span>
            <Ayuda tip="Obligatoria: hasta un mÃ¡ximo de 3 fotografÃ­as de la pieza o su VIN." />
          </span>
          <input
            id="foto-pieza"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? [])
              if (fotos.length + files.length > 3) {
                setError('La carga de evidencias estÃ¡ limitada a un mÃ¡ximo de 3 fotografÃ­as.')
                return
              }
              setFotos((prev) => [...prev, ...files])
              limpiarError()
            }}
          />
          <label
            htmlFor="foto-pieza"
            className="hv-borde-naranja-solo"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: '2px dashed ' + (fotos.length > 0 ? '#3FA65C' : (dragOver ? '#F2620F' : '#C9C2B2')),
              background: fotos.length > 0 ? '#F0F7F1' : (dragOver ? '#FDF3EC' : '#FAF7F0'),
              borderRadius: 10, padding: 24, cursor: 'pointer', textAlign: 'center', width: '100%', display: 'block',
              transition: 'all 0.25s ease'
            }}
          >
            {fotos.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {fotos.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: '#fff', border: '1px solid #D8D2C4', borderRadius: 8, padding: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={URL.createObjectURL(f)} alt="preview" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', border: '1px solid #D8D2C4' }} />
                      <span style={{ fontSize: 13.5, color: '#16191E', fontWeight: 600 }}>{f.name} ({Math.round(f.size/1024)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setFotos((prev) => prev.filter((_, idx) => idx !== i))
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#C53030', fontWeight: 700, cursor: 'pointer', padding: '4px 8px' }}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
                {fotos.length < 3 && <span style={{ fontSize: 12.5, color: '#6F6A60', fontWeight: 600, marginTop: 4 }}>+ Agregar otra fotografÃ­a (mÃ¡x. 3)</span>}
              </div>
            ) : (
              <span style={{ fontSize: 14, color: '#6F6A60', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span>ðŸ“· Toca para adjuntar fotografÃ­a (mÃ¡x. 3)</span>
                <span style={{ fontSize: 12, opacity: 0.8 }}>o arrastra y suelta tu archivo aquÃ­ (Drag and Drop)</span>
              </span>
            )}
          </label>
          <span style={{ fontSize: 12.5, color: '#6F6A60' }}>
            La foto evita compras a ciegas: Compras ve la pieza o su etiqueta o VIN exacto.
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Urgencia</span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {(['Bajo', 'Medio', 'Crítico', 'Inmediato'] as const).map((u) => {
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
          {enviando ? 'Enviandoâ€¦' : 'Enviar requisiciÃ³n'}
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
