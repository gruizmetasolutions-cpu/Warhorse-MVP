# Ticket: [TKT-WAR-010] Generación, Consulta e Impresión de Gafetes y Códigos QR para Equipo de Mecánicos

**Autor / Rama**: TAVO-REVIEW7-21
**Módulos Afectados**: [Taller / Personal | TallerPersonal | GafeteMecanicoModal | Acreditaciones QR]
**Tipo de Cambio**: [Feature UI | Identificación y Autenticación QR | Formato Oficial Imprimible]

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: NO
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración CodeIgniter 4?**: NO
- [x] **Detalle de cambios DDL**: Ninguno. La identificación unívoca del personal técnico se mapea directamente desde el `id` maestro de la tabla `responsables_taller` con el prefijo estandarizado `MEC-00{id}` (o número de nómina), garantizando total compatibilidad sin alterar tablas existentes.

### 2. IMPACTO EN BACKEND (API CI4)
- **Endpoints Existentes**:
  - `GET /api/v1/taller/responsables` (Retorna id, nombre, rol de los mecánicos).
  - `POST /api/v1/taller/responsables` (Alta de nuevos integrantes del equipo).
- **Políticas Shield**: Mantiene acceso restringido para roles `taller` y `admin`.
- **Compatibilidad con Contrato Existente (`doc 05`)**: 100% compatible.

### 3. IMPACTO EN FRONTEND (REACT SPA)
- **Problema Detectado**:
  En `TallerPersonal.tsx`, las tarjetas de los mecánicos únicamente muestran su nombre y rol en texto plano. No existe ninguna opción para:
  1. Consultar el código QR unívoco de cada especialista.
  2. Generar y entregar el gafete/credencial QR cuando se registra un nuevo mecánico.
  3. Imprimir o descargar la credencial oficial de acreditación técnica para escaneo en tablets de patio o taller.
- **Solución Propuesta**:
  1. `apps/web/src/components/taller/GafeteMecanicoModal.tsx`:
     - Modal con diseño industrial oscuro Warhorse:
       * Encabezado con Logo oficial Warhorse México y denominación *"Acreditación Técnica de Taller"*.
       * Avatar / Foto y Datos del Mecánico: Nombre, Nivel (`Mecánico A`, `Mecánico B`, `Auxiliar`), Especialidad (`Tracto` o `Caja`).
       * Folio unívoco de empleado (`MEC-001`, `MEC-002`, etc.).
       * Renderizado dinámico del código QR nítido con el payload estructurado:
         `{"tipo":"mecanico","id":"MEC-001","nombre":"Carlos Méndez","rol":"Mecánico A"}`.
       * Botón de acción: `[Descargar Gafete PDF]` (con `jspdf`) listo para gafete físico o credencial de bolsillo.
       * Botón de acción: `[Descargar Código QR PNG]`.
  2. `apps/web/src/pages/taller/TallerPersonal.tsx`:
     - En cada tarjeta de la cuadrilla:
       * Incorporar botón interactivo `[Ver Gafete QR]`.
       * Etiqueta de código de acreditación (`MEC-001`, etc.).
     - Al completar el formulario de *"Alta de Mecánico"*:
       * Una vez guardado con éxito en el backend, abrir inmediatamente el modal con el Gafete QR generado para su entrega inmediata al colaborador.

### 4. CHECKLIST PREVIO A PULL REQUEST
- [x] Componente `GafeteMecanicoModal.tsx` creado con renderizado QR y exportación a PDF.
- [x] Botones de consulta de QR en cada tarjeta de mecánico en `TallerPersonal.tsx`.
- [x] Apertura automática del Gafete QR al registrar un nuevo mecánico.
- [x] Verificación de TypeScript (`npm run typecheck`) con 0 errores.
- [x] Validación en navegador y captura de evidencias visuales.
