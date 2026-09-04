# Ticket: [TKT-WAR-006] Tablet Kiosk Shell, Fullscreen Automático y Escáner QR de Gafete para Patio

**Autor / Rama**: TAVO-REVIEW7-21
**Módulos Afectados**: [Patio / Operador | Login | Layout Tablet]
**Tipo de Cambio**: [Feature UI | UX Operativa | Optimización Tablet]

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: NO
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración CodeIgniter 4?**: NO
- [x] **Detalle de cambios DDL**: Ninguno. Operación exclusivamente de interfaz de usuario e integración con APIs de periféricos (WebRTC Camera, Fullscreen API, Web Audio para beep de escáner e IndexedDB offline-first).

### 2. IMPACTO EN BACKEND (API CI4)
- **Endpoints Nuevos / Modificados**: Ninguno. Consumo 100% compatible con:
  - `POST /api/v1/auth/login`
  - `GET /api/v1/unidades`
- **Controladores / Políticas Shield**: Sin modificaciones, preservando el RBAC estricto de operador/auditor de patio.
- **Compatibilidad con Contrato Existente (`doc 05`)**: Cumplimiento íntegro.

### 3. IMPACTO EN FRONTEND (REACT SPA)
- **Componentes y Vistas Afectadas / Creadas**:
  1. `apps/web/src/components/patio/PatioKioskLayout.tsx`:
     - Layout tipo quiosco de tablet dedicado, desacoplado de la barra lateral de oficina (`AppSidebar`).
     - Barra de estado industrial superior: Folio de turno, operador activo, badge de sincronización IndexedDB (Online/Offline), toggle de Fullscreen API (`document.documentElement.requestFullscreen()`) y botón de finalización/salida de turno.
  2. `apps/web/src/components/patio/QrScannerModal.tsx`:
     - Visor de cámara en vivo con selector de dispositivo (cámara frontal/trasera).
     - Retícula HUD industrial con haz láser animado y sintetizador de audio para feedback sonoro ("beep" de escaneo exitoso).
     - Soporte de escaneo de gafete de operador y código QR de tracto/caja (`WH-101`, `EMP-409`).
     - Modo simulación de escaneo rápido para pruebas sin cámara física en escritorio.
  3. `apps/web/src/pages/patio/PatioHome.tsx`:
     - Vista de Resumen inicial (según Blueprint 2.1) con dos grandes tarjetas táctiles optimizadas para tablet:
       - **[ 📋 NUEVA INSPECCIÓN ]**: Iniciar checklist con precarga inteligente.
       - **[ 🕒 CONSULTAR HISTORIAL ]**: Ver estatus y folios previos.
     - Indicador de última sincronización local y estado de la unidad.
  4. `apps/web/src/pages/Login.tsx`:
     - Pestaña de Patio enriquecida con disparador táctil `[📷 Escanear Gafete QR]`.
     - Numpad táctil numérico industrial integrado en pantalla para captura rápida de número de empleado con una mano sin invocar el teclado del sistema operativo.
  5. `apps/web/src/routes.tsx`:
     - Inclusión de la ruta `/patio` hacia `PatioHome` y enrutamiento del módulo de patio bajo `PatioKioskLayout` para los operadores.

### 4. CHECKLIST PREVIO A PULL REQUEST
- [x] Sin errores de TypeScript (`npm run typecheck`).
- [x] Totalmente compatible con la resolución de tablets horizontales y verticales.
- [x] Respeto a la paleta Warhorse (`#F2620F`, `#C5A059`, `#14181D`, `#0f0f10`) y tipografía *Barlow Condensed*.
- [x] Sin alteración de contratos de backend ni esquemas de base de datos.
