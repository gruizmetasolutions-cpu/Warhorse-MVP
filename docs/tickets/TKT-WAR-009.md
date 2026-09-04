# Ticket: [TKT-WAR-009] Bandeja de Alertas de Patio e Inspecciones con Warnings en Cola de Taller

**Autor / Rama**: TAVO-REVIEW7-21
**Módulos Afectados**: [Taller / Mantenimiento | TallerOrdenes | TallerNuevaOT | Alertas de Patio]
**Tipo de Cambio**: [Feature UI | Flujo Operativo Taller | Trazabilidad Inspección-OT]

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: NO
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración CodeIgniter 4?**: NO
- [x] **Detalle de cambios DDL**: Ninguno. El enlace entre inspecciones físicas de patio y la cola de trabajo de taller se realiza consumiendo el repositorio local de inspecciones y la API existente de `registros_taller` / `ordenes_trabajo`.

### 2. IMPACTO EN BACKEND (API CI4)
- **Endpoints Nuevos / Modificados**: Ninguno. Mantiene compatibilidad total con:
  - `GET /api/v1/taller`
  - `POST /api/v1/taller/ingreso`
  - `GET /api/v1/unidades`
- **Políticas Shield**: Mantiene permisos de rol `taller` y `admin`.
- **Compatibilidad con Contrato Existente (`doc 05`)**: 100% compatible.

### 3. IMPACTO EN FRONTEND (REACT SPA)
- **Problema Detectado**:
  Actualmente, el Jefe de Taller solo ve la tabla de OTs previamente creadas en `TallerOrdenes.tsx`. Cuando un operador reporta en patio una unidad con *Warning Menor* o *Falla Crítica*, no existe ninguna bandeja, alerta visual o tabla en el módulo de taller donde el mecánico pueda revisar dichas anomalías, auditar la evidencia fotográfica y abrir la OT correspondiente.
- **Solución Propuesta**:
  1. `apps/web/src/pages/taller/TallerOrdenes.tsx`:
     - **Pestañas de Vista**:
       * Pestaña 1: **"Órdenes de Trabajo Activas ({conteo})"** (la tabla de OTs actual).
       * Pestaña 2: **"Bandeja de Alertas de Patio ({conteo})"** (Inspecciones con fallas pendientes de OT).
     - **Widget / Alerta Superior Industrial**:
       * Si existen inspecciones recientes de patio con fallas críticas o warnings que aún no tienen OT, desplegar un banner de alerta con llamado a la acción: *"Se detectaron X unidades con alertas en patio esperando atención"*.
     - **Tabla / Tarjetas de Alertas de Patio**:
       * Folio de Inspección (ej. `INS-2026-00102`).
       * Unidad y Tipo (ej. `WH-104 · Tractor`).
       * Operador que reportó la falla.
       * Severidad: `🚨 Falla Crítica (Paro de Unidad)` o `⚠️ Warning Menor`.
       * Lista de componentes en falla con la observación exacta del chofer.
       * Miniatura de evidencia fotográfica si existe.
       * Acciones:
         - **`[Generar OT Correctiva]`**: Redirige a `/taller/ingreso` con los datos precargados (unidad, severidad, diagnóstico derivado de la falla).
         - **`[Ver Hoja de Inspección]`**: Abre el modal oficial de la inspección con firma del chofer.
  2. `apps/web/src/pages/taller/TallerNuevaOT.tsx`:
     - Aceptar parámetros vía query string / estado (`?unidad=WH-104&origen=inspeccion&folio=INS-2026-00102&falla=...`) para precargar automáticamente la unidad y el diagnóstico al abrir una OT desde la alerta de patio.

### 4. CHECKLIST PREVIO A PULL REQUEST
- [x] Pestaña y banner de Alertas de Inspección implementados en `TallerOrdenes.tsx`.
- [x] Conexión fluida entre la alerta de patio y la creación de la OT en `TallerNuevaOT.tsx`.
- [x] Visualización de la hoja de inspección oficial desde el taller.
- [x] Corrección de payload `categoria` y sembrado de catálogo maestro de responsables de taller para eliminar error HTTP 422.
- [x] Verificación de TypeScript (`npm run typecheck`) con 0 errores.
- [x] Pruebas E2E completas en navegador: Chofer reporta falla en patio -> Taller recibe alerta -> Genera OT Correctiva (OT-00001) -> Alerta queda atendida con badge verde.

