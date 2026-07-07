# ADR-003 — Demo-First: el demo UI/UX es esqueleto reutilizable, no prototipo desechable

| | |
|---|---|
| **Estado** | Aceptado |
| **Fecha** | 7 de julio de 2026 |
| **Reemplaza** | — |
| **Depende de** | [ADR-001](ADR-001_stack-react-vite-ci4-api.md) |

## 1. Contexto

El estándar de ingeniería v1 de Plan Juárez es backend-first: se documenta 01→08 y luego se construye, con la UI repartida dentro de los sprints de negocio. La consecuencia observada en proyectos previos (Sistema MEL, Portal BQS) es que los flujos se validan tarde, los contratos de API se diseñan en abstracto y cambian al implementar el front, y el design system queda como paso decorativo final.

En Warhorse ya existe un **demo UI/UX de alta fidelidad construido y validado** con el cliente (las 7 vistas: login, dashboard, ficha, requisición, compras, catálogo, usuarios). No tiene sentido desecharlo. La metodología Demo-First v2.0 formaliza aprovecharlo como inversión.

## 2. Decisión

Se adopta el principio **design-led, prototype-first**: el demo no es maqueta tirable, es el **esqueleto del frontend de producción**. Se construye/porta con el stack real (React 19 + Vite + Tailwind 4 + tokens del doc 08), alimentado con datos mock **detrás de la misma interfaz de cliente** (`lib/api.ts`) que luego consumirá la API real.

- El demo vive en `demo-ux/app/`.
- Toda la data del demo pasa por `lib/mock/`, que implementa la firma de `lib/api.ts`.
- Cuando el backend arranca (Sprint 0 crea el monorepo), `demo-ux/app/` se **promueve** a `apps/web/`: se mueve, no se reescribe, y se sustituye `lib/mock/` por la implementación real de `lib/api.ts`.
- El contrato de `lib/api.ts` **congela** la API (doc 05).

## 3. Reconciliación con el "principio de orden seguro"

El demo usa **exclusivamente datos simulados y no persiste nada**: cero captura de PII real, cero backend, cero superficie de ataque. La regla "no se capturan datos reales sin auth/RBAC en su lugar" se mantiene intacta. El demo es una capa de validación de experiencia, anterior y ortogonal a la seguridad de producción. Por eso en el roadmap ([07](../../07-roadmap/07_roadmap_sprints.md)) el **Sprint D (Demo)** va después de los cimientos (Sprint 0) y antes de Auth/RBAC (Sprint 1): el Sprint 1 ya no construye UI desde cero, solo le conecta seguridad real.

## 4. Consecuencias

**Positivas**
- Retrabajo de frontend mínimo: el esqueleto validado sobrevive a producción.
- La API se diseña contra pantallas reales que la ejercitan; el contrato se congela con evidencia, no en abstracto.
- El design system (doc 08) deja de ser decorativo: es el insumo directo del demo.

**Negativas / trade-offs aceptados**
- Disciplina obligatoria: está **prohibido** cablear datos reales o llamadas a backend dentro del demo; toda la data pasa por `lib/mock/` detrás de `lib/api.ts`. Romper esto rompe la promoción sin retrabajo.

**Neutrales**
- El bloque documental 01–08 no cambia de estructura; solo se añade el doc 09.

## 5. Impacto en documentos existentes

- **README / CLAUDE:** entrada `demo-ux/` en el índice; regla del demo en CLAUDE.
- **05 API:** pasa de borrador a congelado tras validar el demo; la firma de `lib/api.ts` es el contrato.
- **07 Roadmap:** inserta Sprint D entre cimientos y auth.
- **09 Demo-UX:** nuevo documento con inventario de pantallas trazado al SRS y capa mock.

## 6. Implicaciones de seguridad

- El demo no introduce superficie de ataque (sin backend, sin PII, sin persistencia).
- Al promover a `apps/web`, la seguridad se añade en Sprint 1 (Auth+RBAC) sobre el esqueleto; el demo nunca debe contener secretos ni endpoints reales.
