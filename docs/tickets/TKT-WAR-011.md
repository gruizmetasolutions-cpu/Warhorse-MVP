# Ticket: [TKT-WAR-011] Corrección de Contraste y Legibilidad en Estados Activos del Menú Lateral (Sidebar)

**Autor / Rama**: TAVO-REVIEW7-21
**Módulos Afectados**: [Layout / Navegación | AppSidebar | Sistema de Diseño Industrial]
**Tipo de Cambio**: [UX/UI | Accesibilidad WCAG AA | Corrección Visual]

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: NO
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración CodeIgniter 4?**: NO
- [x] **Detalle de cambios DDL**: Ninguno. Cambio 100% en capa de presentación frontend (estilos de navegación).

### 2. IMPACTO EN BACKEND (API CI4)
- **Endpoints Nuevos / Modificados**: Ninguno.
- **Políticas Shield**: Sin cambios.
- **Compatibilidad con Contrato Existente (`doc 05`)**: 100% compatible.

### 3. IMPACTO EN FRONTEND (REACT SPA)
- **Problema Detectado**:
  En `apps/web/src/components/layout/AppSidebar.tsx`, al activarse una ruta de navegación, el contenedor recibe la clase `bg-[#F2620F]`, pero el texto, iconos y chevrons utilizaban `text-[#16191E]`. En monitores y bajo temas oscuros, esta combinación genera un bajo ratio de contraste perceptual, haciendo que el texto ("Equipo de Mecánicos", etc.) se aprecie oscuro, apagado y con baja legibilidad sobre la pastilla naranja.
- **Solución Propuesta**:
  1. **Tipografía y Colores de Alto Contraste (WCAG AA)**:
     - Cambiar el color de texto del elemento activo a **blanco puro (`text-white font-extrabold`)** con sombra sutil de texto si aplica.
     - Cambiar los iconos (`Icono` y `ChevronRight`) a `text-white` en estado activo.
     - Rediseñar el badge de estado activo con fondo oscuro translúcido `bg-black/30 text-white border border-white/20` para evitar saturación cromática.
  2. **Refinamiento de la Franja Industrial**:
     - Agregar un sutil realce `ring-1 ring-white/20` y sombra difuminada para que la pastilla de selección resalte nítidamente sobre el fondo negro carbón del sidebar sin opacar el texto.

### 4. CHECKLIST PREVIO A PULL REQUEST
- [x] Modificar estilos de `NavLink` activo en `AppSidebar.tsx` con texto blanco de alto contraste e iconos sincronizados.
- [x] Verificación de TypeScript (`npm run typecheck`) con 0 errores.
- [x] Validación visual en navegador y captura de evidencias antes/después.
