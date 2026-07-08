# Diseño — Alta de usuario con contraseña temporal (sin correo)

| | |
|---|---|
| **Fecha** | 2026-07-08 |
| **Contexto** | App interna de gestión de flota. Dirección da de alta a personal de taller/compras/diésel que está físicamente presente. No hay canal de correo. |
| **Reemplaza** | El stub `correo-credenciales` del Sprint 6 (que no envía nada) y la ausencia de un flujo para que el usuario defina su contraseña. |
| **RF** | RF-USR-01 (alta), RF-INT-05 (auditoría). |

## Problema

Hoy el alta genera una contraseña temporal aleatoria y encola un job de correo que en realidad no envía nada, así que **no hay forma de entregar la contraseña al usuario**. Además, una vez dentro, el usuario **no puede cambiar su contraseña**: se queda con la temporal para siempre.

## Decisiones (confirmadas con el usuario)

1. **La contraseña inicial la genera el sistema** y se muestra **una sola vez** al admin en el momento del alta (nunca más; se guarda cifrada).
2. **Cambio obligatorio en el primer login**: la persona entra con la temporal y el sistema la obliga a definir su propia contraseña antes de usar cualquier otra cosa. La temporal muere al cambiarla. No hay opción de "cambiar contraseña" en el menú después (solo el flujo forzado).
3. **Enforcement server-side** mediante un filtro: mientras el usuario "deba cambiar" la contraseña, toda ruta responde 403 salvo el cambio de contraseña y el logout.
4. **Mínimo 8 caracteres** para la nueva contraseña.
5. **PDF de credenciales** generado en el navegador (jsPDF) desde la respuesta del alta, para entregárselo impreso a la persona.

## Arquitectura

### Datos
- Migración nueva: columna `debe_cambiar_password BOOLEAN NOT NULL DEFAULT 0` en `usuarios`.
- El alta la pone en `1`. Los usuarios sembrados (`UsuariosSeeder`) quedan en `0` (siguen con `warhorse-demo`, son cuentas de desarrollo).

### API (backend CI4)
- **`POST /api/v1/usuarios`** (solo admin, ya existe): ahora
  - genera la temporal (`bin2hex(random_bytes(6))`, como hoy),
  - crea la cuenta con `debe_cambiar_password = 1`,
  - **devuelve `password_temporal` en el 201** (cambio deliberado del contrato: es la única vía de entrega sin correo),
  - **elimina el encolado** del job de correo.
- **`PATCH /api/v1/auth/password`** (nuevo; cualquier rol autenticado, filtro `api-auth` pero **exento** del filtro `password-vigente`):
  - body `{ password_actual, password_nueva }`,
  - valida `password_nueva` con mínimo 8 caracteres (422 si no),
  - verifica `password_actual` contra Shield (401 `bad_credentials` si no coincide),
  - guarda la nueva vía Shield y pone `debe_cambiar_password = 0`,
  - audita `usuario.password` (sin registrar ningún valor de contraseña).
- **`POST /auth/login`** y **`GET /auth/me`**: incluyen `debe_cambiar_password: bool` en su respuesta.
- **Se elimina** el job `App\Jobs\CorreoCredenciales`, su entrada en `Config\Queue` y el `push` en `UsuarioService::alta()`. `NotificarCompras` (requisiciones) se conserva.

### Filtro `password-vigente` (enforcement)
- Alias nuevo en `Config\Filters`; se aplica **después de `api-auth`** en todas las rutas autenticadas del grupo `api/v1` **excepto** `PATCH /auth/password` y `POST /auth/logout`.
- Lógica: lee el actor de `ActorActual`; si `debe_cambiar_password` es verdadero, devuelve `403 password_change_required` con mensaje claro. Así el "obligatorio" es real en el servidor, no solo en la UI.
- Se aplica ruta por ruta (mismo patrón que `rbac`), no como global, para poder exceptuar cambio y logout de forma explícita.

### SPA (React)
- **`lib/api.ts`**: `crearUsuario` devuelve además `password_temporal`; nueva `cambiarPassword({ password_actual, password_nueva })`; los tipos de login/`me` (`SesionLogin`/`Yo`) agregan `debe_cambiar_password`.
- **Panel post-alta en `Usuarios.tsx`**: al crear, muestra una tarjeta única con nombre/correo/rol + la temporal, y dos botones: **Copiar** y **Descargar PDF**. La tarjeta se cierra manualmente; la temporal no se vuelve a mostrar.
- **PDF (jsPDF)**: helper `lib/credencialesPdf.ts` que arma un PDF de una página (logo textual "Hub de Gastos WarHorse", nombre, correo, rol, contraseña temporal, y una nota: "Al iniciar sesión se te pedirá crear tu propia contraseña"). Archivo `credenciales-<idodominio>.pdf`. jsPDF se agrega como dependencia de `apps/web`.
- **Pantalla "Define tu contraseña"** (`pages/DefinirPassword.tsx`): si tras login `debe_cambiar_password` es true, el guard de rutas redirige ahí y **bloquea toda otra navegación** hasta guardar. Formulario: nueva + confirmar (mínimo 8, deben coincidir); al guardar llama a `cambiarPassword`, refresca la sesión (`me`) y entra a su landing. Estética del demo.
- **Guard**: en `routes.tsx`/`AppLayout`, si la sesión tiene `debe_cambiar_password`, cualquier ruta que no sea `/definir-password` redirige a ella (espejo del filtro server-side).

## Flujo completo

1. Dirección crea a "Paola / paola@warhorse.mx / Taller".
2. La API responde 201 con `password_temporal: "a3f9c1e07b52"`.
3. El SPA muestra la tarjeta única; el admin descarga el PDF y se lo entrega a Paola.
4. Paola entra con su correo + la temporal → login OK, pero `debe_cambiar_password = true`.
5. El SPA la manda a "Define tu contraseña"; cualquier intento de ir a otra vista la regresa ahí, y la API responde 403 a cualquier endpoint que no sea el cambio.
6. Paola define su contraseña (≥ 8). El backend limpia el flag; la temporal ya no sirve.
7. Paola queda en su landing y usa el Hub con normalidad.

## Manejo de errores

| Caso | Respuesta |
|---|---|
| Alta con correo/rol inválido o duplicado | 422 / 409 (ya cubierto) |
| Cambio con `password_actual` incorrecta | 401 `bad_credentials` |
| Cambio con `password_nueva` < 8 | 422 `validation` |
| Cualquier endpoint con la temporal sin cambiarla | 403 `password_change_required` |
| Cambio de contraseña sin token | 401 (filtro `api-auth`) |

## Pruebas (TDD)

**Backend (PHPUnit feature):**
- Alta devuelve `password_temporal` y marca `debe_cambiar_password`.
- Login con la temporal responde `debe_cambiar_password: true`; `me` también.
- Filtro: con el flag activo, GET /taller (u otra) → 403; `PATCH /auth/password` y `POST /auth/logout` → permitidos.
- Cambio: actual incorrecta → 401; nueva < 8 → 422; éxito limpia el flag, la temporal deja de servir, la nueva permite login y ya no exige cambio; auditado `usuario.password`.
- Los usuarios sembrados no traen el flag (login normal sin fricción).

**Front (Vitest):**
- Tras alta, aparece la tarjeta con la temporal y los botones Copiar/Descargar PDF (mock de la descarga).
- Login de un usuario con `debe_cambiar_password` redirige a "Define tu contraseña" y bloquea la navegación; al guardar (≥ 8, coinciden) entra a su landing.
- Contraseñas que no coinciden o < 8 muestran error sin llamar a la API.

**E2E (Playwright):**
- Admin crea usuario → descarga PDF (verificar que el botón dispara descarga) → login con la temporal → es forzado a definir contraseña → entra; con la temporal, antes de cambiarla, no puede navegar (403/redirección).

## Alcance / YAGNI

- **No** se agrega opción de "cambiar contraseña" en el menú (el usuario eligió solo el cambio obligatorio al primer login). El endpoint queda disponible pero sin entrada de menú posterior.
- **No** se implementa reseteo/olvidé-contraseña por parte del admin (fuera de alcance; se puede sumar luego reutilizando la temporal).
- **No** se implementa envío por correo (decisión explícita).

## Impacto en documentación

- Doc 05 §9: `POST /usuarios` ahora devuelve `password_temporal`; nuevo `PATCH /auth/password`; `login`/`me` exponen `debe_cambiar_password`. Anotar para re-sync del contrato.
- Evidencias: estos casos entran como addendum del Sprint 6 (o Sprint 6.1), no reabren sprints cerrados.
