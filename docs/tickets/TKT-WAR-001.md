# Ticket: [TKT-WAR-001] Backbone Arquitectónico, RBAC y Layout Core con Identidad WarHorse

**Autor / Rama**: TAVO-REVIEW7-21  
**Módulos Afectados**: [Backbone | Auth | Dashboard | Navegación Global | RBAC]  
**Tipo de Cambio**: [Feature UI / Refactor Arquitectónico]  

---

### 1. ALERTA DE IMPACTO EN BASE DE DATOS (CRÍTICO)
- [x] **¿Modifica esquemas existentes?**: NO
- [x] **¿Altera Llaves Primarias (PKs) o Auto-incrementables?**: NO (Sin riesgo de afectación)
- [x] **¿Modifica Llaves Foráneas (FKs) o restricciones de integridad?**: NO
- [x] **¿Requiere nueva migración CodeIgniter 4?**: NO
- **Detalle de cambios DDL**: Ninguno. Se aprovecha al 100% el esquema actual (`usuarios`, `unidades`, `requisiciones`, `registros_taller`, etc.).

---

### 2. IMPACTO EN BACKEND (API CI4)
- **Endpoints Nuevos / Modificados**: Ninguno. Se consumen los endpoints existentes vía `apps/web/src/lib/api.ts`:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
- **Controladores / Políticas Shield**: El backend valida los tokens JWT y scopes en cada endpoint.
- **Servicios de Dominio / Eventos / Auditoría**: Intactos.
- **Compatibilidad con Contrato Existente (`doc 05`)**: 100% compatible.

---

### 3. IMPACTO EN FRONTEND (REACT SPA)
- **Componentes y Vistas Afectadas**:
  - `apps/web/src/store/useAuthStore.ts`: Nuevo store Zustand para manejo de sesión y roles (Operador, Taller, Compras, Admin).
  - `apps/web/src/store/useUiStore.ts`: Nuevo store Zustand para control de navegación, temas, modales y notificaciones.
  - `apps/web/src/components/layout/AppNavbar.tsx`: Navbar industrial de alta densidad con selector de perfil, métricas rápidas y estado de conexión.
  - `apps/web/src/components/layout/AppSidebar.tsx`: Barra lateral reactiva a permisos y roles con tokens de color WarHorse.
  - `apps/web/src/components/layout/MainLayout.tsx`: Contenedor principal con fondo crema industrial `#F3EFE7`, tipografía Barlow y números tabulares.
  - `apps/web/src/pages/Login.tsx`: Rediseño de login de alta fidelidad con opciones de Acceso Rápido por Empleado/QR (Patio) y Acceso Corporativo.
  - `apps/web/src/routes.tsx`: Enrutador protegido por roles y estados de sesión.
- **Consumo de API (`apps/web/src/lib/api.ts`)**: Mantiene la Fuente Única de Verdad (`api.ts`), utilizando los métodos de login/me.
- **Manejo de Estado / Caché**: Zustand para estado global de sesión e interfaz.

---

### 4. CHECKLIST PREVIO A PULL REQUEST
- [x] Código verificado en local con Laragon (`warhorse_db`).
- [x] Cero llamadas residuales o URLs duras a servidores externos o IPs locales.
- [x] Sin romper tipado TypeScript (`npm run typecheck` en código nuevo).
- [x] Sin errores de linter en nuevos componentes (`apps/web/src/components/layout/`, `apps/web/src/store/`, etc.).
- [x] Resumen claro redactado para el dueño del repositorio original.
