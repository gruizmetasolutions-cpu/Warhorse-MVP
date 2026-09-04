# Ticket: [TKT-WAR-007] Optimización Ergonómica para iPad Pro 10" en Módulo de Patio (Cockpit Grid, Sticky Thumb Dock y Split Layout)

**Autor / Rama**: TAVO-REVIEW7-21
**Módulos Afectados**: [Patio / Operador | Kiosk Layout | Wizard de Inspección]
**Tipo de Cambio**: [Feature UI | Ergonomía Tablet | Optimización Visual iPad]

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: NO
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración CodeIgniter 4?**: NO
- [x] **Detalle de cambios DDL**: Ninguno. Modificaciones puramente en diseño responsivo, CSS Grid, breakpoints ergonómicos de iPad Pro (1112×834 px / 1080×810 px) y persistencia en cliente.

### 2. IMPACTO EN BACKEND (API CI4)
- **Endpoints Nuevos / Modificados**: Ninguno. Mantiene consumo de:
  - `POST /api/v1/auth/login`
  - `GET /api/v1/unidades`
- **Controladores / Políticas Shield**: Sin modificaciones, preservando el RBAC estricto de operador de patio.
- **Compatibilidad con Contrato Existente (`doc 05`)**: 100% compatible.

### 3. IMPACTO EN FRONTEND (REACT SPA)
- **Componentes y Vistas Afectadas**:
  1. `apps/web/src/components/patio/PatioKioskLayout.tsx`:
     - Sustitución de `max-w-5xl` por layout fluido `max-w-7xl` con gutters ergonómicos adaptados a resoluciones de 1080px a 1194px de iPad Pro.
     - Aprovechamiento de los 834px de altura vertical sin bandas muertas.
  2. `apps/web/src/pages/patio/PatioHome.tsx`:
     - Rediseño tipo "Cockpit de Maniobras": dos grandes tarjetas táctiles Hero de altura completa (`min-h-[400px]`).
     - Inclusión de widget en vivo con las últimas 3 inspecciones registradas hoy en patio en la tarjeta de Historial.
  3. `apps/web/src/pages/patio/PatioInspeccion.tsx`:
     - **Grilla de 2 columnas (`lg:grid-cols-2`)** para los 16 ítems mecánicos en Paso 2.
     - **Segmented Controls Táctiles (48px de alto)**: Botones táctiles amplios para el pulgar: Bueno (`#3FA65C`), Regular (`#C5A059`) y Crítico (`#F2620F`).
     - **Sticky Action Dock inferior:** Barra flotante fija con indicador de progreso y botones de avance `[<- Anterior]` y `[Siguiente ->]` anclados al pie de la pantalla para los pulgares del operador.
  4. `apps/web/src/pages/patio/PatioHistorial.tsx`:
     - Grilla táctil de alta densidad en 2 columnas con tarjetas de inspección expandidas y badges de estatus legibles sin scroll horizontal.

### 4. CHECKLIST PREVIO A PULL REQUEST
- [x] Sin errores de TypeScript (`npm run typecheck`).
- [x] Probado y validado en resolución iPad Pro (1112×834 en landscape).
- [x] Zonas de pulgar (*Thumb zones*) respetadas en los márgenes de la tableta.
- [x] Sin llamadas residuales ni alteración de contratos de API.
