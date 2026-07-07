# Warhorse — Hub Consolidador de Gastos por Tracto

| | |
|---|---|
| **Proyecto** | Warhorse (Hub Consolidador de Gastos por Tracto) |
| **Organización** | WarHorse México · Dataholics (Ciudad Juárez) |
| **Estado** | Documentación técnica v2.0 — demo UI/UX validado, backend por iniciar |
| **Versión de documentación** | 2.0 |
| **Fecha** | 7 de julio de 2026 |
| **Autor técnico** | Ingeniería Plan Juárez / Dataholics |

> **Aviso de stack (cambio respecto a los archivos técnicos internos previos).**
> Los archivos FRAGA (SOW, Runbook) proponían un frontend HTML + Alpine.js sobre CodeIgniter 4 monolítico, y la presentación al cliente sugería Google Workspace. Ambas líneas quedan **superadas**. El stack fijado es **React 19 + Vite (frontend SPA) sobre una API REST de CodeIgniter 4 + MySQL**. La justificación completa y el mapeo de conceptos están en [ADR-001](02-arquitectura/ADR/ADR-001_stack-react-vite-ci4-api.md).

---

## Qué es este sistema

WarHorse opera una flotilla de tractocamiones. Hoy el gasto de mantener cada unidad vive fragmentado en tres áreas desconectadas —combustible, compras de refacciones y taller— que trabajan en Excel y WhatsApp. Nadie puede sumar, por unidad, cuánto ha costado realmente mantenerla en ruta. Esa ceguera financiera impide decidir con datos si conviene conservar o dar de baja una unidad.

Warhorse consolida **todo el gasto por unidad bajo una sola llave: el ID del Tracto**, y expone un veredicto de rentabilidad por unidad que responde la pregunta que define el proyecto:

> **"¿Vale la pena meterle más lana a este tracto?"**

La fórmula central del sistema:

```
Costo Real Acumulado (por Tracto) =
    Gasto Diésel
  + Costo de Refacciones (compradas + canibalizadas de Yonke con costo estimado)
  + Costo de Taller (mano de obra / servicio externo)
```

Todo agrupado por `id_unidad`. Cada módulo del sistema existe para alimentar uno de esos términos o para exponer su resultado.

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend (SPA) | React | 19.x |
| Bundler / dev server | Vite | 6.x |
| Lenguaje frontend | TypeScript | 5.x |
| Estilos | Tailwind CSS | 4.x |
| Ruteo | React Router | 7.x |
| Estado servidor / caché | TanStack Query | 5.x |
| Backend (API REST) | CodeIgniter 4 (PHP) | 4.7.x / PHP 8.2+ |
| Base de datos | MySQL | 8.0 |
| Autenticación | CI4 Shield (tokens de acceso HMAC + sesión) | — |
| Colas / asíncrono | CodeIgniter Queue + base de datos | — |
| Almacenamiento de fotos | Sistema de archivos del servidor (fuera del webroot) | — |
| Hosting | VPS Linux (Nginx + PHP-FPM) | — |

Arquitectura de **cliente-servidor desacoplado**: el frontend React es una SPA estática servida por Nginx; toda la lógica de negocio, autorización y persistencia vive en la API de CodeIgniter 4. **MySQL es la única fuente de verdad**; el frontend nunca decide reglas de seguridad ni cálculos de rentabilidad, solo los presenta. La frontera entre servicios es el contrato HTTP/JSON documentado en [05_especificacion_api](05-api/05_especificacion_api.md), congelado por el demo UI/UX.

---

## Código fuente y arranque

El prototipo validado (demo UI/UX) vive en [`demo-ux/app/`](demo-ux/) y es el esqueleto que se promueve a `apps/web/` cuando arranca el backend. La guía operativa completa para el agente de IA o el desarrollador que trabaje en el repositorio está en [CLAUDE.md](CLAUDE.md) — **es la primera lectura obligatoria antes de tocar código**.

---

## Índice de documentación

| # | Documento | Contenido |
|---|---|---|
| — | [README.md](README.md) | Este archivo: panorama, stack, índice, decisiones clave. |
| — | [CLAUDE.md](CLAUDE.md) | Guía operativa condensada para el agente de IA: reglas no negociables, capas, comandos, identidad visual. |
| ADR-001 | [ADR-001_stack-react-vite-ci4-api](02-arquitectura/ADR/ADR-001_stack-react-vite-ci4-api.md) | Decisión del stack: React 19 + Vite sobre API CI4 + MySQL; resuelve la contradicción Google Workspace vs. CI4. |
| ADR-002 | [ADR-002_valorizacion-yonke-cascada](02-arquitectura/ADR/ADR-002_valorizacion-yonke-cascada.md) | Función de valorización en cascada (última compra → catálogo → manual) para piezas canibalizadas. |
| ADR-003 | [ADR-003_demo-first-esqueleto-reutilizable](02-arquitectura/ADR/ADR-003_demo-first-esqueleto-reutilizable.md) | Metodología Demo-First: el demo es esqueleto reutilizable → `apps/web`, no prototipo desechable. |
| 01 | [01_SRS_especificacion_requisitos](01-vision/01_SRS_especificacion_requisitos.md) | Requisitos funcionales por módulo, máquinas de estado, RNF, criterios de aceptación del MVP. |
| 02 | [02_arquitectura_sistema](02-arquitectura/02_arquitectura_sistema.md) | Principios, estilo arquitectónico, diagrama de capas, flujos de datos críticos, patrones, despliegue. |
| 03 | [03_modelo_de_datos](03-datos/03_modelo_de_datos.md) | ERD, diccionario de datos y DDL MySQL completo listo para ejecutar. |
| 04 | [04_plan_de_seguridad](04-seguridad/04_plan_de_seguridad.md) | OWASP Top 10 con controles y código real, RBAC, cifrado, LFPDPPP, hardening. |
| 05 | [05_especificacion_api](05-api/05_especificacion_api.md) | Contrato HTTP/JSON: convenciones, auth, endpoints por recurso. |
| 06 | [06_plan_de_pruebas](06-pruebas/06_plan_de_pruebas.md) | Estrategia, casos por módulo, matriz exhaustiva de estados, casos de seguridad, trazabilidad. |
| 07 | [07_roadmap_sprints](07-roadmap/07_roadmap_sprints.md) | Roadmap de orden seguro: cimientos → demo → auth → módulos → hardening → lanzamiento. |
| 08 | [08_identidad_visual_design_system](01-vision/08_identidad_visual_design_system.md) | Tokens de color y tipografía, componentes, CSS y config Tailwind, accesibilidad. |
| 09 | [09_demo_ux_guia](demo-ux/09_demo_ux_guia.md) | Inventario de pantallas trazado al SRS, mapa de navegación, capa mock, fixtures, WCAG. |

---

## Decisiones clave del MVP

| Tema | Decisión |
|---|---|
| Llave maestra | Todo gasto (diésel, refacción, taller) se vincula obligatoriamente a un `id_unidad` válido. No hay transacciones huérfanas. |
| Stack | React 19 + Vite sobre API REST CodeIgniter 4 + MySQL. Cliente-servidor desacoplado. ([ADR-001](02-arquitectura/ADR/ADR-001_stack-react-vite-ci4-api.md)) |
| Fuente de verdad | MySQL. El frontend solo presenta; nunca calcula rentabilidad ni decide autorización. |
| Valorización Yonke | Cascada de tres niveles: última compra → catálogo → captura manual. Nunca $0. ([ADR-002](02-arquitectura/ADR/ADR-002_valorizacion-yonke-cascada.md)) |
| Distinción estimado vs. real | Un costo estimado (Yonke) jamás se muestra como un costo facturado (Compra). Cada estimado guarda su origen. |
| Foto obligatoria | Ninguna requisición de refacción se crea sin foto de la pieza/etiqueta. |
| Veredicto configurable | Umbral (%) y ventana de tiempo (meses) del veredicto vender/mantener los ajusta Dirección en runtime, no están fijos en código. |
| Roles | Cuatro roles: Taller (Fraga/Kevin comparten rol), Compras (Montzay), Diésel (Greisy), Dirección (solo lectura + parámetros + catálogo). |
| Diésel en alcance | Se conserva: es el mayor gasto operativo y la base del KPI de eficiencia (costo/km). |
| Demo primero | El demo UI/UX se construye y valida antes del backend, y se promueve a `apps/web`. ([ADR-003](02-arquitectura/ADR/ADR-003_demo-first-esqueleto-reutilizable.md)) |

---

## Cómo leer esta documentación

1. **Empieza aquí** (README) para el panorama, y luego [CLAUDE.md](CLAUDE.md) para las reglas operativas no negociables.
2. Lee los **ADR** (001, 002, 003) para entender por qué el sistema es como es antes de ver el detalle.
3. Lee el **SRS** ([01](01-vision/01_SRS_especificacion_requisitos.md)) para el qué: requisitos, roles y máquinas de estado.
4. Estudia **Arquitectura** ([02](02-arquitectura/02_arquitectura_sistema.md)), **Modelo de datos** ([03](03-datos/03_modelo_de_datos.md)) y **Seguridad** ([04](04-seguridad/04_plan_de_seguridad.md)) para el cómo.
5. **Ve el demo antes de implementar:** revisa [09_demo_ux_guia](demo-ux/09_demo_ux_guia.md) y el [Design System 08](01-vision/08_identidad_visual_design_system.md) — la UI ya está validada; la API ([05](05-api/05_especificacion_api.md)) queda congelada por ese demo. Luego sigue el [Roadmap 07](07-roadmap/07_roadmap_sprints.md).
