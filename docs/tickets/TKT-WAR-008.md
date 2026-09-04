# Ticket: [TKT-WAR-008] Filtro de Privacidad y RBAC de "Historial Propio" para Operadores en Terminal de Patio

**Autor / Rama**: TAVO-REVIEW7-21
**Módulos Afectados**: [Patio / Operador | PatioHome | PatioHistorial | IndexedDB Client Storage]
**Tipo de Cambio**: [Security RBAC | Data Privacy | Ergonomía Operador]

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: NO
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración CodeIgniter 4?**: NO
- [x] **Detalle de cambios DDL**: Ninguno. El aislamiento de datos se ejecuta en la capa de visualización cliente y en la consulta de persistencia IndexedDB filtrando por el identificador de sesión del operador (`operador_id` / `numeroEmpleado`).

### 2. IMPACTO EN BACKEND (API CI4)
- **Endpoints Nuevos / Modificados**: Ninguno.
- **Políticas Shield**: Cumple al 100% con la matriz de permisos de la sección 3.2 de la Especificación de Arquitectura de Interfaces:
  ```
  | Funcionalidad | Operador         | Taller           | Compras            | Admin            |
  | Vistas        | Historial Propio | Cola de Trabajo  | Inventario         | Dashboard Global |
  ```
- **Compatibilidad con Contrato Existente (`doc 05`)**: 100% compatible.

### 3. IMPACTO EN FRONTEND (REACT SPA)
- **Problema Detectado**:
  En la terminal compartida de patio (iPad Pro), el componente `PatioHome.tsx` y `PatioHistorial.tsx` actualmente despliegan el historial global de todas las inspecciones realizadas por cualquier operador en esa tableta (ej. Carlos Estrada visualiza los folios y fallas reportadas por Juan Morales). Esto viola la regla de negocio de **Historial Propio** y expone datos de otros operadores.
- **Solución Propuesta**:
  1. `apps/web/src/pages/patio/PatioHome.tsx`:
     - Cambiar el título de la tarjeta derecha de *"Consultar Historial de Turno"* a **"Mi Historial de Turno"** o **"Mis Inspecciones Recientes"**.
     - Modificar el subtítulo a: *"Consulta tus folios emitidos y el seguimiento de las alertas que tú reportaste al taller."*
     - Filtrar el arreglo `ultimasInspecciones` para mostrar **únicamente** los registros donde `item.operador_id === usuario.numeroEmpleado` (o coincidencia de nombre).
     - Si el operador no tiene inspecciones previas hoy, mostrar estado vacío amigable: *"Aún no has registrado inspecciones en este turno. Pulsa Nueva Inspección para comenzar."*
  2. `apps/web/src/pages/patio/PatioHistorial.tsx`:
     - Cambiar el título de la bitácora a **"Mi Historial de Inspecciones de Patio"**.
     - Aplicar filtro inicial obligatorio por el `operador_id` del usuario en sesión activa.
     - Ajustar los 4 KPIs de cabecera para reflejar las métricas personales del operador: *Mis Folios Totales*, *Mis Aprobadas 100%*, *Mis Warnings*, *Mis Alertas a Taller*.
     - Para usuarios con rol supervisor/admin/taller, mantener la opción de ver la bitácora global de todos los choferes mediante un toggle de *"Ver Toda la Flota"*.

### 4. CHECKLIST PREVIO A PULL REQUEST
- [ ] Filtrado estricto por `numeroEmpleado` en `PatioHome.tsx` implementado.
- [ ] Filtrado estricto por `numeroEmpleado` en `PatioHistorial.tsx` implementado.
- [ ] KPIs personales calculados exclusivamente sobre las inspecciones del operador logueado.
- [ ] Verificación de TypeScript (`npm run typecheck`) sin errores.
- [ ] Validación visual en navegador en resolución iPad Pro (`1112×834`).
