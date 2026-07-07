import { useState } from 'react'
import Ayuda from '../components/Ayuda'
import Kicker from '../components/Kicker'
import { useDemo } from '../lib/demo'
import { badge, card, FD, h2Titulo, h3Titulo, subTitulo, tdCell, thCell, theadRow } from '../lib/estilos'
import type { Rol } from '../lib/types'

const rolNombres: Record<Rol, string> = { admin: 'Dirección (Admin)', taller: 'Taller', compras: 'Compras', diesel: 'Control de Diésel' }
const avatarColors: Record<Rol, string> = { admin: '#16191E', taller: '#F2620F', compras: '#3FA65C', diesel: '#8A6D1A' }
const roles = Object.keys(rolNombres) as Rol[]

const modulos = [
  { id: 'dashboard', label: 'Tablero Directivo', desc: 'KPIs, gráficas y decisión por tracto' },
  { id: 'requisicion', label: 'Requisiciones', desc: 'Solicitar refacciones desde taller' },
  { id: 'compras', label: 'Panel de Compras', desc: 'Ciclo Solicitado → Instalado' },
  { id: 'catalogo', label: 'Catálogo de Unidades', desc: 'Tractos, cajas y yonke' },
  { id: 'usuarios', label: 'Usuarios y Permisos', desc: 'Esta sección' },
]

export default function Usuarios() {
  const { usuarios, setUsuarios, permisos, setPermisos, toast } = useDemo()
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoRol, setNuevoRol] = useState<Rol>('taller')

  const agregarUsuario = () => {
    const nombre = nuevoNombre.trim()
    if (!nombre) return toast('Escribe el nombre del usuario.')
    setUsuarios([...usuarios, { id: 'u' + Date.now(), nombre, rol: nuevoRol, activo: true }])
    setNuevoNombre('')
    toast(nombre + ' agregado como ' + rolNombres[nuevoRol])
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
              style={{ padding: '9px 12px', border: '1px solid #D8D2C4', borderRadius: 8, fontSize: 14, background: '#FAF7F0', minWidth: 210 }}
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
              onClick={agregarUsuario}
              className="hv-naranja"
              style={{ padding: '9px 18px', background: '#F2620F', color: '#fff', border: 'none', borderRadius: 8, fontFamily: FD, fontWeight: 700, fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
            >
              + Agregar
            </button>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 620 }}>
            <thead>
              <tr style={theadRow}>
                <th style={{ ...thCell, padding: 10 }}>Usuario</th>
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
                  <td style={tdCell}>
                    <select
                      value={u.rol}
                      aria-label={'Rol de ' + u.nombre}
                      onChange={(e) => {
                        const rol = e.target.value as Rol
                        setUsuarios(usuarios.map((x) => (x.id === u.id ? { ...x, rol } : x)))
                        toast(u.nombre + ' ahora es ' + rolNombres[rol])
                      }}
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
                      onClick={() => {
                        setUsuarios(usuarios.map((x) => (x.id === u.id ? { ...x, activo: !x.activo } : x)))
                        toast(u.nombre + (u.activo ? ' suspendido' : ' reactivado'))
                      }}
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
          <Ayuda tip="Los permisos aplican por rol, no por persona: al cambiar el rol de un usuario, hereda estos accesos de inmediato." />
        </div>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: '#6F6A60' }}>
          Haz clic en una celda para activar o quitar el acceso de un rol a un módulo. Aplica de inmediato a
          todos los usuarios de ese rol.
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
                    const key = r + ':' + m.id
                    const on = !!permisos[key]
                    const bloqueado = r === 'admin' && m.id === 'usuarios'
                    return (
                      <td key={r} style={{ ...tdCell, textAlign: 'center' }}>
                        <button
                          title={bloqueado ? 'El Admin no puede perder acceso a Usuarios' : rolNombres[r] + ' · ' + m.label}
                          onClick={() => {
                            if (bloqueado) return toast('El Admin siempre conserva acceso a Usuarios.')
                            setPermisos({ ...permisos, [key]: !on })
                            toast(rolNombres[r] + (!on ? ' ahora tiene acceso a ' : ' ya no tiene acceso a ') + m.label)
                          }}
                          className="hv-op8"
                          style={{
                            width: 38, height: 38, borderRadius: 9, border: 'none',
                            cursor: bloqueado ? 'default' : 'pointer', fontSize: 16, fontWeight: 700,
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
