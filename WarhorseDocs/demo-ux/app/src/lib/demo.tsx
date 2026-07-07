import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router'
import * as api from './api'
import { permisosIniciales, usuariosIniciales } from './mock/fixtures'
import type { DatosDemo, EstadoRequisicion, Requisicion, Rol, UsuarioDemo } from './types'

// Estado global del demo — espejo del `state` del componente del demo
// validado (view/rol/selTractoId/reqsExtra/estadoOverrides/usuarios/permisos).

export interface PasoTour {
  view: string | null
  sel: string | null
  title: string
  body: string
}

export const pasosTour: PasoTour[] = [
  { view: null, sel: null, title: 'Bienvenido al Hub de Gastos', body: 'Este recorrido de 1 minuto te muestra cómo WarHorse consolida diésel, refacciones y taller por tracto. Puedes saltarlo cuando quieras.' },
  { view: 'dashboard', sel: '[data-tour="nav"]', title: 'Navegación', body: 'Cinco módulos: Tablero para Dirección, Requisición para el piso de taller, Compras para Montzay, Catálogo de unidades y administración de Usuarios.' },
  { view: 'dashboard', sel: '[data-tour="kpis"]', title: 'Costo real consolidado', body: 'Los tres gastos que antes vivían en Excels separados — diésel, refacciones y taller — sumados por periodo. El cuarto KPI es el costo real de operar la flota.' },
  { view: 'dashboard', sel: '[data-tour="barras"]', title: 'Gasto por tracto', body: 'Cada barra es un tracto activo; la rayada es el que más se ha tragado. Haz clic en cualquier barra para analizar esa unidad abajo.' },
  { view: 'dashboard', sel: '[data-tour="decision"]', title: 'La pregunta de los 30 segundos', body: '¿Vale la pena meterle más lana? El Hub compara costo acumulado contra el valor estimado de la unidad y sugiere mantener o vender. El umbral es ajustable.' },
  { view: 'requisicion', sel: '[data-tour="reqform"]', title: 'Requisición desde el taller', body: 'Edgar pide piezas con foto obligatoria y origen: compra o canibalizada del yonke. Si es yonke, se exige donante y costo estimado para no perder trazabilidad.' },
  { view: 'compras', sel: '[data-tour="compras"]', title: 'Panel de Compras', body: 'Montzay ve todo ordenado por urgencia y avanza cada pieza por su ciclo: Solicitado → Cotizado → Comprado → Instalado.' },
  { view: 'catalogo', sel: '[data-tour="catalogo"]', title: 'Catálogo de unidades', body: 'Toda la flota: tractores, cajas y unidades Yonke que donan piezas. Desde aquí abres la ficha completa de cualquier unidad.' },
  { view: 'usuarios', sel: '[data-tour="usuarios"]', title: 'Usuarios y permisos', body: 'Controla quién entra al Hub y qué módulo ve cada rol: Dirección, Taller y Compras.' },
  { view: 'dashboard', sel: null, title: '¡Listo para arrancar!', body: 'Busca los iconos "?" en cada sección para más detalle. Puedes repetir este recorrido con el botón Tutorial del menú.' },
]

export interface Confirmacion {
  id: string
  pieza: string
  destino: string
  next: EstadoRequisicion
}

export interface Tip {
  text: string
  x: number
  y: number
}

export interface RectTour {
  x: number
  y: number
  w: number
  h: number
}

interface ContextoDemo {
  datos: DatosDemo | null
  umbral: number
  rol: Rol
  setRol: (r: Rol) => void
  usuarioActual: string
  selTractoId: string
  setSelTractoId: (id: string) => void
  reqs: Requisicion[]
  agregarReq: (r: Requisicion) => void
  avanzarReq: (id: string, next: EstadoRequisicion) => void
  usuarios: UsuarioDemo[]
  setUsuarios: (u: UsuarioDemo[]) => void
  permisos: Record<string, boolean>
  setPermisos: (p: Record<string, boolean>) => void
  toastMsg: string
  toast: (msg: string) => void
  confirmar: Confirmacion | null
  setConfirmar: (c: Confirmacion | null) => void
  tip: Tip | null
  tipShow: (text: string) => (e: { currentTarget: Element }) => void
  tipHide: () => void
  tourStep: number
  tourRect: RectTour | null
  goTour: (n: number) => void
  endTour: () => void
}

const Ctx = createContext<ContextoDemo | null>(null)

const rutaDeVista: Record<string, string> = {
  dashboard: '/dashboard',
  requisicion: '/requisicion',
  compras: '/compras',
  catalogo: '/catalogo',
  usuarios: '/usuarios',
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [datos, setDatos] = useState<DatosDemo | null>(null)
  const [rol, setRol] = useState<Rol>('admin')
  const [selTractoId, setSelTractoId] = useState('WH125')
  const [reqsExtra, setReqsExtra] = useState<Requisicion[]>([])
  const [overrides, setOverrides] = useState<Record<string, EstadoRequisicion>>({})
  const [usuarios, setUsuarios] = useState<UsuarioDemo[]>(usuariosIniciales.map((u) => ({ ...u })))
  const [permisos, setPermisos] = useState<Record<string, boolean>>({ ...permisosIniciales })
  const [toastMsg, setToastMsg] = useState('')
  const [confirmar, setConfirmar] = useState<Confirmacion | null>(null)
  const [tip, setTip] = useState<Tip | null>(null)
  const [tourStep, setTourStep] = useState(-1)
  const [tourRect, setTourRect] = useState<RectTour | null>(null)
  const toastT = useRef<ReturnType<typeof setTimeout>>(undefined)
  const tourT = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    void api.getDatos().then(setDatos)
  }, [])

  const toast = useCallback((msg: string) => {
    clearTimeout(toastT.current)
    setToastMsg(msg)
    toastT.current = setTimeout(() => setToastMsg(''), 3200)
  }, [])

  const reqs = (datos ? [...datos.requisiciones, ...reqsExtra] : reqsExtra).map((q) => ({
    ...q,
    estado: overrides[q.id] || q.estado,
  }))

  const agregarReq = useCallback((r: Requisicion) => {
    setReqsExtra((prev) => [...prev, r])
  }, [])

  const avanzarReq = useCallback((id: string, next: EstadoRequisicion) => {
    setOverrides((prev) => ({ ...prev, [id]: next }))
  }, [])

  const medirTour = useCallback((paso: number) => {
    const st = pasosTour[paso]
    if (!st || !st.sel) return setTourRect(null)
    const el = document.querySelector(st.sel)
    if (!el) return setTourRect(null)
    let r = el.getBoundingClientRect()
    if (r.top < 70 || r.bottom > window.innerHeight - 120) {
      window.scrollTo({ top: Math.max(0, r.top + window.scrollY - 120) })
      r = el.getBoundingClientRect()
    }
    setTourRect({ x: r.left, y: r.top, w: r.width, h: r.height })
  }, [])

  const endTour = useCallback(() => {
    clearTimeout(tourT.current)
    setTourStep(-1)
    setTourRect(null)
    try {
      localStorage.setItem('wh_tour_v1', 'done')
    } catch {
      /* sin localStorage */
    }
  }, [])

  const goTour = useCallback(
    (n: number) => {
      if (n < 0) n = 0
      if (n >= pasosTour.length) return endTour()
      const st = pasosTour[n]
      setTourStep(n)
      setTourRect(null)
      if (st.view) navigate(rutaDeVista[st.view])
      clearTimeout(tourT.current)
      tourT.current = setTimeout(() => medirTour(n), import.meta.env.MODE === 'test' ? 10 : 460)
    },
    [endTour, medirTour, navigate],
  )

  const tipShow = useCallback(
    (text: string) => (e: { currentTarget: Element }) => {
      const r = e.currentTarget.getBoundingClientRect()
      setTip({ text, x: r.left + r.width / 2, y: r.bottom + 10 })
    },
    [],
  )

  const tipHide = useCallback(() => setTip(null), [])

  const usuarioActual =
    rol === 'compras' ? 'Montzay Vázquez · Compras' : rol === 'taller' ? 'Edgar Fraga · Taller' : 'Dirección · Admin'

  return (
    <Ctx.Provider
      value={{
        datos,
        umbral: 40,
        rol,
        setRol,
        usuarioActual,
        selTractoId,
        setSelTractoId,
        reqs,
        agregarReq,
        avanzarReq,
        usuarios,
        setUsuarios,
        permisos,
        setPermisos,
        toastMsg,
        toast,
        confirmar,
        setConfirmar,
        tip,
        tipShow,
        tipHide,
        tourStep,
        tourRect,
        goTour,
        endTour,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useDemo(): ContextoDemo {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useDemo requiere DemoProvider')
  return ctx
}
