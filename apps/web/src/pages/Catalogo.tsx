import { useState, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import Camion from '../components/Camion'
import Kicker from '../components/Kicker'
import { ApiError, actualizarUnidad, crearUnidad, type UnidadApi } from '../lib/api'
import { useDemo } from '../lib/demo'
import { badge, card, estadoUnidadColors, FD, filtroPill, fmt, h2Titulo, subTitulo, tdCell, thCell, theadRow } from '../lib/estilos'
import type { EstadoUnidad, TipoUnidad } from '../lib/types'

const filtros: ('Todos' | EstadoUnidad)[] = ['Todos', 'Activo', 'Yonke', 'Inactivo']

const campo: CSSProperties = { padding: 12, border: '1px solid #D8D2C4', borderRadius: 9, fontSize: 15, background: '#FAF7F0', width: '100%' }
const etiqueta: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, fontWeight: 600 }

interface Alta {
  id_unidad: string
  tipo: TipoUnidad
  estado: EstadoUnidad
  fecha_alta: string
  valor_referencia: string
}

const altaVacia: Alta = { id_unidad: '', tipo: 'Tractor', estado: 'Activo', fecha_alta: '', valor_referencia: '' }

export default function Catalogo() {
  const { sesion, unidades, recargarUnidades, toast } = useDemo()
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState<'Todos' | EstadoUnidad>('Todos')
  const [alta, setAlta] = useState<Alta | null>(null)
  const [editar, setEditar] = useState<{ unidad: UnidadApi; estado: EstadoUnidad; valor: string } | null>(null)
  const [error, setError] = useState('')
  const esAdmin = sesion?.rol === 'admin'

  const filas = unidades.filter((t) => filtro === 'Todos' || t.estado === filtro)
  const nYonke = unidades.filter((t) => t.estado === 'Yonke').length

  const guardarAlta = async () => {
    if (!alta) return
    setError('')
    try {
      await crearUnidad({
        id_unidad: alta.id_unidad.trim(),
        tipo: alta.tipo,
        estado: alta.estado,
        fecha_alta: alta.fecha_alta,
        valor_referencia: alta.valor_referencia === '' ? null : Number(alta.valor_referencia),
      })
      await recargarUnidades()
      toast(`${alta.id_unidad.trim()} dada de alta en la flota`)
      setAlta(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo guardar la unidad.')
    }
  }

  const guardarEdicion = async () => {
    if (!editar) return
    setError('')
    try {
      const cambio: { estado?: EstadoUnidad; valor_referencia?: number } = {}
      if (editar.estado !== editar.unidad.estado) cambio.estado = editar.estado
      if (editar.valor !== '' && Number(editar.valor) !== editar.unidad.valor_referencia) {
        cambio.valor_referencia = Number(editar.valor)
      }
      if (Object.keys(cambio).length > 0) {
        await actualizarUnidad(editar.unidad.id, cambio)
        await recargarUnidades()
        toast(`${editar.unidad.id_unidad} actualizada`)
      }
      setEditar(null)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo actualizar la unidad.')
    }
  }

  const modal = (titulo: string, contenido: ReactNode, onGuardar: () => void, onCerrar: () => void) => (
    <div
      onClick={onCerrar}
      style={{ position: 'fixed', inset: 0, background: 'rgba(20,24,29,0.55)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        style={{ background: '#fff', borderRadius: 14, maxWidth: 480, width: '100%', padding: 26, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', borderTop: '5px solid #F2620F', animation: 'fadeUp 0.2s ease' }}
      >
        <h3 style={{ fontFamily: FD, fontWeight: 700, fontSize: 22, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#16191E', margin: '0 0 14px' }}>
          {titulo}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{contenido}</div>
        {error && (
          <div role="alert" style={{ marginTop: 12, background: '#FBEBE8', border: '1px solid #E8A99D', color: '#9B2C2C', borderRadius: 9, padding: '12px 14px', fontSize: 14 }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button
            onClick={onCerrar}
            className="hv-crema"
            style={{ padding: '10px 18px', background: '#fff', border: '1px solid #D8D2C4', borderRadius: 8, fontSize: 14, fontWeight: 700, color: '#16191E', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={onGuardar}
            className="hv-naranja"
            style={{ padding: '10px 20px', background: '#F2620F', border: 'none', borderRadius: 8, fontFamily: FD, fontSize: 16, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', cursor: 'pointer' }}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', animation: 'fadeUp 0.35s ease' }}>
        <div>
          <Kicker texto="Flota" />
          <h2 style={h2Titulo}>Catálogo de Unidades</h2>
          <p style={subTitulo}>
            {nYonke + ' unidades Yonke disponibles como donantes ahora mismo · ' + unidades.length + ' unidades en total'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {filtros.map((f) => (
            <button key={f} onClick={() => setFiltro(f)} className="hv-borde-ink" style={filtroPill(filtro === f)}>
              {f}
            </button>
          ))}
          {esAdmin && (
            <button
              onClick={() => {
                setError('')
                setAlta({ ...altaVacia })
              }}
              className="hv-naranja"
              style={{ padding: '9px 18px', background: '#F2620F', color: '#fff', border: 'none', borderRadius: 8, fontFamily: FD, fontWeight: 700, fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              + Agregar unidad
            </button>
          )}
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
                  <td style={{ ...tdCell, fontFamily: FD, fontWeight: 700, fontSize: 17, color: '#16191E' }}>{t.id_unidad}</td>
                  <td style={tdCell}>{t.tipo}</td>
                  <td style={tdCell}>
                    <span style={badge(c[0], c[1], c[2])}>{t.estado}</span>
                  </td>
                  <td style={{ ...tdCell, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {t.costo_real_acumulado ? fmt(t.costo_real_acumulado) : '—'}
                  </td>
                  <td style={{ ...tdCell, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {esAdmin && (
                      <button
                        onClick={() => {
                          setError('')
                          setEditar({ unidad: t, estado: t.estado, valor: t.valor_referencia === null ? '' : String(t.valor_referencia) })
                        }}
                        className="hv-inkfill"
                        style={{ padding: '7px 12px', background: '#F3EFE7', border: '1px solid #D8D2C4', borderRadius: 7, fontSize: 12.5, fontWeight: 700, color: '#16191E', cursor: 'pointer', marginRight: 8 }}
                      >
                        Editar
                      </button>
                    )}
                    <button
                      onClick={() => navigate('/ficha/' + t.id_unidad)}
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

      {alta &&
        modal(
          'Agregar unidad',
          <>
            <label style={etiqueta}>
              ID de la unidad
              <input style={campo} value={alta.id_unidad} placeholder="Ej. WH130" onChange={(e) => setAlta({ ...alta, id_unidad: e.target.value })} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <label style={etiqueta}>
                Tipo
                <select style={campo} value={alta.tipo} onChange={(e) => setAlta({ ...alta, tipo: e.target.value as TipoUnidad })}>
                  <option>Tractor</option>
                  <option>Caja</option>
                  <option>Thermo</option>
                </select>
              </label>
              <label style={etiqueta}>
                Estado
                <select style={campo} value={alta.estado} onChange={(e) => setAlta({ ...alta, estado: e.target.value as EstadoUnidad })}>
                  <option>Activo</option>
                  <option>Yonke</option>
                  <option>Inactivo</option>
                </select>
              </label>
            </div>
            <label style={etiqueta}>
              Fecha de alta
              <input type="date" style={campo} value={alta.fecha_alta} onChange={(e) => setAlta({ ...alta, fecha_alta: e.target.value })} />
            </label>
            <label style={etiqueta}>
              Valor de referencia (MXN)
              <input type="number" min={0} placeholder="Opcional; sin él el veredicto queda pendiente" style={campo} value={alta.valor_referencia} onChange={(e) => setAlta({ ...alta, valor_referencia: e.target.value })} />
            </label>
          </>,
          () => void guardarAlta(),
          () => setAlta(null),
        )}

      {editar &&
        modal(
          'Editar ' + editar.unidad.id_unidad,
          <>
            <label style={etiqueta}>
              Estado
              <select style={campo} value={editar.estado} onChange={(e) => setEditar({ ...editar, estado: e.target.value as EstadoUnidad })}>
                <option>Activo</option>
                <option>Yonke</option>
                <option>Inactivo</option>
              </select>
            </label>
            <label style={etiqueta}>
              Valor de referencia (MXN)
              <input type="number" min={0} style={campo} value={editar.valor} onChange={(e) => setEditar({ ...editar, valor: e.target.value })} />
            </label>
          </>,
          () => void guardarEdicion(),
          () => setEditar(null),
        )}
    </>
  )
}
