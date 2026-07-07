# Demo UI/UX — Warhorse (esqueleto → apps/web)

Prototipo navegable de alta fidelidad del Hub de Gastos por Tracto. Portación del demo validado (`Hub Gastos Tracto - Standalone.html`) al stack de producción. **Datos simulados, sin backend, sin PII** ([ADR-003](../../02-arquitectura/ADR/ADR-003_demo-first-esqueleto-reutilizable.md)).

## Stack
React 19 · Vite 6 · TypeScript · Tailwind CSS 4 · React Router. Datos mock detrás de `src/lib/api.ts`.

## Correr
```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # tsc --noEmit
npm run lint
npm run test       # Vitest + React Testing Library (41 pruebas)
npm run build
```

## Regla de oro (Demo-First)
Los componentes importan **solo** `src/lib/api.ts`. La implementación mock vive en `src/lib/mock/`. Al arrancar el backend, esta carpeta se promueve a `apps/web/` y `lib/mock/` se sustituye por la implementación real de `lib/api.ts` — sin reescribir pantallas ni componentes.

## Estructura y especificación
Ver [09_demo_ux_guia.md](../09_demo_ux_guia.md) (inventario de pantallas, mapa de navegación, capa mock, fixtures, WCAG, Definición de Hecho) y el [Design System 08](../../01-vision/08_identidad_visual_design_system.md) (tokens, componentes, config Tailwind).

## Estado
**Implementado (Sprint D) como portación 1:1 del demo validado.** El código replica pantalla por pantalla `Hub Gastos Tracto - Standalone.html` (importado del proyecto de Claude Design; la fuente de referencia vive en `../original/`): mismas vistas, datos mock, estilos, tour de 10 pasos, tooltips "?", matriz de permisos por rol y confirmación de instalación. Suite: 10 pruebas de flujo (Vitest + RTL) + typecheck + lint + build en verde. Pendiente del DoD (doc 09 §12): sesión de validación con stakeholder, bitácora de hallazgos y re-sincronización SRS/API.
