# apps/web — Warhorse SPA (producción)

Frontend de producción del Hub de Gastos por Tracto. **Promoción del demo validado**
(`WarhorseDocs/demo-ux/app/`, ADR-003): misma estética y flujos; `lib/mock/` se
sustituye sprint a sprint por `lib/api.ts` real contra la API CI4 (`apps/api`).

## Stack
React 19 · Vite 6 · TypeScript · Tailwind CSS 4 · React Router 7 · TanStack Query 5 · Vitest + RTL · Playwright.

## Correr
```bash
npm install
npm run dev        # http://localhost:5173 (proxy /api → apps/api)
npm run typecheck  # tsc --noEmit
npm run lint
npm run test       # Vitest + React Testing Library
npm run build
```

## Reglas
- Las vistas importan SOLO `src/lib/api.ts` (contrato doc 05). Nada de lógica de negocio en el cliente.
- Estética fiel al demo validado: helpers en `src/lib/estilos.ts`; pantallas nuevas (Diésel, Taller) siguen el mismo design system (doc 08).
- El rol y los permisos se leen de `GET /auth/me`; la UI oculta por rol como UX, la seguridad es server-side.
