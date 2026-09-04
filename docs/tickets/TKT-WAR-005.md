# Ticket: [TKT-WAR-005] Dashboard Ejecutivo, Backbone Administrativo y Reportes Maestros de Flota y Costos

**Autor / Rama**: TAVO-REVIEW7-21  
**Módulos Afectados**: [Administración | Dashboard Ejecutivo | Salud de Flota | Reporte de Costos TCO | Formato Oficial Reporte]  
**Tipo de Cambio**: [Feature UI / Backbone de Inteligencia y Consolidación]  

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: NO
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO (Sin riesgo de afectación)
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración CodeIgniter 4?**: NO
- **Detalle de cambios DDL**: Ninguno. Se consolidan las tablas `unidades` (con `valor_referencia` y `costo_real_acumulado`), `ordenes_trabajo`, `registros_taller` y `compras` para calcular en tiempo real los 5 estados de salud y los indicadores de TCO.

---

### 2. IMPACTO EN BACKEND (API CI4)
- **Endpoints Existentes Utilizados**:
  - `GET /api/v1/dashboard`: Métricas generales del sistema.
  - `GET /api/v1/unidades`: Catálogo de flota con estados y costos acumulados.
  - `GET /api/v1/metricas/salud`: Cálculo de salud e integridad de datos.
  - `GET /api/v1/taller/reparaciones`: Historial de intervenciones mecánicas.
  - `GET /api/v1/compras/requisiciones`: Inversiones de compras por unidad.
- **Controladores / Políticas Shield**: Protegido por filtro RBAC para roles `admin` y directivos.
- **Servicios de Dominio / Eventos / Auditoría**: Totalmente compatible con la auditoría de CI4 Shield.

---

### 3. IMPACTO EN FRONTEND (REACT SPA)
- **Componentes y Vistas Afectadas**:
  - `apps/web/src/pages/admin/AdminDashboard.tsx`: Dashboard ejecutivo de alta densidad con:
    - Semáforo de los 5 estados de salud de flota (Activo 100%, Warning, Reparación, Yonke, Baja Definitiva).
    - Matriz de Costo Acumulado vs Valor de Referencia (TCO).
    - Indicador de alerta de unidades candidatas a Yonke (reincidencia / sobrecosto >= 70%).
  - `apps/web/src/pages/admin/AdminReportes.tsx`: Centro de inteligencia y generación de reportes maestros de flota, mantenimiento y costos de abasto.
  - `apps/web/src/components/admin/ReporteEjecutivoModal.tsx`: Formato oficial de **Reporte Ejecutivo de Flota y Costos** con folio correlativo (`REP-YYYY-XXXXX`), semáforo de disponibilidad, desglose por tracto y exportación a PDF vía `jspdf`.
- **Consumo de API (`apps/web/src/lib/api.ts`)**: Consumo de contratos oficiales de dashboard y unidades.
- **Manejo de Estado**: Zustand y React Query.

---

### 4. CHECKLIST PREVIO A PULL REQUEST
- [x] Código verificado en local con Laragon (`warhorse_db`).
- [x] Cero llamadas residuales o URLs duras a servidores externos o IPs locales.
- [x] Sin romper tipado TypeScript (`npm run typecheck` completado con 0 errores).
- [x] Sin errores de linter en nuevos componentes (`apps/web/src/pages/admin/`, `apps/web/src/components/admin/`).
- [x] Resumen claro redactado para el dueño del repositorio original.

