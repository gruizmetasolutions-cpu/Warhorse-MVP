# ADR-001 — Stack: React 19 + Vite sobre API REST CodeIgniter 4 + MySQL

| | |
|---|---|
| **Estado** | Aceptado |
| **Fecha** | 7 de julio de 2026 |
| **Reemplaza** | El stack HTML+Alpine.js monolítico de los archivos FRAGA (SOW, Runbook) y la línea Google Workspace de la presentación al cliente. |
| **Depende de** | — |

## 1. Contexto

La especificación funcional v2.0 (§10) documenta una contradicción no resuelta de infraestructura:

- La **presentación al cliente** (Fleet Intelligence Hub PDF) insinuaba un enfoque tipo Google Workspace.
- Los **archivos técnicos internos** (FRAGA SOW, Runbook Antigravity) especifican CodeIgniter 4 + HTML estático + Alpine.js + MySQL sobre hosting compartido (Site5/cPanel).

Además, la metodología de ingeniería de Plan Juárez adoptó la variante **Demo-First v2.0**, donde el demo UI/UX se construye con el stack real de producción y se promueve a `apps/web` sin retrabajo. El demo ya construido y validado es una SPA con componentes, estado y ruteo — un patrón que Alpine.js sobre páginas HTML estáticas modela mal a esta escala (5 vistas con estado compartido, RBAC de navegación, tablas filtrables, formularios dinámicos y un dashboard con gráficas).

El estado anterior es insuficiente porque: (a) mezcla dos visiones incompatibles de infraestructura; (b) Alpine.js no escala a la complejidad de estado del demo validado; (c) Google Workspace no permite el control de seguridad server-side (RBAC, IDOR, transacciones ACID) que el sistema exige por manejar datos financieros de la flota.

## 2. Decisión

Se adopta una arquitectura **cliente-servidor desacoplada**: SPA React que consume una API REST de CodeIgniter 4 con MySQL.

| Capa | Antes (FRAGA / Workspace) | Ahora (decidido) |
|---|---|---|
| Presentación | HTML estático + Alpine.js / Google Sheets | React 19 + TypeScript + Vite 6 |
| Estilos | Tailwind (por CDN) | Tailwind CSS 4 (build) |
| Ruteo | Navegación por estado / hojas | React Router 7 |
| Datos remotos | `fetch` disperso | TanStack Query 5 sobre `lib/api.ts` |
| Backend | CI4 monolítico (vistas server-side) / — | CI4 4.7 como **API REST pura** (PHP 8.2+) |
| Auth | Sesión PHP / cuentas Google | CI4 Shield: token de acceso HMAC + sesión |
| Base de datos | MySQL / Sheets | MySQL 8 |
| Hosting | Site5 shared cPanel | VPS Linux (Nginx + PHP-FPM) |

## 3. Mapeo de conceptos (Alpine/monolito → React + API)

| Concepto anterior | Equivalente nuevo |
|---|---|
| `x-data` con estado local | `useState` / `useReducer` en componente; estado remoto en TanStack Query |
| `x-show` / `x-if` | Renderizado condicional JSX |
| `x-for` | `.map()` con `key` estable |
| Vista Blade server-side | Componente React + endpoint JSON |
| Redirección server-side post-login | React Router + guardia de ruta por rol |
| Lógica en la vista (Alpine) | Lógica de negocio en `Service` del backend; el componente solo presenta |
| `fetch` manual | Hook de `lib/api.ts` cacheado por TanStack Query |

## 4. Consecuencias

**Positivas**
- El demo validado se promueve a producción sin reescritura (Demo-First, [ADR-003](ADR-003_demo-first-esqueleto-reutilizable.md)).
- Separación limpia de responsabilidades: toda la seguridad y la lógica de rentabilidad viven server-side, verificables y testeables de forma aislada.
- TypeScript end-to-end en el front reduce errores de contrato; el contrato JSON se congela con el demo.
- El VPS con Nginx/PHP-FPM permite hardening real, colas y almacenamiento de fotos fuera del webroot.

**Negativas / trade-offs aceptados**
- Dos artefactos desplegables (SPA + API) en vez de uno; el deploy es más complejo que un FTP a cPanel.
- Se abandona la simplicidad del hosting compartido; se requiere un VPS administrado.
- Curva de mantenimiento mayor (build de front, worker de colas) frente al monolito Alpine.

**Neutrales**
- MySQL y CodeIgniter 4 se conservan de la propuesta FRAGA; solo cambia el rol de CI4 (de monolito con vistas a API pura) y la capa de presentación.

## 5. Impacto en documentos existentes

- **README / CLAUDE:** tabla de stack y comandos reflejan React+Vite+CI4-API.
- **02 Arquitectura:** estilo cliente-servidor desacoplado; diagrama de capas con frontera HTTP.
- **04 Seguridad:** el modelo de auth pasa a token Shield + CORS; el frontend deja de ser confiable.
- **05 API:** se vuelve el contrato central (antes implícito en vistas server-side).
- **08 Design System / 09 Demo:** el demo se implementa en React 19 + Tailwind 4.

## 6. Implicaciones de seguridad

- La superficie de ataque se mueve a la API: **cada endpoint** debe re-verificar auth, rol y propiedad (el cliente deja de ser confiable por completo).
- Aparece la necesidad de **CORS** estricto (origen del front) y de manejo seguro del token en el navegador (memoria + `httpOnly` refresh donde aplique).
- Desaparece el riesgo de mezclar presentación y datos server-side (XSS por render de Blade con datos sucios) pero aparece el de XSS en React (mitigado: sin `dangerouslySetInnerHTML` salvo con DOMPurify).
- El almacenamiento de fotos fuera del webroot elimina la ejecución de archivos subidos.

## 7. Plan de migración

No hay sistema legado en producción. La "migración" es de artefactos de diseño a producción:

1. Sprint 0 crea el monorepo `apps/web` + `apps/api`.
2. `demo-ux/app/` se mueve a `apps/web/` (Demo-First).
3. Se implementa `lib/api.ts` real (sustituye `lib/mock/`).
4. Se levanta CI4 como API con Shield, migraciones y seeders.
5. El contrato del demo (firma de `lib/api.ts`) queda como especificación del doc 05.
