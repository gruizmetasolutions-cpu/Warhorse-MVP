# Ticket: [TKT-WAR-002] Wizard del Operador (Módulo de Patio) - Inspección Dinámica & Offline-First

**Autor / Rama**: TAVO-REVIEW7-21  
**Módulos Afectados**: [Patio | Operador | Inspección | Alertas Taller | IndexedDB]  
**Tipo de Cambio**: [Feature UI / Arquitectura Offline-First]  

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: NO
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO (Sin riesgo de afectación)
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración CodeIgniter 4?**: NO
- **Detalle de cambios DDL**: Ninguno en esta fase. Las inspecciones de patio se gestionan mediante una arquitectura local-first respaldada en IndexedDB (`inspecciones_patio_store`), y sus fallas se integran con los endpoints de alerta de taller (`/taller` e ingreso).

---

### 2. IMPACTO EN BACKEND (API CI4)
- **Endpoints Nuevos / Modificados**: Ninguno obligatorio para la captura offline. Cuando una inspección detecta fallas críticas, sincroniza mediante el endpoint existente `POST /api/v1/taller` para registrar el ingreso a taller o generar alerta preventiva.
- **Controladores / Políticas Shield**: Compatible con roles `operador` y `admin`.
- **Servicios de Dominio / Eventos / Auditoría**: Conserva la integridad de las alertas y trazabilidad.

---

### 3. IMPACTO EN FRONTEND (REACT SPA)
- **Componentes y Vistas Afectadas**:
  - `apps/web/src/lib/inspeccionStorage.ts`: Capa de persistencia local en IndexedDB (vía `idb-keyval`) para borradores y almacenamiento offline.
  - `apps/web/src/lib/inspeccionSchema.ts`: Contrato innegociable con Zod (validaciones dependientes obligatorias ante fallas mecánicas).
  - `apps/web/src/pages/patio/PatioInspeccion.tsx`: Wizard por pasos (1. Datos Generales & Precarga -> 2. Checklist por Sistemas -> 3. Evidencias & Firma -> 4. Emisión de Orden de Inspección).
  - `apps/web/src/components/patio/OrdenInspeccionModal.tsx`: Visualizador e impresor del documento oficial de Orden de Inspección.
  - `apps/web/src/pages/patio/PatioHistorial.tsx`: Tabla densa con lectura directa del repositorio local IndexedDB y estado de sincronización.
- **Consumo de API (`apps/web/src/lib/api.ts`)**: Consumo de catálogo de unidades y registro de ingresos a taller si hay fallas.
- **Manejo de Estado / Caché**: React Hook Form con `zodResolver`, Zustand y `idb-keyval`.

---

- [x] Código verificado en local con Laragon (`warhorse_db`).
- [x] Cero llamadas residuales o URLs duras a servidores externos o IPs locales.
- [x] Sin romper tipado TypeScript (`npm run typecheck` completado con 0 errores).
- [x] Sin errores de linter en nuevos componentes (`apps/web/src/pages/patio/`, `apps/web/src/components/patio/`, `apps/web/src/lib/inspeccion*`).
- [x] Resumen claro redactado para el dueño del repositorio original.
