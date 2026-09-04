# Ticket: [TKT-WAR-003] Wizard de Taller (Gestión de Órdenes de Trabajo - OTs) y Transición de Salud

**Autor / Rama**: TAVO-REVIEW7-21  
**Módulos Afectados**: [Taller | Órdenes de Trabajo | Salud de Flota | Liberaciones | Documento OT]  
**Tipo de Cambio**: [Feature UI / Motor de Estados Operativos]  

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: NO
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO (Sin riesgo de afectación)
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración CodeIgniter 4?**: NO
- **Detalle de cambios DDL**: Ninguno. Se aprovecha la estructura existente de `ordenes_trabajo` (con folios `OT-XXXXX`), `registros_taller` (con `tipo_liberacion` Total/Parcial y `pendientes` JSON), y `responsables_taller`.

---

### 2. IMPACTO EN BACKEND (API CI4)
- **Endpoints Existentes Utilizados**:
  - `GET /api/v1/taller/reparaciones`: Listado de OTs.
  - `POST /api/v1/taller/reparaciones`: Creación de OTs correctivas y preventivas.
  - `GET /api/v1/taller`: Cola de ingresos y reparaciones activas.
  - `POST /api/v1/taller`: Registro de nuevo ingreso.
  - `PATCH /api/v1/taller/{id}/liberar`: Liberación total o parcial (con pendientes).
  - `GET /api/v1/taller/responsables`: Catálogo de mecánicos asignados.
- **Controladores / Políticas Shield**: Protegido por filtro RBAC para roles `taller` y `admin`.
- **Servicios de Dominio / Eventos / Auditoría**: Conserva el cálculo automático de costos y sincronización con el veredicto de la unidad.

---

### 3. IMPACTO EN FRONTEND (REACT SPA)
- **Componentes y Vistas Afectadas**:
  - `apps/web/src/pages/taller/TallerOrdenes.tsx`: Cola de trabajo densa con tipografía *Barlow Condensed*, filtros por estado (Activa, En Proceso, Liberada, Liberada Parcial) y tipo (Correctiva vs Preventiva).
  - `apps/web/src/pages/taller/TallerNuevaOT.tsx`: Wizard de creación de OT con bifurcación Correctiva (vinculada a alertas de patio) o Preventiva (para habilitar abasto de almacén).
  - `apps/web/src/pages/taller/TallerLiberacion.tsx`: Proceso guiado de conclusión de OT:
    - *Liberada Total*: Restaura unidad a "Activo al 100%".
    - *Liberada Parcial*: Permite salida con "Activo con Warning", documentando pendientes obligatorios y reteniendo el mismo ID para reanudación.
  - `apps/web/src/components/taller/OrdenTrabajoModal.tsx`: Formato oficial de **Orden de Trabajo de Taller** (Correctiva / Preventiva) con folio, diagnóstico, mecánico, refacciones y botón de descarga en PDF con `jspdf`.
- **Consumo de API (`apps/web/src/lib/api.ts`)**: Consumo 100% estricto de los contratos existentes de taller.
- **Manejo de Estado**: React Query y Zustand.

---

### 4. CHECKLIST PREVIO A PULL REQUEST
- [x] Código verificado en local con Laragon (`warhorse_db`).
- [x] Cero llamadas residuales o URLs duras a servidores externos o IPs locales.
- [x] Sin romper tipado TypeScript (`npm run typecheck` completado con 0 errores).
- [x] Sin errores de linter en nuevos componentes (`apps/web/src/pages/taller/`, `apps/web/src/components/taller/`).
- [x] Resumen claro redactado para el dueño del repositorio original.
