// Contrato de datos del SPA (doc 05). Auth es REAL desde el Sprint 1; el
// resto de los datos sigue en lib/mock/ y se sustituye sprint a sprint
// (Demo-First, ADR-003). Las vistas importan SOLO este módulo.
import type { DatosDemo, Rol } from './types'
import * as mock from './mock'

const BASE = '/api/v1'

// El token de acceso vive en memoria del SPA (doc 04 §3.5), nunca en localStorage.
let tokenActual: string | null = null

export class ApiError extends Error {
  constructor(
    public status: number,
    public codigo: string,
    message: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function pedir<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opciones.headers as Record<string, string> | undefined),
  }
  if (tokenActual) headers.Authorization = `Bearer ${tokenActual}`

  const respuesta = await fetch(BASE + ruta, { ...opciones, headers })

  if (respuesta.status === 204) return undefined as T

  const cuerpo: unknown = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    const err = (cuerpo ?? {}) as { error?: string; message?: string; fields?: Record<string, string[]> }
    throw new ApiError(
      respuesta.status,
      err.error ?? 'server_error',
      err.message ?? 'Error del servidor.',
      err.fields,
    )
  }

  return cuerpo as T
}

export interface SesionLogin {
  token: string
  usuario: { id: number; nombre: string; rol: Rol }
  landing: string
}

export interface Yo {
  id: number
  nombre: string
  rol: Rol
  permisos: Record<string, boolean>
  landing: string
}

export async function login(email: string, password: string): Promise<SesionLogin> {
  const sesion = await pedir<SesionLogin>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  tokenActual = sesion.token
  return sesion
}

export async function logout(): Promise<void> {
  try {
    await pedir<void>('/auth/logout', { method: 'POST' })
  } finally {
    tokenActual = null
  }
}

export function me(): Promise<Yo> {
  return pedir<Yo>('/auth/me')
}

export function haySesion(): boolean {
  return tokenActual !== null
}

// ---- Datos aún simulados (se sustituyen en los sprints 2-5) ----
export const getDatos = (): Promise<DatosDemo> => mock.getDatos()
