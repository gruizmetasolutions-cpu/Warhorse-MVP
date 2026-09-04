# Ticket: [TKT-WAR-004] Wizard de Compras, Carrito de Adquisiciones y Gestión de Inventario Yonke

**Autor / Rama**: TAVO-REVIEW7-21  
**Módulos Afectados**: [Compras | Requisiciones | Órdenes de Compra | Almacén Yonke | Caja Chica | Validación OT]  
**Tipo de Cambio**: [Feature UI / Compuerta de Validación de Adquisiciones]  

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: NO
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO (Sin riesgo de afectación)
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración CodeIgniter 4?**: NO
- **Detalle de cambios DDL**: Ninguno. Se aprovecha la estructura existente de las tablas `compras` (con `orden_trabajo_id`, `es_caja_chica`, `categoria`, `proveedor`, `monto`) e `inventario_Yonke` (con `unidad_origen_id`, `nombre_pieza`, `estado_pieza`, `disponible`, `unidad_destino_id`).

---

### 2. IMPACTO EN BACKEND (API CI4)
- **Endpoints Existentes Utilizados**:
  - `GET /api/v1/compras`: Cola de compras y requisiciones.
  - `POST /api/v1/compras`: Registro de nuevas compras con validación de OT o Caja Chica.
  - `GET /api/v1/Yonke`: Inventario de piezas recuperadas de unidades desguazadas.
  - `POST /api/v1/Yonke`: Registro de piezas desmontadas de unidades Yonke.
  - `POST /api/v1/Yonke/{id}/asignar`: Reutilización de piezas a costo $0 para unidades activas.
  - `GET /api/v1/taller/reparaciones`: Catálogo de OTs activas/preventivas para la compuerta de validación.
- **Controladores / Políticas Shield**: Protegido por filtro RBAC para roles `compras` y `admin`.
- **Servicios de Dominio / Eventos / Auditoría**: Conserva la auditoría de compras y trazabilidad del costo por tracto.

---

### 3. IMPACTO EN FRONTEND (REACT SPA)
- **Componentes y Vistas Afectadas**:
  - `apps/web/src/pages/compras/ComprasCarrito.tsx`: Carrito reactivo de adquisiciones con compuerta de validación:
    - *Compra por Unidad*: Exige vincular obligatoriamente una OT Activa o En Proceso.
    - *Compra de Stock / Caja Chica*: Exige vincular OT Preventiva o marcar "Caja Chica" con justificación obligatoria.
  - `apps/web/src/pages/compras/ComprasCola.tsx`: Cola de requisiciones y órdenes de compra con KPIs y filtros por proveedor y estado.
  - `apps/web/src/pages/compras/ComprasYonke.tsx`: Catálogo visual del Almacén Yonke con piezas disponibles para reutilización inmediata (ahorro de compra a costo $0).
  - `apps/web/src/components/compras/RequisicionCompraModal.tsx`: Formato oficial de **Requisición de Compra** (Folio `REQ-YYYY-XXXXX`) con exportación a PDF vía `jspdf`.
  - `apps/web/src/components/compras/OrdenCompraModal.tsx`: Formato oficial de **Orden de Compra (OC)** (Folio `OC-YYYY-XXXXX`) con cálculo de IVA, retenciones, proveedor y PDF.
- **Consumo de API (`apps/web/src/lib/api.ts`)**: Consumo estricto de los contratos existentes de compras y Yonke.
- **Manejo de Estado**: React Hook Form con `zodResolver`, Zustand y React Query.

---

### 4. CHECKLIST PREVIO A PULL REQUEST
- [x] Código verificado en local con Laragon (`warhorse_db`).
- [x] Cero llamadas residuales o URLs duras a servidores externos o IPs locales.
- [x] Sin romper tipado TypeScript (`npm run typecheck` completado con 0 errores).
- [x] Sin errores de linter en nuevos componentes (`apps/web/src/pages/compras/`, `apps/web/src/components/compras/`).
- [x] Resumen claro redactado para el dueño del repositorio original.

