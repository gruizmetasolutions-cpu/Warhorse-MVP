# Evidencia de pruebas — Addendum 6.1: Alta de usuario con contraseña temporal (sin correo)

| | |
|---|---|
| **Addendum** | 6.1 — sobre el módulo de Usuarios del Sprint 6 (no reabre sprints cerrados) |
| **Fecha** | 2026-07-08 |
| **Objetivo** | Entregar la contraseña al dar de alta un usuario **sin canal de correo**: el sistema genera una temporal, la muestra una vez (Copiar + PDF) para entregarla en mano, y obliga a la persona a definir su propia contraseña en el primer login, con enforcement server-side. |
| **Referencias** | Spec `docs/superpowers/specs/2026-07-08-alta-usuario-contrasena-temporal-design.md` · RF-USR-01 · RF-INT-05 · doc 05 §9 (contrato ampliado) · commit `59be3d1` |

## Cambios de contrato (doc 05 §9 — anotado para re-sync)

- `POST /usuarios` ahora devuelve `password_temporal` en el 201 (única vía de entrega sin correo) y marca `debe_cambiar_password`.
- Nuevo `PATCH /auth/password` (autenticado; exento del filtro `password-vigente`).
- `POST /auth/login` y `GET /auth/me` exponen `debe_cambiar_password`.
- Se elimina el job `correo-credenciales` (stub que no enviaba).

## Pruebas ejecutadas

### Backend — PHPUnit Feature (`CambioPasswordTest.php`)

| ID | Tipo | Caso | Test | Resultado |
|---|---|---|---|---|
| PW-01 | Feature | el alta entrega la temporal (≥ 8) y marca `debe_cambiar_password=1` | `testAltaDevuelveTemporalYMarcaDebeCambiar` | ✅ |
| PW-02 | Feature | login con la temporal expone `debe_cambiar_password:true` en login y en `me` | `testLoginConTemporalExponeDebeCambiar` | ✅ |
| PW-03 | Feature | los usuarios sembrados NO deben cambiar (login sin fricción) | `testUsuariosSembradosNoDebenCambiar` | ✅ |
| PW-04 | Seguridad | con la temporal, toda ruta → 403 salvo `PATCH /auth/password` (permitido) | `testConTemporalTodoEs403SalvoCambioYLogout` | ✅ |
| PW-05 | Feature | cambio exitoso limpia el flag, mata la temporal, libera el acceso y queda auditado `usuario.password` | `testCambioExitosoLiberaElAccesoYMataLaTemporal` | ✅ |
| PW-06 | Seguridad | cambio con la contraseña actual incorrecta → 401; sigue bloqueado | `testCambioConActualIncorrectaEs401` | ✅ |
| PW-07 | Feature | nueva contraseña < 8 caracteres → 422 | `testNuevaMenorAOchoEs422` | ✅ |
| PW-08 | Seguridad | cambio sin token → 401 | `testCambioSinTokenEs401` | ✅ |

**`CambioPasswordTest`: 8 tests / 27 aserciones — OK.** `UsuariosTest` se actualizó al nuevo contrato (la temporal se entrega en el alta, no por cola). PHPStan nivel 8: 0 errores. **Suite backend completa: 115 tests, OK** (corre contra la BD de pruebas local Docker :3309).

### Frontend — Vitest + RTL (`demo.test.tsx`)

| ID | Caso | Resultado |
|---|---|---|
| PW-09 | Alta real: tras crear, aparece la tarjeta única con la contraseña temporal y los botones **Copiar** y **Descargar PDF**; se cierra con "Entendido" | ✅ |
| PW-10 | Usuario nuevo entra con la temporal → es forzado a "Define tu contraseña" (no aterriza en su módulo); valida ≥ 8 y coincidencia en cliente; al guardar entra a su landing | ✅ |
| PW-11 | Alta duplicada muestra el 409 del backend verbatim; matriz de permisos de solo lectura (heredado de S6, sigue verde) | ✅ |
| — | Suite completa | ✅ 25/25 |

### E2E — Playwright (`alta-password.spec.ts` + `admin-s6.spec.ts`)

| ID | Caso | Resultado |
|---|---|---|
| PW-12 | **Flujo completo**: Dirección da de alta, captura la temporal mostrada, **descarga el PDF** (se verifica el evento de descarga y el nombre `credenciales-*.pdf`); la persona entra con la temporal, es forzada a definir su contraseña (el guard no la deja aterrizar en su módulo), la define y entra; un login posterior con la nueva contraseña ya no exige cambio | ✅ (corrida individual) |
| PW-13 | `admin-s6` actualizado al nuevo flujo (tarjeta de credenciales en vez del texto de correo) + auditoría server-side del alta | ✅ (corrida individual) |

## Estado de la compuerta

Verde en: **tsc · ESLint · Vitest 25/25 · PHPStan nivel 8 · PHPUnit 115 · npm audit · composer audit**. Los specs E2E se verificaron **en verde de forma individual**.

**Pendiente (bloqueo externo, no de código):** la corrida E2E de la *suite completa* vía `./verificar.sh` quedó sin cerrarse porque el usuario de BD de Hostinger superó su límite `max_connections_per_hour` (500/hora), agotado por las corridas repetidas de la jornada (migraciones, reseeds, E2E con reintentos, pruebas con curl). La API responde 500 *"Unable to connect… exceeded max_connections_per_hour"* hasta que el contador se restablece (~1 h). Al liberarse, basta una corrida limpia de `./verificar.sh` para dejar la compuerta 100 % verde.

## Endurecimiento de la infraestructura de pruebas (aplicado en el camino)

- **Playwright `workers: 1`**: `php spark serve` es monohilo; correr specs en paralelo lo saturaba y colgaba los logins ("Arrancando…").
- **`globalSetup` limpia la caché** (`php spark cache:clear`): el throttler (login y mutaciones) ya no arrastra contadores entre corridas y evita 429 falsos.
- **`SeguridadTest` de rate limit robustecido**: resetea explícitamente el bucket del actor antes de medir (`throttler->remove`), en vez de depender solo de `cache()->clean()`.
- Se dejaron de versionar artefactos transitorios (`apps/web/test-results/`, `apps/api/tmp/`).

## Decisiones y alcance (del spec, confirmadas con el usuario)

- La contraseña inicial la genera el sistema y se muestra **una vez**; la persona la cambia obligatoriamente en el primer login (mínimo 8 caracteres).
- Enforcement **server-side** por filtro (`password-vigente`), no solo en la UI.
- Entrega por **PDF descargable** (jsPDF, en el navegador), además de Copiar.
- **Sin correo**, **sin** opción de "cambiar contraseña" en el menú posterior y **sin** reset por admin (fuera de alcance de este addendum).

## Pendientes / hallazgos

- Re-sync del doc 05 §9 con el contrato ampliado (arriba).
- El envío por correo queda descartado por decisión; si en el futuro se quiere autoservicio de cambio o reseteo por Dirección, se construye sobre este mismo endpoint `PATCH /auth/password`.
- Cerrar la corrida E2E completa de `./verificar.sh` cuando el límite horario de conexiones de Hostinger se restablezca.
