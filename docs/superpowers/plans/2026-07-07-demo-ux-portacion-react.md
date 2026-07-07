# Demo UX Warhorse — Portación React Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el demo navegable de alta fidelidad del Hub de Gastos por Tracto en `WarhorseDocs/demo-ux/app/` (7 pantallas, datos mock, cero backend), fiel al demo validado según docs 08 y 09.

**Architecture:** SPA React con rutas protegidas por rol. Toda la data pasa por la firma de `src/lib/api.ts` (contrato doc 05), implementada por `src/lib/mock/` con fixtures + latencia simulada. Los componentes importan **solo** `lib/api.ts`, nunca `lib/mock/`. Identidad visual vía tokens Tailwind 4 `@theme` (doc 08 §7).

**Tech Stack:** React 19 · Vite 6 · TypeScript 5 · Tailwind CSS 4 (`@tailwindcss/vite`) · React Router 7 · lucide-react · Vitest + React Testing Library (jsdom) · ESLint 9 flat config.

## Global Constraints

- Ruta base del proyecto: `/home/dagargon89/warhorse/WarhorseDocs/demo-ux/app/` (todas las rutas de archivo abajo son relativas a ella).
- **Prohibido** cablear datos reales o llamadas de red (ADR-003). El "login" solo fija rol; la "foto" es placeholder; el "envío" vive en estado de React.
- Colores EXACTOS del doc 08 §6/§7 (`#F2620F`, `#16191E`, `#F3EFE7`, etc.). NO texto blanco sobre naranja en cuerpos largos; NO azul de marca (`#1B4E8C` solo en badge "Comprado"); NO íconos rellenos (solo lucide line-art); el camión de firma solo en login y estados vacíos.
- Tipografía: Barlow (cuerpo) y Barlow Condensed (títulos/KPIs/cifras, uppercase, `tabular-nums` en montos).
- Mensajes de error de requisición VERBATIM (doc 09 §4): "Selecciona el tracto destino.", "Describe la pieza solicitada.", "El origen Yonke obliga a registrar la unidad donante.", "Asigna un costo estimado a la pieza donada, aunque no exista factura.", "La foto de la pieza o número de serie es obligatoria."
- Estados obligatorios por componente: default, hover, focus, disabled, loading, **empty, error** (doc 09 §4).
- Gates de cada tarea: `npm run typecheck` y `npm run lint` en verde antes de commit.
- Repositorio git: `/home/dagargon89/warhorse` (se inicializa en Task 1). Commits frecuentes, mensajes `feat:/test:/chore:` terminando con `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Rol `diesel` existe en datos/tipos pero NO tiene pantalla en el demo (doc 09 §2 lista 7 pantallas); el selector de login ofrece Dirección / Taller / Compras (mapa §3).

## Estructura de archivos (mapa completo)

```
demo-ux/app/
├── package.json, vite.config.ts, tsconfig.json, eslint.config.js, index.html
├── src/
│   ├── main.tsx                    ← entry; importa styles/tokens.css
│   ├── routes.tsx                  ← rutas §2 doc 09 + guardas por rol
│   ├── styles/tokens.css           ← @theme doc 08 §7 completo
│   ├── lib/
│   │   ├── api.ts                  ← contrato doc 05 (firma congelada)
│   │   ├── types.ts                ← entidades
│   │   ├── session.tsx             ← contexto de sesión (usuario+permisos en memoria)
│   │   └── mock/{index.ts, fixtures.ts, scenarios.ts}
│   ├── components/                 ← Boton, Campos, Badge, KpiCard, Tabla, NavLateral,
│   │                                 Avatar, Gauge, DonutMantenimiento, BarrasGasto,
│   │                                 Modal, Toast, Tour, EstadoVacio, CamionFirma,
│   │                                 SelectorEscenario
│   └── pages/                      ← Login, Dashboard, Ficha, Requisicion, Compras,
│                                     Catalogo, Usuarios
└── src/__tests__/                  ← mock.test.ts, routes.smoke.test.tsx
```

---

### Task 1: Scaffold del proyecto (Vite + TS + Tailwind 4 + tooling)

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `eslint.config.js`, `index.html`, `src/main.tsx`, `src/styles/tokens.css`, `src/vite-env.d.ts`
- Git: `git init` en `/home/dagargon89/warhorse` si no existe repo.

**Interfaces:**
- Produces: comandos `npm run dev|build|typecheck|lint|test`; tokens Tailwind `wh-*` disponibles como clases (`bg-wh-orange`, `font-display`, `rounded-card`, …).

- [ ] **Step 1: git init + .gitignore + commit de la documentación existente**

```bash
cd /home/dagargon89/warhorse && git init -b main
printf 'node_modules/\ndist/\n*.local\n' > WarhorseDocs/demo-ux/app/.gitignore
git add -A && git commit -m "chore: documentación Warhorse + plan demo-ux"
```

- [ ] **Step 2: package.json y configs**

`package.json`:
```json
{
  "name": "warhorse-demo-ux",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src",
    "test": "vitest run"
  },
  "dependencies": {
    "lucide-react": "^0.525.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router": "^7.6.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.0",
    "@testing-library/jest-dom": "^6.6.0",
    "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@vitejs/plugin-react": "^4.5.0",
    "eslint": "^9.28.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^16.2.0",
    "jsdom": "^26.1.0",
    "tailwindcss": "^4.1.0",
    "typescript": "~5.8.3",
    "typescript-eslint": "^8.33.0",
    "vite": "^6.3.5",
    "vitest": "^3.2.0"
  }
}
```

`vite.config.ts`:
```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: { environment: 'jsdom', setupFiles: './src/__tests__/setup.ts', globals: true },
})
```

`tsconfig.json`: target ES2022, `"jsx": "react-jsx"`, `strict: true`, `moduleResolution: "bundler"`, `types: ["vitest/globals", "@testing-library/jest-dom"]`, include `src`.

`eslint.config.js`: flat config estándar de Vite React TS (typescript-eslint recommended + react-hooks + react-refresh).

`index.html` (carga de fuentes, doc 08 §7):
```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Barlow+Condensed:wght@600;700&display=swap" rel="stylesheet">
    <title>Warhorse — Hub de Gastos por Tracto</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: `src/styles/tokens.css`** — copiar VERBATIM el bloque `@theme` del doc 08 §7, y añadir los tokens que el §7 omite pero §6 define (`--color-wh-on-dark: #DDD7CB`, `--color-wh-nav-idle: #B8B2A6`, `--color-wh-muted-2`, `--color-wh-green-ink: #2C7A44`, `--color-wh-green-border: #9FD4B0`, `--color-wh-amber-ink: #8A6D1A`, `--color-wh-amber-border: #E0C36A`, `--color-wh-blue-ink: #1B4E8C`, `--color-wh-blue-border: #9FC0E4`, `--color-wh-orange-04: rgba(242,98,15,0.16)`). Añadir base:

```css
@layer base {
  body { @apply bg-wh-bg text-wh-ink font-body; }
  h1, h2, h3 { @apply font-display uppercase; }
}
@keyframes growBar { from { height: 0; } }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 4: `src/main.tsx` mínimo** (render `<h1>Warhorse</h1>`), `npm install`, y verificar:

```bash
npm install
npm run typecheck   # esperado: sin errores
npm run lint        # esperado: sin errores
npm run dev &       # esperado: HTTP 200 en localhost:5173 con el h1
```

- [ ] **Step 5: Commit** `feat(demo): scaffold Vite+React19+Tailwind4 con tokens del design system`

---

### Task 2: Capa de datos — types, contrato api.ts, fixtures, mock, scenarios (TDD)

**Files:**
- Create: `src/lib/types.ts`, `src/lib/api.ts`, `src/lib/mock/fixtures.ts`, `src/lib/mock/index.ts`, `src/lib/mock/scenarios.ts`, `src/__tests__/setup.ts`, `src/__tests__/mock.test.ts`

**Interfaces (producidas — firmas exactas que consumen todas las pantallas):**

`types.ts`:
```ts
export type Rol = 'admin' | 'taller' | 'compras' | 'diesel'
export type EstadoUnidad = 'Activo' | 'Yonke' | 'Inactivo'
export type TipoUnidad = 'Tractor' | 'Caja' | 'Thermo'
export type Origen = 'Compra' | 'Yonke'
export type Urgencia = 'Rápida' | 'Media' | 'Crítica'
export type EstadoRequisicion = 'Solicitado' | 'Cotizado' | 'Comprado' | 'Instalado'
export type OrigenCostoEstimado = 'ultima_compra' | 'catalogo' | 'manual'
export type Veredicto = 'Mantener' | 'Evaluar' | 'Vender'

export interface Usuario { id: number; nombre: string; email: string; rol: Rol; activo: boolean }
export interface Permisos { dashboard: boolean; requisicion: boolean; compras: boolean; catalogo: boolean; usuarios: boolean }
export interface Sesion { token: string; usuario: Usuario; permisos: Permisos; landing: string }
export interface Unidad {
  id: number; id_unidad: string; tipo: TipoUnidad; estado: EstadoUnidad
  valor_referencia: number | null; costo_real_acumulado: number; candidata_reincidencia: boolean
}
export interface Requisicion {
  id: number; estado: EstadoRequisicion; origen: Origen
  unidad_destino_id: number; unidad_donante_id: number | null
  descripcion_pieza: string; numero_parte: string | null; urgencia: Urgencia
  costo_estimado: number | null; costo_real: number | null; es_estimado: boolean
  origen_costo_estimado: OrigenCostoEstimado | null; numero_factura: string | null
  foto_pieza_url: string; fecha_solicitud: string
}
export interface Reparacion {
  fecha_ingreso: string; fecha_salida: string | null; dias_en_taller: number
  diagnostico: string; criticidad: Urgencia; tipo_liberacion: 'Total' | 'Parcial' | null
  costo_taller: number; es_reincidencia: boolean
}
export interface PiezaDonada { descripcion_pieza: string; unidad_destino: string; costo_estimado: number; fecha: string }
export interface Kpis { diesel: number; refacciones: number; taller: number; costo_real_acumulado: number }
export interface Ficha {
  unidad: Unidad; kpis: Kpis; reparaciones: Reparacion[]
  piezas_instaladas: Requisicion[]; piezas_donadas: PiezaDonada[]
}
export interface RankingItem { id_unidad: string; costo_total: number; critico: boolean }
export interface AnalisisUnidad {
  id_unidad: string; eficiencia_km_l: number | null
  pct_reparacion_total: number; pct_mejoralito: number
  veredicto: Veredicto | null; razon: string; valor_referencia_pendiente: boolean
}
export interface Dashboard {
  kpis: Kpis; ranking: RankingItem[]; seleccion: AnalisisUnidad
  parametros: { umbral_pct: number; ventana_meses: number }
}
export interface NuevaRequisicion {
  unidad_destino_id: number | null; origen: Origen; unidad_donante_id: number | null
  descripcion_pieza: string; numero_parte: string | null; urgencia: Urgencia
  costo_estimado_manual: number | null; foto_adjunta: boolean
}
export class ApiError extends Error {
  constructor(public codigo: 'validation'|'unauthenticated'|'forbidden'|'not_found'|'conflict'|'server_error',
              message: string, public fields?: Record<string, string[]>) { super(message) }
}
```

`api.ts` (una función por endpoint del doc 05 — firma congelada; delega en `./mock`):
```ts
import * as mock from './mock'
export const login = (email: string, password: string): Promise<Sesion> => mock.login(email, password)
export const logout = (): Promise<void> => mock.logout()
export const me = (): Promise<Sesion> => mock.me()
export const getUnidades = (estado?: EstadoUnidad): Promise<Unidad[]> => mock.getUnidades(estado)
export const getFicha = (idUnidad: string): Promise<Ficha> => mock.getFicha(idUnidad)
export const crearRequisicion = (r: NuevaRequisicion): Promise<Requisicion> => mock.crearRequisicion(r)
export const getColaCompras = (estado?: EstadoRequisicion): Promise<Requisicion[]> => mock.getColaCompras(estado)
export const avanzarEstado = (id: number, cambio: { estado: EstadoRequisicion; costo_real?: number; numero_factura?: string }): Promise<Requisicion> => mock.avanzarEstado(id, cambio)
export const registrarDiesel = (r: { unidad_id: number; fecha: string; litros: number; costo_total: number; km_recorridos: number }): Promise<void> => mock.registrarDiesel(r)
export const registrarIngreso = (r: { unidad_id: number; fecha_ingreso: string; diagnostico: string; criticidad: Urgencia }): Promise<void> => mock.registrarIngreso(r)
export const liberarUnidad = (id: number, r: { tipo_liberacion: 'Total'|'Parcial'; fecha_salida: string; costo_taller: number; pendientes?: string[] }): Promise<void> => mock.liberarUnidad(id, r)
export const getDashboard = (idUnidad?: string): Promise<Dashboard> => mock.getDashboard(idUnidad)
export const setParametrosVeredicto = (p: { umbral_pct: number; ventana_meses: number }): Promise<Dashboard> => mock.setParametrosVeredicto(p)
export const getUsuarios = (): Promise<Usuario[]> => mock.getUsuarios()
export const crearUsuario = (u: { nombre: string; email: string; rol: Rol }): Promise<Usuario> => mock.crearUsuario(u)
export const actualizarUsuario = (id: number, cambio: { rol?: Rol; activo?: boolean }): Promise<Usuario> => mock.actualizarUsuario(id, cambio)
```

`scenarios.ts`:
```ts
export type Escenario = 'normal' | 'vacio' | 'error'
let actual: Escenario = 'normal'
export const setEscenario = (e: Escenario) => { actual = e }
export const getEscenario = (): Escenario => actual
```

**Contenido de `fixtures.ts` (datos del onboarding, doc 09 §5.1 + ejemplos doc 05):**
- Usuarios: 1 Dirección WarHorse (admin, direccion@warhorse.mx) · 2 Montzay Vázquez (compras) · 3 Edgar Fraga (taller) · 4 Kevin Rafael Ávila (taller) · 5 Greisy López (diesel) · 6 Héctor Ramírez (taller).
- Unidades: WH101 (Activo, ref 580000, acum 210000), WH104 (Activo, ref 640000, acum 145200), WH125 (Activo, ref 620000, acum 312500, candidata_reincidencia true), WH118 (Activo, ref 700000, acum 98400), WH03 (Yonke, ref null, acum 0), WH60 (Yonke, ref null, acum 0), WH88 (Inactivo, ref 300000, acum 154000).
- Ficha WH125: kpis {diesel 180000, refacciones 92500, taller 40000, total 312500}; reparaciones: Transmisión (2026-03-01→2026-05-26, 86 días, Crítico, Total, 32000) y Frenos mejoralito (2026-06-10→2026-06-12, 2 días, Media, Parcial, 8000, es_reincidencia false). Piezas instaladas: Turbo (Yonke, donante WH03, 4500 estimado `ultima_compra`, Instalado).
- Ficha WH03 (Yonke): reparaciones/instaladas vacías; piezas_donadas: [Turbo → WH125, 4500, 2026-06-22].
- Requisiciones cola de Compras: #87 Turbo (Yonke, WH03→WH125, Crítica, 4500 estimado, Instalado) y #88 Balatas delanteras (Compra, →WH104, Media, costo null, Cotizado), #89 Filtro de aire (Compra, →WH101, Rápida, Solicitado).
- Dashboard: kpis {1250000, 480000, 210000, 1940000}; ranking ordenado desc con WH125 crítico (312500); análisis WH125: eficiencia 1.2 km/L, 80/20, veredicto "Vender", razón VERBATIM doc 05 §8; parámetros {40, 12}.
- Permisos por rol (RF-USR-03): admin todo true; taller {requisicion, catalogo}; compras {compras, catalogo}; diesel todo false (sin pantalla en demo).

**Comportamiento de `mock/index.ts`:**
- `delay(ms = 400)` en cada función (latencia simulada); estado mutable en módulo (arrays clonados de fixtures) para que altas/cambios persistan durante la sesión.
- `login`: encuentra usuario por email; suspendido o inexistente → `ApiError('unauthenticated', 'Credenciales inválidas.')`; devuelve permisos por rol y `landing` (admin→dashboard, taller→requisicion, compras→compras).
- `crearRequisicion` valida en este orden y lanza `ApiError('validation', <mensaje verbatim doc 09 §4>)`: sin destino → "Selecciona el tracto destino."; sin descripción → "Describe la pieza solicitada."; Yonke sin donante → "El origen Yonke obliga a registrar la unidad donante."; Yonke sin costo>0 → "Asigna un costo estimado a la pieza donada, aunque no exista factura."; sin foto → "La foto de la pieza o número de serie es obligatoria." Crea con estado `Solicitado`, `es_estimado: origen==='Yonke'`, `origen_costo_estimado: 'manual'` si Yonke.
- `avanzarEstado` aplica la máquina §4.2 del SRS: Compra Solicitado→Cotizado→Comprado (exige costo_real y numero_factura, si faltan `ApiError('validation', …)`)→Instalado; Yonke Solicitado→Instalado directo; transición ilegal → `ApiError('conflict', 'Transición de estado ilegal.')`; Yonke nunca acepta numero_factura (conflict).
- `getColaCompras` ordena Crítica→Media→Rápida y filtra por estado.
- `setParametrosVeredicto` valida umbral 20–80 y ventana 1–36 (`ApiError('validation', …)`); recalcula el veredicto de la selección: pct = costo_acum/valor_ref*100; pct > umbral → 'Vender' (razón con montos y umbral), pct > umbral-10 → 'Evaluar', si no 'Mantener'; sin valor_referencia → veredicto null + valor_referencia_pendiente true.
- Escenarios: si `getEscenario()==='vacio'`, los listados (`getUnidades`, `getColaCompras`, `getUsuarios`, ranking) devuelven vacío; si `'error'`, lecturas lanzan `ApiError('server_error', 'No se pudieron cargar los datos.')`. El "sin permiso" NO vive aquí: lo aplican las guardas de ruta (Task 3).

- [ ] **Step 1: escribir `src/__tests__/mock.test.ts` (falla: módulos no existen).** Casos mínimos:

```ts
import { setEscenario } from '../lib/mock/scenarios'
import * as api from '../lib/api'

const base = { unidad_destino_id: 12, origen: 'Compra' as const, unidad_donante_id: null,
  descripcion_pieza: 'Balatas', numero_parte: null, urgencia: 'Media' as const,
  costo_estimado_manual: null, foto_adjunta: true }

test('login por rol devuelve landing y permisos', async () => {
  const s = await api.login('direccion@warhorse.mx', 'x')
  expect(s.landing).toBe('dashboard'); expect(s.permisos.usuarios).toBe(true)
  const t = await api.login('edgar@warhorse.mx', 'x')
  expect(t.landing).toBe('requisicion'); expect(t.permisos.compras).toBe(false)
})
test('requisición sin foto rechazada con mensaje verbatim', async () => {
  await expect(api.crearRequisicion({ ...base, foto_adjunta: false }))
    .rejects.toThrow('La foto de la pieza o número de serie es obligatoria.')
})
test('Yonke exige donante y costo > 0', async () => {
  await expect(api.crearRequisicion({ ...base, origen: 'Yonke' }))
    .rejects.toThrow('El origen Yonke obliga a registrar la unidad donante.')
  await expect(api.crearRequisicion({ ...base, origen: 'Yonke', unidad_donante_id: 3 }))
    .rejects.toThrow('Asigna un costo estimado a la pieza donada, aunque no exista factura.')
})
test('máquina de estados: Compra no salta a Instalado; Yonke sí', async () => {
  await expect(api.avanzarEstado(89, { estado: 'Instalado' })).rejects.toThrow('Transición de estado ilegal.')
  const r = await api.crearRequisicion({ ...base, origen: 'Yonke', unidad_donante_id: 3, costo_estimado_manual: 1200 })
  const inst = await api.avanzarEstado(r.id, { estado: 'Instalado' })
  expect(inst.estado).toBe('Instalado'); expect(inst.es_estimado).toBe(true)
})
test('ficha Yonke muestra donaciones', async () => {
  const f = await api.getFicha('WH03')
  expect(f.reparaciones).toHaveLength(0)
  expect(f.piezas_donadas[0]).toMatchObject({ descripcion_pieza: 'Turbo', unidad_destino: 'WH125' })
})
test('escenario vacío y error', async () => {
  setEscenario('vacio'); expect(await api.getUnidades()).toHaveLength(0)
  setEscenario('error'); await expect(api.getUnidades()).rejects.toThrow('No se pudieron cargar los datos.')
  setEscenario('normal')
})
test('cola de compras ordenada por urgencia', async () => {
  const cola = await api.getColaCompras()
  const urg = cola.map(r => r.urgencia)
  expect(urg.indexOf('Crítica')).toBeLessThan(urg.lastIndexOf('Rápida'))
})
```

- [ ] **Step 2: correr y ver fallar** — `npm run test` → FAIL (módulos inexistentes).
- [ ] **Step 3: implementar** `types.ts`, `scenarios.ts`, `fixtures.ts`, `mock/index.ts`, `api.ts` según los contratos de arriba. En tests, `delay` debe ser corto: usar `const delay = (ms=400) => new Promise(r => setTimeout(r, import.meta.env.MODE === 'test' ? 0 : ms))`.
- [ ] **Step 4: verificar** — `npm run test` PASS · `npm run typecheck` limpio · `npm run lint` limpio.
- [ ] **Step 5: Commit** `feat(demo): capa mock detrás del contrato lib/api.ts (doc 05) con fixtures del onboarding`

---

### Task 3: Sesión, rutas y guardas por rol

**Files:**
- Create: `src/lib/session.tsx`, `src/routes.tsx`, `src/pages/*.tsx` (placeholders con H1 por vista), `src/__tests__/routes.smoke.test.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: `api.login`, `Sesion`, `Permisos`.
- Produces: `useSesion(): { sesion: Sesion | null; entrar(rol: 'admin'|'taller'|'compras'): Promise<void>; salir(): void }`; componente `RutaProtegida({ modulo, children })` que: sin sesión → `<Navigate to="/login">`; con sesión sin permiso → toast "No tienes permiso para ver ese módulo" + redirección al landing del rol.
- Rutas exactas (doc 09 §2): `/login`, `/dashboard`, `/ficha/:id`, `/requisicion`, `/compras`, `/catalogo`, `/usuarios`; `/` redirige a login o landing.
- `entrar(rol)` usa el email del fixture de ese rol (admin→direccion@, taller→edgar@, compras→montzay@).

- [ ] **Step 1: test smoke de rutas (falla)** — `routes.smoke.test.tsx`: renderiza `<App>` en `MemoryRouter`; sin sesión `/dashboard` muestra el login; tras `entrar('admin')` (helper que envuelve el provider) `/dashboard` muestra `heading /tablero/i`; `entrar('taller')` en `/compras` redirige a requisición.
- [ ] **Step 2: correr y ver fallar.**
- [ ] **Step 3: implementar** `session.tsx` (contexto en memoria, sin persistencia — ADR-003), placeholders de páginas (H1 con el nombre de la vista) y `routes.tsx` con `RutaProtegida`. Módulo por ruta: dashboard→dashboard, requisicion→requisicion, compras→compras, catalogo→catalogo, usuarios→usuarios, ficha→catalogo (navegable por todos los roles con catálogo o dashboard: usar `modulo="catalogo"`... **decisión:** la Ficha es navegable por todos los roles autenticados (doc 09 §2 "Todos"), así que solo exige sesión).
- [ ] **Step 4: verificar** tests + typecheck + lint verdes.
- [ ] **Step 5: Commit** `feat(demo): ruteo con guardas por rol y sesión en memoria`

---

### Task 4: Componentes base del design system

**Files:**
- Create: `src/components/Boton.tsx`, `Campo.tsx` (Input/Select/Textarea con label+error), `Badge.tsx`, `KpiCard.tsx`, `Tabla.tsx`, `Avatar.tsx`, `Modal.tsx`, `Toast.tsx` (provider + hook `useToast`), `EstadoVacio.tsx`, `CamionFirma.tsx` (SVG línea), `Skeleton.tsx`

**Interfaces (props exactas que consumen las páginas):**
```ts
Boton: { variante?: 'primario'|'oscuro'|'outline'; cargando?: boolean } & ButtonHTMLAttributes
Campo: { etiqueta: string; error?: string; tipo?: 'text'|'number'|'select'|'textarea'; opciones?: {valor:string; texto:string}[] } & (input props)
Badge: { tipo: 'criticidad'|'origen'|'estadoReq'|'estadoUnidad'; valor: string }  // mapea color doc 08 §2.3/§5.3
KpiCard: { etiqueta: string; valor: string | null; cargando?: boolean }           // null → "—"
Tabla<T>: { columnas: { titulo: string; alinear?: 'right'; render: (f: T) => ReactNode }[];
           filas: T[] | null; cargando: boolean; error: string | null;
           onReintentar: () => void; onFila?: (f: T) => void; textoVacio: string }
Modal: { abierto: boolean; titulo: string; onCerrar: () => void; onConfirmar: () => void;
         textoConfirmar: string; children }   // trap de foco + Escape + devuelve foco al cerrar
useToast(): { avisar(msg: string, variante?: 'ok'|'error'): void }  // ~3.2s, entrada 200ms
EstadoVacio: { mensaje: string }   // camión de firma line-art
```

**Recetas visuales exactas (doc 08 §5):** botón primario `bg-wh-orange hover:bg-wh-orange-hover text-white font-display font-bold uppercase tracking-wide px-5 py-3.5 rounded-[9px] shadow-[0_4px_12px_rgba(242,98,15,0.35)] transition-transform hover:-translate-y-px focus-visible:ring-4 focus-visible:ring-wh-orange-focus disabled:opacity-50 disabled:shadow-none`; oscuro `bg-wh-ink text-[#DDD7CB]`; input `bg-white border border-wh-border rounded-[9px] px-4 py-3 focus:border-wh-orange focus-visible:ring-4 focus-visible:ring-wh-orange-focus`, error → borde `border-wh-orange` + mensaje `text-wh-orange-ink text-sm`; badge `text-[12px] font-bold px-2.5 py-0.5 rounded-md border` con paleta §2.3 (verde soft/ink/border · ámbar · naranja · azul solo "Comprado" · neutro); tarjeta `bg-wh-surface rounded-[13px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-5`, label uppercase `font-display text-[13px] tracking-[0.16em] text-wh-muted-2`, valor `font-display text-[38px] font-bold tabular-nums`; tabla: th `font-display uppercase text-wh-muted-2 text-[13px] tracking-wider`, filas `border-b border-wh-border-soft`, montos `text-right tabular-nums font-display font-bold`, hover `hover:bg-wh-bg/60 cursor-pointer` si `onFila`; estados: cargando → `Skeleton` de 4 filas; error → "No se pudieron cargar los datos" + botón "Reintentar"; vacío → `EstadoVacio` con `textoVacio`.

- [ ] **Step 1:** implementar los 11 componentes (archivo por componente, cada uno < 90 líneas).
- [ ] **Step 2:** test RTL mínimo `src/__tests__/componentes.test.tsx`: Tabla muestra "Reintentar" en error y `textoVacio` con lista vacía; Modal atrapa Escape y llama `onCerrar`; Boton disabled no dispara onClick.
- [ ] **Step 3:** verificar tests + typecheck + lint.
- [ ] **Step 4: Commit** `feat(demo): componentes base del design system (doc 08 §5)`

---

### Task 5: Layout con navegación lateral responsive

**Files:**
- Create: `src/components/NavLateral.tsx`, `src/components/AppLayout.tsx`
- Modify: `src/routes.tsx` (envolver vistas autenticadas en `AppLayout`)

**Spec:** logo "WARHORSE · HUB DE GASTOS" arriba (font-display); ítems según `sesion.permisos` en este orden: Tablero(/dashboard), Requisición(/requisicion), Compras(/compras), Catálogo(/catalogo), Usuarios(/usuarios); ítem = uppercase font-display, inactivo `text-wh-nav-idle`, activo `bg-wh-orange-04 border-l-[3px] border-wh-orange text-wh-orange` (NavLink); pie con `Avatar` (iniciales, color por rol: admin `#16191E`, taller `#F2620F`, compras `#3FA65C`), nombre, botón "Salir" y botón "Tutorial" (relanza tour, Task 12). Fondo del nav `bg-wh-ink`, contenido principal `bg-wh-bg`. Móvil (<768px): barra superior con hamburguesa (lucide `Menu`) que abre el nav como drawer overlay; íconos lucide de línea 20px por módulo (`LayoutDashboard`, `Wrench`, `ShoppingCart`, `Truck`, `Users`).

- [ ] **Step 1:** implementar NavLateral + AppLayout (`<Outlet/>`), integrarlo en routes.
- [ ] **Step 2:** ampliar smoke test: con sesión taller solo se ven "Requisición" y "Catálogo" en el nav.
- [ ] **Step 3:** verificar tests + typecheck + lint. **Step 4: Commit** `feat(demo): navegación lateral por rol responsive`

---

### Task 6: Pantalla Login (2 columnas, selector de rol)

**Files:** Create: `src/pages/Login.tsx` (sustituye placeholder)

**Spec (doc 08 §4 + doc 09):** dos columnas ≥768px (60% panel oscuro `bg-wh-ink` / 40% formulario sobre crema); móvil apila (info compacta arriba). Panel oscuro: `CamionFirma` (única pantalla con datos que lo usa), título Display `clamp` Barlow Condensed 700 uppercase "Hub de Gastos por Tracto", texto `text-[#DDD7CB]` "WarHorse México · Dataholics" y una línea del propósito ("¿Vale la pena meterle más lana a este tracto?"). Formulario: H1 "Iniciar sesión", selector de rol demo con 3 tarjetas radio (Dirección / Taller / Compras — cada una con avatar del rol y descripción corta), campos email/contraseña PRE-llenados según rol elegido (solo lectura demo: "el login solo fija el rol activo"), botón primario "Arrancar" con estado `cargando`. Al entrar → `navigate(landing)` (RF-AUTH-02). Error de login → mensaje bajo el formulario.

- [ ] **Step 1:** implementar. **Step 2:** smoke test: elegir "Taller" + Arrancar aterriza en `/requisicion`. **Step 3:** verificar + screenshot manual en dev server. **Step 4: Commit** `feat(demo): login dos columnas con selector de rol y aterrizaje por rol`

---

### Task 7: Dashboard directivo (KPIs, barras, gauge, donut, veredicto, parámetros)

**Files:**
- Create: `src/components/BarrasGasto.tsx`, `src/components/Gauge.tsx`, `src/components/DonutMantenimiento.tsx`, `src/pages/Dashboard.tsx`

**Interfaces:**
```ts
BarrasGasto: { ranking: RankingItem[]; seleccionada: string; onSeleccionar: (id: string) => void }
Gauge: { kmPorLitro: number | null }              // semicírculo SVG, aguja; null → "Sin datos suficientes"
DonutMantenimiento: { pctTotal: number; pctMejoralito: number }
```

**Spec:** H1 "Tablero directivo". Fila de 4 `KpiCard` (Diésel, Refacciones, Taller, Costo real acumulado — formato `$1,940,000` con `Intl.NumberFormat('es-MX')`). Panel "Gasto por tracto": barras verticales alto proporcional, color `bg-wh-ink`; la crítica con `repeating-linear-gradient(45deg, #F2620F, #F2620F 6px, #D9550C 6px, #D9550C 12px)`; la seleccionada `outline outline-2 outline-wh-orange`; animación `growBar 0.5s ease` + `transition-[height] duration-300`; cada barra es `<button>` con `aria-label` "WHxxx: $costo" (clic → recarga `getDashboard(id)`); doble clic o botón "Ver ficha completa" (variante oscura) → `/ficha/:id`. Panel eficiencia: `Gauge` gradiente gris→naranja→verde, cifra `X.X km/L`. Panel mantenimiento: `DonutMantenimiento` % Reparación Total (verde `#3FA65C`) vs Mejoralito (naranja `#F2620F`) con leyenda textual. **Caja de decisión:** bloque destacado (borde 2px naranja si Vender, verde si Mantener, ámbar si Evaluar) con veredicto grande uppercase y `razon` textual; si `valor_referencia_pendiente` → "Valor de referencia pendiente" en chip neutro. Panel "Parámetros del veredicto": inputs numéricos umbral (%) y ventana (meses) + botón "Aplicar" → `setParametrosVeredicto` (RF-DASH-05), errores 422 mostrados en el campo. Gráficas con `role="img"` y `aria-label` que anuncia el dato (doc 09 §6). Estados loading (skeletons) y error (mensaje + Reintentar) en cada panel.

- [ ] **Step 1:** smoke test (falla): con sesión admin `/dashboard` muestra "Vender" y la razón del fixture; cambiar umbral a 60 y Aplicar cambia el veredicto (312500/620000 = 50.4% → con umbral 60: 'Evaluar' porque 50.4 > 50).
- [ ] **Step 2:** implementar componentes + página. **Step 3:** tests + typecheck + lint verdes; revisar en dev server (RNF-08: veredicto legible en <30s). **Step 4: Commit** `feat(demo): dashboard directivo con veredicto configurable`

---

### Task 8: Ficha de Tracto (vista activa y vista Yonke)

**Files:** Create: `src/pages/Ficha.tsx`

**Spec (RF-FIC-01..04):** carga `getFicha(id)` del param. Encabezado: H1 `WH125` + `Badge estadoUnidad` + tipo; botón volver (lucide `ArrowLeft`). Fila de KpiCards: Diésel, Refacciones, Taller, Valor de referencia (null → "—" + chip "pendiente"). **Unidad activa:** sección "Historial de reparaciones" (Tabla: fecha ingreso, diagnóstico, `Badge criticidad`, `Badge` Total/Parcial, días en taller — si ≥60 días la celda va `text-wh-orange-ink font-bold` (estilo días largos, RF-FIC-02), costo derecha) + sección "Piezas instaladas" (Tabla: pieza, `Badge origen`, "donada por WH03" si Yonke, costo con badge "Estimado" cuando `es_estimado` — NUNCA estilo de facturado, RF-INT-02). **Unidad Yonke:** en lugar de reparaciones muestra "Piezas donadas a otras unidades" (pieza, destino navegable, costo estimado, fecha) (RF-FIC-04). Estados loading/error/vacío en cada tabla; id inexistente → EstadoVacio "Unidad no encontrada" + enlace al catálogo.

- [ ] **Step 1:** smoke test: `/ficha/WH125` muestra "86" y badge "Yonke · Estimado"; `/ficha/WH03` muestra "Piezas donadas a otras unidades".
- [ ] **Step 2:** implementar. **Step 3:** verificar. **Step 4: Commit** `feat(demo): ficha de tracto con vista activa y vista Yonke`

---

### Task 9: Requisición de refacciones (formulario dinámico Compra/Yonke)

**Files:** Create: `src/pages/Requisicion.tsx`

**Spec (RF-REQ-01..05):** una columna en móvil (uso en piso, RNF-09). H1 "Requisición de refacciones". Campos: Select "Tracto destino" (unidades Activo de `getUnidades('Activo')`); toggle segmentado Origen **Compra | Yonke** (botones tipo píldora, activo naranja); si Yonke → aparece Select "Unidad donante" (solo estado Yonke: WH03, WH60) + Campo numérico "Costo estimado" con ayuda "Aunque no exista factura, la pieza donada debe llevar costo (ADR-002)" y badge "Estimado"; Campo "Descripción de la pieza" (textarea), "Número de parte (opcional)", píldoras de urgencia Rápida/Media/Crítica (colores §2.3); zona "Foto de la pieza *" — placeholder clickeable (lucide `Camera`) que alterna `foto_adjunta` y muestra miniatura simulada (sin subida real). Botón primario "Enviar requisición" (disabled mientras inválido a nivel UI mínimo: sin envío en curso doble). Al enviar: `crearRequisicion`; errores `ApiError.message` bajo el campo correspondiente (mensajes verbatim); éxito → toast "Requisición enviada — Compras la verá en su panel" + reset del formulario (flujo `R → toast éxito → R` del mapa §3). Alternar Compra↔Yonke muestra/oculta campos (RF-REQ-05).

- [ ] **Step 1:** test RTL: enviar sin foto muestra el mensaje verbatim; alternar a Yonke hace visible "Unidad donante"; envío válido Yonke muestra el toast.
- [ ] **Step 2:** implementar. **Step 3:** verificar. **Step 4: Commit** `feat(demo): formulario de requisición dinámico Compra/Yonke con validaciones verbatim`

---

### Task 10: Panel de Compras (cola priorizada + ciclo de estados)

**Files:** Create: `src/pages/Compras.tsx`

**Spec (RF-COM-01..04):** H1 "Panel de compras". Filtros píldora por estado: Todos | Solicitado | Cotizado | Comprado | Instalado. Tabla ordenada por urgencia (la trae ya ordenada `getColaCompras`): pieza, destino (link a ficha), `Badge origen` (Yonke naranja / Compra neutro), donante si Yonke, `Badge urgencia`, costo (derecha, con badge "Estimado" si `es_estimado`; "$ por definir" si null), `Badge estadoReq` (Solicitado neutro / Cotizado ámbar / Comprado **azul** / Instalado verde), y columna Acción con el siguiente paso legal: Compra: Solicitado→[Cotizar] · Cotizado→[Registrar compra] (abre `Modal` con campos costo_real y numero_factura obligatorios) · Comprado→[Confirmar instalación] (Modal de confirmación); Yonke: Solicitado→[Confirmar instalación] (Modal: "La pieza Turbo (donante WH03) se instalará en WH125 con costo estimado $4,500" — RF-COM-03). Tras cada acción: refetch + toast. Errores 409/422 → toast variante error con `ApiError.message`. Estados loading/empty/error de Tabla.

- [ ] **Step 1:** test RTL: fila Yonke Solicitado ofrece "Confirmar instalación" y al confirmar el badge pasa a "Instalado"; fila Compra Cotizado exige factura en el modal.
- [ ] **Step 2:** implementar. **Step 3:** verificar. **Step 4: Commit** `feat(demo): panel de compras con ciclo de estados y distinción estimado/real`

---

### Task 11: Catálogo de Unidades + Usuarios y Permisos

**Files:** Create: `src/pages/Catalogo.tsx`, `src/pages/Usuarios.tsx`

**Spec Catálogo (RF-UNI-01/04/05):** H1 "Catálogo de unidades"; filtros píldora Todos | Activo | Yonke | Inactivo; Tabla: id_unidad (font-display bold), tipo, `Badge estadoUnidad`, valor de referencia (derecha, "—" si null), costo real acumulado (derecha), chip "candidata reincidencia" si aplica; fila clickeable → `/ficha/:id_unidad`. Escenario vacío → EstadoVacio "Aún no hay unidades en esta vista" con camión de firma.

**Spec Usuarios (RF-USR-01..03, solo admin):** H1 "Usuarios y permisos"; Tabla: `Avatar` + nombre, email, Select inline de rol (admin/taller/compras/diesel → `actualizarUsuario`), toggle Activo/Suspendido (avatar a opacidad 0.45 si suspendido, badge "Suspendido" neutro), y botón primario "+ Agregar usuario" (Modal con nombre/email/rol → `crearUsuario`). Cambios → toast.

- [ ] **Step 1:** test RTL: filtro Yonke deja solo WH03 y WH60; suspender a Kevin muestra badge "Suspendido".
- [ ] **Step 2:** implementar ambas páginas. **Step 3:** verificar. **Step 4: Commit** `feat(demo): catálogo con filtros y administración de usuarios`

---

### Task 12: Tour de onboarding, selector de escenarios y pase de accesibilidad

**Files:**
- Create: `src/components/Tour.tsx`, `src/components/SelectorEscenario.tsx`
- Modify: `AppLayout.tsx` (montar ambos), páginas (atributos `data-tour`)

**Spec Tour (RF-AUTH-04):** overlay `fixed inset-0` con recorte resaltado sobre el elemento `[data-tour]` del paso (posición vía `getBoundingClientRect`), tarjeta con título/texto, "Paso N de M", botones "Siguiente" (primario) / "Saltar" (outline); pasos según rol (admin 5 pasos: nav, KPIs, barras, veredicto, parámetros; taller 3: destino, origen Yonke, foto; compras 3: filtros, badge origen, acción). Se dispara en el primer ingreso por rol — clave `localStorage` `wh-tour-visto-<rol>`; re-lanzable con el botón "Tutorial" del nav; trap de foco y `Escape` para salir devolviendo el foco.

**Spec SelectorEscenario (doc 09 §5.2):** widget flotante discreto abajo-derecha (solo demo): select Normal / Lista vacía / Error de red → `setEscenario` + evento para refetch (simple: `location.reload()` no — usar estado global ligero: un `EventTarget` exportado de scenarios.ts que las páginas escuchan para refetch, o más simple: el selector fuerza `navigate(0)`... **decisión:** guardar escenario en `sessionStorage` y `window.location.reload()`; scenarios.ts lee `sessionStorage` al inicializar — simple y suficiente para demo).

**Pase de accesibilidad (doc 09 §6):** revisar y corregir en todas las páginas: un solo H1 por vista; orden de tabulación nav→contenido→acciones; foco visible en todo interactivo; `aria-label` en gráficas y botones de ícono; badges siempre con texto; `prefers-reduced-motion` ya cubierto en tokens.css.

- [ ] **Step 1:** test RTL: con localStorage limpio el tour aparece tras login admin; "Saltar" lo cierra y no reaparece; botón "Tutorial" lo relanza.
- [ ] **Step 2:** implementar. **Step 3:** verificar tests + typecheck + lint. **Step 4: Commit** `feat(demo): tour de onboarding, selector de escenarios y pase A11y`

---

### Task 13: Verificación final y Definición de Hecho

- [ ] **Step 1:** `npm run test && npm run typecheck && npm run lint && npm run build` — todo verde.
- [ ] **Step 2:** levantar `npm run dev`, recorrer con navegador (screenshots) el guion de validación del doc 09 §9: login Dirección→Dashboard (veredicto WH125 visible), barra crítica→ficha (86 días), login Taller→requisición Yonke completa, login Compras→ciclo hasta Instalado, catálogo filtro Yonke, tour. Verificar responsive (viewport 375px: login apilado, nav hamburguesa, requisición una columna).
- [ ] **Step 3:** cotejar la checklist DoD del doc 09 §12 punto por punto y reportar estado (los dos últimos puntos — sesión de validación con stakeholder y re-sync SRS/API — quedan para el usuario).
- [ ] **Step 4:** actualizar `demo-ux/app/README.md` si algún comando difiere. Commit final `chore(demo): verificación DoD Sprint D`.

## Self-review

- **Cobertura de spec:** 7 pantallas §2 → Tasks 6–11; estados por componente §4 → Task 4 (Tabla/KpiCard/Campo/Toast/Modal); capa mock §5 + escenarios §5.2 → Task 2 y 12; WCAG §6 → transversal + Task 12; responsive §7 → Tasks 5/6/9/13; microinteracciones §8 → tokens.css + Task 4/7; tour RF-AUTH-04 → Task 12; máquina de estados §4.2 SRS → Task 2/10; veredicto configurable RF-DASH-05 → Task 7.
- **Consistencia de firmas:** las páginas consumen exactamente `api.ts` de Task 2 y las props de Task 4/7 según se declaran en cada bloque *Interfaces*.
- **Fuera de alcance (fiel al doc 09):** sin pantalla Diésel, sin persistencia, sin subida real de foto, sin backend.
