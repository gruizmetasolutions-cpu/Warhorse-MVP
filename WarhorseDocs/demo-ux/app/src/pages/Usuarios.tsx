import { useCallback, useEffect, useState } from 'react'
import Avatar from '../components/Avatar'
import Badge from '../components/Badge'
import Boton from '../components/Boton'
import { CampoSelect, CampoTexto } from '../components/Campo'
import Modal from '../components/Modal'
import Panel from '../components/Panel'
import Tabla from '../components/Tabla'
import { useToast } from '../components/Toast'
import * as api from '../lib/api'
import type { Rol, Usuario } from '../lib/types'

const roles: { valor: Rol; texto: string }[] = [
  { valor: 'admin', texto: 'Dirección' },
  { valor: 'taller', texto: 'Taller' },
  { valor: 'compras', texto: 'Compras' },
  { valor: 'diesel', texto: 'Diésel' },
]

export default function Usuarios() {
  const { avisar } = useToast()
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [rolNuevo, setRolNuevo] = useState<Rol>('taller')
  const [errorModal, setErrorModal] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      setUsuarios(await api.getUsuarios())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los datos.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const cambiarRol = async (u: Usuario, rol: Rol) => {
    try {
      await api.actualizarUsuario(u.id, { rol })
      avisar(`${u.nombre}: rol actualizado a ${roles.find((r) => r.valor === rol)?.texto}`)
      void cargar()
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'No se pudo cambiar el rol.', 'error')
    }
  }

  const alternarActivo = async (u: Usuario) => {
    try {
      await api.actualizarUsuario(u.id, { activo: !u.activo })
      avisar(`${u.nombre}: ${u.activo ? 'suspendido' : 'reactivado'}`)
      void cargar()
    } catch (e) {
      avisar(e instanceof Error ? e.message : 'No se pudo actualizar.', 'error')
    }
  }

  const agregar = async () => {
    setGuardando(true)
    setErrorModal(null)
    try {
      await api.crearUsuario({ nombre, email, rol: rolNuevo })
      avisar(`${nombre}: usuario creado con contraseña temporal enviada por correo`)
      setModalAbierto(false)
      setNombre('')
      setEmail('')
      setRolNuevo('taller')
      void cargar()
    } catch (e) {
      setErrorModal(e instanceof Error ? e.message : 'No se pudo crear el usuario.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-[34px] font-bold uppercase leading-none">
          Usuarios y permisos
        </h1>
        <Boton onClick={() => setModalAbierto(true)}>+ Agregar usuario</Boton>
      </div>

      <Panel>
        <Tabla
          etiqueta="Usuarios del sistema"
          columnas={[
            {
              titulo: 'Usuario',
              render: (u) => (
                <span className="flex items-center gap-3">
                  <Avatar nombre={u.nombre} rol={u.rol} suspendido={!u.activo} />
                  <span>
                    <span className="block font-semibold">{u.nombre}</span>
                    <span className="block text-xs text-wh-muted">{u.email}</span>
                  </span>
                </span>
              ),
            },
            {
              titulo: 'Rol',
              render: (u) => (
                <select
                  aria-label={`Rol de ${u.nombre}`}
                  value={u.rol}
                  onChange={(e) => void cambiarRol(u, e.target.value as Rol)}
                  className="rounded-[9px] border border-wh-border bg-white px-3 py-2 text-sm focus:border-wh-orange focus:outline-none focus-visible:ring-4 focus-visible:ring-wh-orange-focus"
                >
                  {roles.map((r) => (
                    <option key={r.valor} value={r.valor}>
                      {r.texto}
                    </option>
                  ))}
                </select>
              ),
            },
            {
              titulo: 'Estado',
              render: (u) =>
                u.activo ? (
                  <Badge tipo="estadoUnidad" valor="Activo" />
                ) : (
                  <Badge tipo="neutral" valor="Suspendido" />
                ),
            },
            {
              titulo: 'Acción',
              render: (u) => (
                <Boton
                  variante="outline"
                  className="!px-3 !py-2 text-xs"
                  onClick={() => void alternarActivo(u)}
                >
                  {u.activo ? 'Suspender' : 'Reactivar'}
                </Boton>
              ),
            },
          ]}
          filas={usuarios}
          cargando={cargando}
          error={error}
          onReintentar={() => void cargar()}
          textoVacio="Sin usuarios en esta vista"
          claveFila={(u) => u.id}
        />
      </Panel>

      <Modal
        abierto={modalAbierto}
        titulo="Agregar usuario"
        onCerrar={() => setModalAbierto(false)}
        onConfirmar={() => void agregar()}
        textoConfirmar="Crear usuario"
        confirmando={guardando}
      >
        <div className="flex flex-col gap-4">
          <CampoTexto etiqueta="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <CampoTexto
            etiqueta="Correo"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <CampoSelect
            etiqueta="Rol"
            opciones={roles.map((r) => ({ valor: r.valor, texto: r.texto }))}
            value={rolNuevo}
            onChange={(e) => setRolNuevo(e.target.value as Rol)}
          />
          {errorModal && (
            <p className="text-sm font-semibold text-wh-orange-ink" role="alert">
              {errorModal}
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}
