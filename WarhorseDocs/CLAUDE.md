# CLAUDE.md — Guía operativa del agente · Warhorse

> Primera lectura obligatoria antes de tocar código. Este archivo es contexto suficiente por sí solo para trabajar correctamente en el repositorio sin leer el resto de la documentación (aunque los detalles viven en los docs 01–09).

## Qué es Warhorse

Warhorse (Hub Consolidador de Gastos por Tracto) es un sistema para WarHorse México que consolida todo el gasto de mantener cada tractocamión —diésel, refacciones y taller— bajo una sola llave, el **ID del Tracto**, y emite un veredicto de rentabilidad por unidad ("mantener" / "vender"). Sus usuarios son el taller (Edgar Fraga y su auxiliar Kevin), Compras (Montzay), Control de Diésel (Greisy) y Dirección. El sistema existe para responder una sola pregunta con datos: **"¿vale la pena meterle más lana a este tracto?"**.

## Núcleo de dominio

La entidad ancla es la **Unidad** (`id_unidad`, ej. `WH125`, `WH03`). Toda transacción —un registro de diésel, una requisición de refacción, un ingreso a taller— **debe** vincularse a una unidad válida en el momento de captura. La entidad más rica en reglas es la **Requisición de Refacción**, porque distingue dos orígenes: `Compra` (con costo real y factura) y `Yonke` (canibalización de una unidad donante, con costo *estimado* y sin factura). El flujo Yonke es el diferenciador del sistema: convierte piezas que hoy salen "en la sombra" de unidades como WH03/WH60 en gasto rastreable.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend SPA | React 19 + TypeScript + Vite |
| Estilos | Tailwind CSS 4 |
| Ruteo | React Router |
| Datos remotos | TanStack Query sobre `fetch` |
| Backend API | CodeIgniter 4 (PHP 8.2+) |
| Base de datos | MySQL 8 |
| Auth | CI4 Shield (token de acceso HMAC en header + sesión) |
| Colas | CodeIgniter Queue (driver base de datos) |

## Reglas no negociables

1. **Nunca confíes en el cliente para decisiones de seguridad o de negocio.** El frontend React puede ocultar botones por rol, pero cada endpoint del backend **re-verifica** rol y propiedad. Un usuario Taller que fabrique una petición al panel de Compras debe recibir 403 del servidor, no depender de que la UI no muestre el botón. El cálculo del veredicto de rentabilidad se hace en el backend; el front solo lo pinta.

2. **MySQL es la única fuente de verdad.** El frontend es un canal de presentación; no persiste nada que no haya confirmado la API. No hay lógica de valorización ni de consolidación en el cliente. Cualquier número que se muestre proviene de un endpoint que lo calculó server-side.

3. **Seguridad por diseño (ver [04_plan_de_seguridad](04-seguridad/04_plan_de_seguridad.md)).** Los tres controles más críticos: (a) RBAC por `Policy`/`Filter` en cada endpoint mutante; (b) validación de propiedad de recurso (IDOR) — un rol no puede leer/editar transacciones fuera de su ámbito; (c) prepared statements siempre vía Query Builder / Model, nunca concatenación de SQL.

4. **Autenticación y verificación de token.** Toda ruta bajo `/api/v1/*` (salvo `login`) exige token de acceso válido verificado por el filtro de Shield. El token viaja en `Authorization: Bearer`. El backend valida expiración y revocación en cada request; el rol se lee del usuario autenticado en servidor, jamás de un campo enviado por el cliente.

5. **Asincronía obligatoria para trabajo diferible.** Van a cola: el procesamiento/redimensionado de fotos de requisición, el envío de notificaciones (correo/WhatsApp) a Compras cuando entra una requisición, y el recálculo de agregados pesados del dashboard. La request HTTP nunca bloquea al usuario del taller esperando un envío externo.

6. **Transacciones ACID obligatorias** en toda operación multi-tabla: instalar una requisición (actualiza requisición + agrega costo al consolidado de la unidad destino + registra la donación en la unidad Yonke), y liberar una unidad de taller como Parcial (cierra registro + genera alerta de deuda técnica + marca reincidencia). Si un paso falla, se revierte todo.

7. **Auditoría.** Se registra en tabla `auditoria`: cambios de estado de requisición, instalación de piezas (con `origen_costo_estimado`), liberaciones parciales, cambios de estado de unidad y de `valor_referencia`, y cambios de rol de usuario. Cada registro guarda actor, acción, entidad, valor anterior/nuevo y timestamp.

## Arquitectura en capas (backend CI4)

```
HTTP request
  → Route (Config/Routes.php)
  → Filter (CORS · Auth Shield · RBAC · Throttle)
  → Controller (delgado: orquesta, no contiene reglas)
  → FormRequest/Validation (valida y normaliza entrada)
  → Policy (autoriza: rol + propiedad del recurso)
  → Service (regla de negocio: valorización, consolidación, veredicto)
  → Repository (acceso a datos, eager loading, sin N+1)
  → Model/Entity (mapeo, casts, prepared statements)
  → MySQL
  ← Service emite Evento → Job en cola (foto/notificación) + Auditoría
```

El frontend habla solo con Controllers vía la interfaz `lib/api.ts` (contrato del doc 05). Nunca toca la BD ni conoce SQL.

## Comandos

```bash
# --- Frontend (demo-ux/app o apps/web) ---
npm install
npm run dev            # Vite dev server
npm run build          # build de producción (SPA estática)
npm run typecheck      # tsc --noEmit  (cero errores obligatorio)
npm run lint           # ESLint         (cero errores obligatorio)
npm run test           # Vitest unit + React Testing Library
npm run test:e2e       # Playwright smoke de rutas

# --- Backend (apps/api, CodeIgniter 4) ---
composer install
cp env .env                       # configurar DB, app.baseURL, encryption.key
php spark key:generate            # clave de cifrado
php spark migrate                 # esquema de BD
php spark db:seed InitialSeeder   # catálogos + usuario admin inicial
php spark serve                   # dev server API
php spark queue:work              # worker de colas (fotos, notificaciones)

# --- Calidad backend ---
vendor/bin/phpstan analyse        # nivel 8 obligatorio
vendor/bin/phpunit                # pruebas de feature/unit
```

## Identidad visual (obligatoria — ver [08_identidad_visual_design_system](01-vision/08_identidad_visual_design_system.md))

Identidad industrial de WarHorse, **no** la paleta azul del PDF viejo (superada). Tokens primarios:

- **Naranja de marca** `--wh-orange: #F2620F` (acción, acento, tracto crítico). Hover `#D9550C`, soft `#FDE8DC`, focus ring `#F9B48A`.
- **Casi-negro** `--wh-ink: #16191E` (texto principal, barras normales, botones oscuros).
- **Crema** `--wh-bg: #F3EFE7` (fondo general). Superficie de tarjetas `#FFFFFF`.
- **Verde** `--wh-green: #3FA65C` (Compras / positivo). **Ámbar** `#E0C36A` (urgencia media). El naranja/rojo `#B4430A` marca criticidad.
- Tipografía: **Barlow** (cuerpo, datos) y **Barlow Condensed** (encabezados, KPIs, números — con `font-variant-numeric: tabular-nums`).

Reglas de contraste: texto principal `#16191E` sobre crema/blanco cumple WCAG AA. **NO hacer:** texto blanco sobre naranja `#F2620F` en cuerpos largos (usar solo en botones cortos con peso alto); **no** introducir azul de marca (el `#1B4E8C` solo sobrevive como color semántico del estado "Comprado" en badges); **no** rellenar íconos (iconografía de línea); **no** repetir el elemento de firma (camión de línea) en cada pantalla — resérvalo para login y estados vacíos.

## Regla del demo (Demo-First — ver [ADR-003](02-arquitectura/ADR/ADR-003_demo-first-esqueleto-reutilizable.md))

El demo en `demo-ux/app/` es el origen de `apps/web/`. Toda la lógica de datos vive detrás de la firma de `lib/api.ts`; en el demo esa firma la implementa `lib/mock/`. **Prohibido cablear datos reales o llamadas a backend dentro del demo.** Al arrancar el backend, se sustituye `lib/mock/` por la implementación real de `lib/api.ts` sin reescribir componentes ni pantallas.

## Orden de lectura de la documentación

1. README.md → CLAUDE.md
2. ADR-001, ADR-002, ADR-003
3. 01 SRS
4. 02 Arquitectura · 03 Modelo de datos · 04 Seguridad
5. 09 Demo-UX + 08 Design System (ver el demo antes de implementar); 05 API (congelada por el demo); 07 Roadmap
