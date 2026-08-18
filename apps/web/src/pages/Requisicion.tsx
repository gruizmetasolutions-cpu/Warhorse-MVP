import { useState, useEffect, type CSSProperties } from 'react'
import Ayuda from '../components/Ayuda'
import Kicker from '../components/Kicker'
import { ApiError, crearRequisicion, getArticulosAlmacen, type ArticuloAlmacenApi } from '../lib/api'
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
  const [urgencia, setUrgencia] = useState<Urgencia>('Medio')
  const [numeroParte, setNumeroParte] = useState('')
  const [fotos, setFotos] = useState<File[]>([])
  const [paraInventario, setParaInventario] = useState(false)
  const [origenRefaccion, setOrigenRefaccion] = useState('')
  const [almacen, setAlmacen] = useState('')
  const [numeroSerie, setNumeroSerie] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [articulos, setArticulos] = useState<ArticuloAlmacenApi[]>([])
  const [selArticuloId, setSelArticuloId] = useState('')

  useEffect(() => {
    void getArticulosAlmacen().then(setArticulos)
  }, [])

  // Catálogo VIVO (RF-UNI-01): los selectores leen de la API, no del mock
  const destinoOpts = unidades.filter((t) => t.estado === 'Activo')
  const donanteOpts = unidades.filter((t) => t.estado === 'Yonke')
  const esYonke = origen === 'Yonke'

  const unidadSeleccionada = unidades.find((u) => String(u.id) === destino)
  const esCajaOThermo = unidadSeleccionada?.tipo === 'Caja' || unidadSeleccionada?.tipo === 'Thermo'

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
        setError('La carga de evidencias está limitada a un máximo de 3 fotografías.')
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
      if (!selArticuloId) return setError('Selecciona el artículo del inventario.')
      const art = articulos.find(a => String(a.id) === selArticuloId)
      if (!art) return setError('Artículo de catálogo inválido.')
      if (art.stock_actual <= 0) return setError('No hay stock disponible en almacén para este artículo.')
      descripcionPieza = art.nombre_normalizado
      sku = art.numero_parte
      piezaCatId = art.id
    } else {
      if (!descripcionPieza) return setError('Describe la pieza solicitada.')
      if (descripcionPieza.length > 350) return setError('La descripción de la pieza no puede exceder los 350 caracteres.')
      if (esYonke && !donante) return setError('El origen Yonke obliga a registrar la unidad donante.')
      
      // WH-004: part number is mandatory for Tractors/Service but optional for Cajas/Termos
      if (!paraInventario && !esCajaOThermo && !sku) {
        return setError('El Número de Parte / SKU es obligatorio para tractores o unidades de servicio.')
      }
    }
    
    if (fotos.length === 0) return setError('La foto de la pieza o número de serie es obligatoria.')
    if (fotos.length > 3) return setError('La carga de evidencias está limitada a un máximo de 3 fotografías.')

    setEnviando(true)
    try {
      const creada = await crearRequisicion({
        unidad_destino_id: paraInventario ? null : Number(destino),
        origen,
        unidad_donante_id: esYonke ? Number(donante) : null,
        pieza_catalogo_id: piezaCatId,
        descripcion_pieza: descripcionPieza,
        numero_parte: sku,
        urgencia,
        costo_estimado_manual: costo === '' ? null : Number(costo),
        fotos,
        origen_refaccion: origenRefaccion.trim() || undefined,
        almacen: almacen.trim() || undefined,
        numero_serie: numeroSerie.trim() || undefined,
      })
      setDestino(''); setDonante(''); setPieza(''); setCosto(''); setUrgencia('Medio'); setNumeroParte(''); setOrigen('Compra'); setFotos([]); setError(''); setOrigenRefaccion(''); setAlmacen(''); setNumeroSerie(''); setParaInventario(false); setSelArticuloId('')
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
          📦 Agregar directamente al inventario general del almacén
        </label>

        {!paraInventario && (
          <label style={etiqueta}>
            Tracto destino
            <select
              value={destino}
              onChange={(e) => { setDestino(e.target.value); limpiarError() }}
              style={{ padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0' }}
            >
              <option value="">Selecciona unidad…</option>
              {destinoOpts.map((t) => (
                <option key={t.id} value={String(t.id)}>{t.id_unidad + ' · ' + (t.tipo === 'Servicio' ? 'Camioneta de servicio' : t.tipo)}</option>
              ))}
            </select>
          </label>
        )}

        

        

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
            Número de Serie (VIN / ID Caja)
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
                Número de Serie (VIN / ID Caja)
                <input
                  type="text"
                  value={numeroSerie}
                  onChange={(e) => { setNumeroSerie(e.target.value); limpiarError() }}
                  placeholder="Ej. SN-98234-XYZ"
                  style={{ padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0' }}
                />
              </label>
              <label style={etiqueta}>
                Número de Parte / SKU {!paraInventario && !esCajaOThermo && <span style={{ color: '#F2620F' }}>*</span>}
                <input
                  type="text"
                  value={numeroParte}
                  onChange={(e) => { setNumeroParte(e.target.value); limpiarError() }}
                  placeholder={esCajaOThermo ? "Opcional para Cajas/Termos" : "Obligatorio"}
                  style={{ padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0' }}
                />
              </label>
            </div>

            <label style={etiqueta}>
              Descripción de la pieza
              <input
                type="text"
                value={pieza}
                maxLength={350}
                onChange={(e) => { setPieza(e.target.value); limpiarError() }}
                placeholder="Ej. Turbo, número de parte si se conoce (máx. 350 caracteres)"
                style={{ padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0' }}
              />
              <span style={{ ...ayudaCampo, display: 'flex', justifyContent: 'space-between' }}>
                <span>Entre más completa, menos idas y vueltas con Compras.</span>
                <span>{pieza.length} / 350</span>
              </span>
            </label>
          </>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600 }}>
            Evidencias Fotográficas <span style={{ color: '#F2620F' }}>*</span>
            <Ayuda tip="Obligatoria: hasta un máximo de 3 fotografías de la pieza o su número de serie." />
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
                setError('La carga de evidencias está limitada a un máximo de 3 fotografías.')
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
                      <span style={{ width: 34, height: 34, borderRadius: 6, background: 'repeating-linear-gradient(45deg,#EFE7D8,#EFE7D8 6px,#F8F4EB 6px,#F8F4EB 12px)', border: '1px solid #D8D2C4' }} />
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
                {fotos.length < 3 && <span style={{ fontSize: 12.5, color: '#6F6A60', fontWeight: 600, marginTop: 4 }}>+ Agregar otra fotografía (máx. 3)</span>}
              </div>
            ) : (
              <span style={{ fontSize: 14, color: '#6F6A60', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span>📷 Toca para adjuntar fotografía (máx. 3)</span>
                <span style={{ fontSize: 12, opacity: 0.8 }}>o arrastra y suelta tu archivo aquí (Drag and Drop)</span>
              </span>
            )}
          </label>
          <span style={{ fontSize: 12.5, color: '#6F6A60' }}>
            La foto evita compras a ciegas: Compras ve la pieza o su etiqueta de serie exacta.
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
