import { useCallback, useEffect, useState } from 'react'
import Ayuda from '../components/Ayuda'
import Kicker from '../components/Kicker'
import { actualizarUsuario, ApiError, crearUsuario, getUsuarios, type UsuarioAdminApi } from '../lib/api'
import { useDemo } from '../lib/demo'
import { badge, card, FD, h2Titulo, h3Titulo, subTitulo, tdCell, thCell, theadRow } from '../lib/estilos'
import type { Rol } from '../lib/types'

const rolNombres: Record<Rol, string> = { admin: 'Dirección (Admin)', taller: 'Taller', compras: 'Compras', diesel: 'Control de Diésel' }
const avatarColors: Record<Rol, string> = { admin: '#16191E', taller: '#F2620F', compras: '#3FA65C', diesel: '#8A6D1A' }
const roles = Object.keys(rolNombres) as Rol[]

const modulos = [
  { id: 'dashboard', label: 'Tablero Directivo', desc: 'KPIs, gráficas y decisión por tracto' },
  { id: 'requisicion', label: 'Requisiciones', desc: 'Solicitar refacciones desde taller' },
  { id: 'taller', label: 'Control de Taller', desc: 'Ingresos y liberaciones' },
  { id: 'compras', label: 'Panel de Compras', desc: 'Ciclo Solicitado → Instalado' },
  { id: 'diesel', label: 'Control de Diésel', desc: 'Cargas de combustible' },
  { id: 'catalogo', label: 'Catálogo de Unidades', desc: 'Tractos, cajas y yonke' },
  { id: 'usuarios', label: 'Usuarios y Permisos', desc: 'Esta sección' },
]

// Espejo de App\Libraries\Permisos del backend (RF-USR-03): la matriz es fija
// por rol; aquí solo se visualiza y el backend la re-verifica en cada acción.
const matriz: Record<Rol, string[]> = {
  admin: ['dashboard', 'requisicion', 'taller', 'compras', 'diesel', 'catalogo', 'usuarios'],
  taller: ['requisicion', 'taller', 'catalogo'],
  compras: ['compras', 'catalogo'],
  diesel: ['diesel', 'catalogo'],
}

export default function Usuarios() {
  const { toast } = useDemo()
  const [usuarios, setUsuarios] = useState<UsuarioAdminApi[]>([])
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [nuevoRol, setNuevoRol] = useState<Rol>('taller')

  const cargar = useCallback(async () => {
    setUsuarios(await getUsuarios())
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const mensajeError = (e: unknown, respaldo: string) => {
    if (e instanceof ApiError) {
      const campos = e.fields ? Object.values(e.fields).flat() : []
      return campos[0] ?? e.message
    }
    return respaldo
  }

  const agregarUsuario = async () => {
    const nombre = nuevoNombre.trim()
    const email = nuevoEmail.trim().toLowerCase()
    if (!nombre) return toast('Escribe el nombre del usuario.')
    if (!email) return toast('Escribe el correo del usuario.')
    try {
      const creado = await crearUsuario({ nombre, email, rol: nuevoRol })
      setNuevoNombre('')
      setNuevoEmail('')
      toast(creado.nombre + ' agregado como ' + rolNombres[creado.rol] + ' — credenciales enviadas por correo.')
      await cargar()
    } catch (e) {
      toast(mensajeError(e, 'No se pudo dar de alta al usuario.'))
    }
  }

  const cambiarRol = async (u: UsuarioAdminApi, rol: Rol) => {
    try {
      await actualizarUsuario(u.id, { rol })
      toast(u.nombre + ' ahora es ' + rolNombres[rol])
      await cargar()
    } catch (e) {
      toast(mensajeError(e, 'No se pudo cambiar el rol.'))
    }
  }

  const alternarActivo = async (u: UsuarioAdminApi) => {
    try {
      await actualizarUsuario(u.id, { activo: !u.activo })
      toast(u.nombre + (u.activo ? ' suspendido — pierde acceso de inmediato.' : ' reactivado'))
      await cargar()
    } catch (e) {
      toast(mensajeError(e, 'No se pudo cambiar el acceso.'))
    }
  }

  return (
    <>
      <div style={{ animation: 'fadeUp 0.35s ease' }}>
        <Kicker texto="Administración" />
        <h2 style={h2Titulo}>Usuarios y Permisos</h2>
        <p style={subTitulo}>Administra quién entra al Hub y qué módulos puede usar cada rol.</p>
      </div>

      <div data-tour="usuarios" style={{ ...card, animation: 'fadeUp 0.4s ease' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginBottom: 10 }}>
          <h3 style={h3Titulo}>Usuarios</h3>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder="Nombre del nuevo usuario"
              style={{ padding: '9px 12px', border: '1px solid #D8D2C4', borderRadius: 8, fontSize: 14, background: '#FAF7F0', minWidth: 190 }}
            />
            <input
              type="email"
              value={nuevoEmail}
              onChange={(e) => setNuevoEmail(e.target.value)}
              placeholder="Correo del nuevo usuario"
              style={{ padding: '9px 12px', border: '1px solid #D8D2C4', borderRadius: 8, fontSize: 14, background: '#FAF7F0', minWidth: 190 }}
            />
            <select
              value={nuevoRol}
              onChange={(e) => setNuevoRol(e.target.value as Rol)}
              aria-label="Rol del nuevo usuario"
              style={{ padding: '9px 12px', border: '1px solid #D8D2C4', borderRadius: 8, fontSize: 14, background: '#FAF7F0' }}
            >
              {roles.map((r) => (
                <option key={r} value={r}>{rolNombres[r]}</option>
              ))}
            </select>
            <button
              onClick={() => void agregarUsuario()}
              className="hv-naranja"
              style={{ padding: '9px 18px', background: '#F2620F', color: '#fff', border: 'none', borderRadius: 8, fontFamily: FD, fontWeight: 700, fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              + Agregar
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 680 }}>
            <thead>
              <tr style={theadRow}>
                <th style={{ ...thCell, padding: 10 }}>Usuario</th>
                <th style={{ ...thCell, padding: 10 }}>Correo</th>
                <th style={{ ...thCell, padding: 10 }}>Rol</th>
                <th style={{ ...thCell, padding: 10 }}>Estado</th>
                <th style={{ ...thCell, padding: 10 }}>Acceso</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="hv-fila">
                  <td style={tdCell}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span
                        style={{
                          width: 34, height: 34, borderRadius: '50%', background: avatarColors[u.rol],
                          color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12.5, fontWeight: 700, flex: 'none', opacity: u.activo ? 1 : 0.45,
                        }}
                      >
                        {u.nombre.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                      </span>
                      <span style={{ fontWeight: 700 }}>{u.nombre}</span>
                    </div>
                  </td>
                  <td style={{ ...tdCell, color: '#6F6A60', whiteSpace: 'nowrap' }}>{u.email}</td>
                  <td style={tdCell}>
                    <select
                      value={u.rol}
                      aria-label={'Rol de ' + u.nombre}
                      onChange={(e) => void cambiarRol(u, e.target.value as Rol)}
                      style={{ padding: '8px 10px', border: '1px solid #D8D2C4', borderRadius: 7, fontSize: 13.5, background: '#FAF7F0' }}
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>{rolNombres[r]}</option>
                      ))}
                    </select>
                  </td>
                  <td style={tdCell}>
                    <span style={u.activo ? badge('#E5F3E9', '#2C7A44', '#9FD4B0') : badge('#EAE6DC', '#4A4438', '#C9C2B2')}>
                      {u.activo ? 'Activo' : 'Suspendido'}
                    </span>
                  </td>
                  <td style={tdCell}>
                    <button
                      onClick={() => void alternarActivo(u)}
                      className="hv-op85"
                      style={{
                        padding: '7px 12px', borderRadius: 7, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                        background: u.activo ? '#fff' : '#E5F3E9',
                        color: u.activo ? '#9B2C2C' : '#2C7A44',
                        border: u.activo ? '1px solid #E8A99D' : '1px solid #9FD4B0',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {u.activo ? 'Suspender' : 'Reactivar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ ...card, animation: 'fadeUp 0.45s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 4px' }}>
          <h3 style={h3Titulo}>Permisos por rol</h3>
          <Ayuda tip="Los permisos aplican por rol, no por persona: al cambiar el rol de un usuario, hereda estos accesos de inmediato. La matriz es fija; el backend la re-verifica en cada acción." />
        </div>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#6F6A60' }}>
          Matriz de solo lectura (RF-USR-03): qué módulos ve cada rol. Para cambiar los accesos de una
          persona, cámbiale el rol arriba.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 560 }}>
            <thead>
              <tr style={theadRow}>
                <th style={{ ...thCell, padding: 10 }}>Módulo</th>
                {roles.map((r) => (
                  <th key={r} style={{ ...thCell, padding: 10, textAlign: 'center' }}>{rolNombres[r]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modulos.map((m) => (
                <tr key={m.id} className="hv-fila">
                  <td style={{ ...tdCell, fontWeight: 600 }}>
                    {m.label}
                    <div style={{ fontWeight: 400, fontSize: 12.5, color: '#6F6A60' }}>{m.desc}</div>
                  </td>
                  {roles.map((r) => {
                    const on = matriz[r].includes(m.id)
                    const bloqueado = r === 'admin' && m.id === 'usuarios'
                    return (
                      <td key={r} style={{ ...tdCell, textAlign: 'center' }}>
                        <button
                          title={bloqueado ? 'El Admin no puede perder acceso a Usuarios' : rolNombres[r] + ' · ' + m.label}
                          onClick={() =>
                            toast(
                              bloqueado
                                ? 'El Admin siempre conserva acceso a Usuarios.'
                                : 'La matriz de permisos es fija por rol (RF-USR-03); el backend la aplica en cada acción.',
                            )
                          }
                          className="hv-op8"
                          style={{
                            width: 38, height: 38, borderRadius: 9, border: 'none',
                            cursor: 'default', fontSize: 16, fontWeight: 700,
                            background: on ? '#E5F3E9' : '#F1EDE3',
                            color: on ? '#2C7A44' : '#A79F8E',
                            outline: on ? '1px solid #9FD4B0' : '1px solid #E7E0D2',
                          }}
                        >
                          {on ? '✓' : '—'}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
