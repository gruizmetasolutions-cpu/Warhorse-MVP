# Evidencia de pruebas — Sprint 6: Hardening + Auditoría + Observabilidad

| | |
|---|---|
| **Sprint** | 6 — Seguridad, bitácora de auditoría, usuarios reales y salud de datos |
| **Fecha** | 2026-07-08 |
| **Objetivo** | Cerrar el MVP con hardening OWASP (doc 04), bitácora `GET /auditoria` con filtros, módulo de Usuarios real (doc 05 §9), métricas de salud de datos (SRS §9) con tarjeta en el Dashboard, y la batería de seguridad negativa completa (doc 06 §2.10). |
| **Referencias** | Roadmap doc 07 §Sprint 6 · doc 06 §2.10 y §5 · doc 04 §A01/A03/A04/A05/A07/A08/A09 y §4.2 · doc 05 §9 · SRS §9 (RF-USR-01/02/03, RF-INT-05) |

## Pruebas ejecutadas

### Backend — PHPUnit Feature (nuevos: `AuditoriaTest`, `UsuariosTest`, `MetricasTest`, `SeguridadTest`)

| ID | Tipo | Caso | Test | Resultado |
|---|---|---|---|---|
| S6-01 | Feature | RF-INT-05 bitácora con actor legible, JSON decodificado y paginación | `AuditoriaTest::testListadoConActorYPaginacion` | ✅ |
| S6-02 | Feature | filtros por entidad, acción, entidad_id y actor_id | `AuditoriaTest::testFiltrosPorEntidadAccionYActor` | ✅ |
| S6-03 | Feature | filtro por rango de fechas | `AuditoriaTest::testFiltroPorRangoDeFechas` | ✅ |
| S6-04 | Seguridad | bitácora solo admin → 403 | `AuditoriaTest::testBitacoraSoloAdmin` | ✅ |
| S6-05 | Feature | RF-USR-01 listado solo admin, sin `password_hash` | `UsuariosTest::testListadoSoloAdminYSinHashes` | ✅ |
| S6-06 | Feature | RF-USR-01 alta encola credenciales por correo, no las expone, y permite login con la temporal | `UsuariosTest::testAltaValidaEncolaCredencialesYPermiteLogin` | ✅ |
| S6-07 | Feature | alta duplicada → 409 | `UsuariosTest::testAltaDuplicadaEs409` | ✅ |
| S6-08 | Feature | alta con correo/rol inválido → 422 | `UsuariosTest::testAltaInvalidaEs422` | ✅ |
| S6-09 | Seguridad | **§2.10 A01 escalada**: alta con `rol:admin` desde token taller → 403, sin escribir | `UsuariosTest::testAltaPorNoAdminConEscaladaEs403` | ✅ |
| S6-10 | Feature | RF-USR-01 suspender corta el acceso del token vigente (401) y bloquea login; reactivar lo devuelve; ambos auditados | `UsuariosTest::testSuspenderCortaElAccesoDeInmediatoYReactivarLoDevuelve` | ✅ |
| S6-11 | Feature | RF-USR-02 cambio de rol ajusta landing, módulos y RBAC al instante; auditado | `UsuariosTest::testCambioDeRolAjustaPermisosDeInmediato` | ✅ |
| S6-12 | Feature | PATCH inexistente → 404; por no-admin → 403 | `UsuariosTest::testPatchInexistenteEs404YNoAdminEs403` | ✅ |
| S6-13 | Feature | SRS §9 métricas del seed demo (req con foto/origen, liberaciones con tipo, Yonke con costo por origen) | `MetricasTest::testMetricasDelSeedDemo` | ✅ |
| S6-14 | Feature | un ingreso abierto no cuenta como liberación pendiente de tipo | `MetricasTest::testUnIngresoAbiertoNoCuentaComoLiberacion` | ✅ |
| S6-15 | Seguridad | métricas solo admin → 403 | `MetricasTest::testMetricasSoloAdmin` | ✅ |
| S6-16 | Seguridad | **§2.10 A03 SQLi**: `estado='Comprado' OR 1=1` → 422 por lista blanca; texto libre parametrizado → 0 filas; numérico casteado no filtra de más | `SeguridadTest::testSqliEnFiltrosNoTieneEfecto` | ✅ |
| S6-17 | Seguridad | **§2.10 A03 XSS**: `<script>` en diagnóstico se almacena verbatim y se sirve como `application/json` (inerte) | `SeguridadTest::testXssAlmacenadoViajaEscapableYNoSeEjecutaEnLaApi` | ✅ |
| S6-18 | Seguridad | **§2.10 A05**: cabeceras `nosniff`/`DENY`/`no-referrer`/CSP `default-src 'none'` en respuestas OK y de error | `SeguridadTest::testCabecerasDeSeguridadPresentes` | ✅ |
| S6-19 | Seguridad | **§2.10 A04**: 60 mutaciones/min por actor; la 61ª → 429 | `SeguridadTest::testRateLimitEnMutantesEs429` | ✅ |

**PHPUnit total: 107 tests / 732 aserciones.** PHPStan nivel 8: 0 errores.

### Batería de seguridad §2.10 — mapa completo de controles

| Control (doc 06 §2.10) | Cubierto por |
|---|---|
| A01 RBAC (taller→dashboard) | `AuthTest::testRbacRolSinPermisoEs403`, `DashboardTest::testAccesoPorRolNoAdminEs403` |
| A01 IDOR (foto de otra requisición) | `RequisicionesTest::testFotoDeOtroTallerEs403`, `testTallerSoloVeSusRequisiciones` |
| A01 escalada (`rol:admin` en payload) | `UsuariosTest::testAltaPorNoAdminConEscaladaEs403`, `AuthTest::testEscaladaDeRolEnPayloadEsIgnorada` |
| A03 SQLi en filtros | S6-16 |
| A03 XSS almacenado | S6-17 |
| A07 request sin token → 401 | `AuthTest::testRequestSinTokenEs401` |
| A07 token revocado → 401 | `AuthTest::testLogoutRevocaElToken`, `testTokenExpiradoEs401` |
| A08 subir `.php` como foto | `RequisicionesTest::testSubirPhpDisfrazadoDeFotoEsRechazado` |
| A08 forzar `origen_costo_estimado` | `RequisicionesTest::testOrigenCostoEstimadoDelClienteEsIgnorado` |
| A09 auditoría al instalar/mutar | `ComprasTest` (instalación auditada), `AuditoriaTest`, S6-01..03 |

### Frontend — Vitest + RTL

| ID | Caso | Resultado |
|---|---|---|
| S6-20 | Usuarios reales: reactivar contra API, alta exige correo, 409 duplicado verbatim, matriz de permisos de solo lectura (RF-USR-01/03) | ✅ |
| S6-21 | Usuarios: cambio de rol llama a la API y muestra el correo de la fila (RF-USR-02) | ✅ |
| S6-22 | Dashboard: tarjeta de salud de datos con los tres indicadores y desglose por origen (SRS §9) | ✅ |
| — | Suite completa | ✅ 24/24 |

Con este sprint `lib/mock/` desaparece por completo: **todo el SPA consume la API real**. El estado global (`lib/demo.tsx`) ya no guarda usuarios ni permisos en memoria.

### E2E — Playwright (`e2e/admin-s6.spec.ts` + suite previa)

| ID | Caso | Resultado |
|---|---|---|
| S6-23 | Admin da de alta un usuario desde la UI; verificación server-side de que el evento `usuario.alta` quedó en la bitácora con el actor correcto (RF-INT-05, auditoría e2e); tarjeta de salud visible | ✅ |
| — | Suite E2E completa (login por rol, requisición Yonke, ciclo de compra, liberación parcial, dashboard/veredicto/diésel, admin/auditoría) | ✅ 15/15 |

**Compuerta `./verificar.sh`: EN VERDE (8/8)** — tsc · ESLint · Vitest 24/24 · Playwright 15/15 · PHPStan nivel 8 · PHPUnit 107 · npm audit · composer audit.

## Hardening aplicado (doc 04)

- **A05 cabeceras**: filtro `CabecerasSeguridad` global-after sobre toda la API: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'` (la API solo emite JSON). Verificado en respuestas OK y de error (S6-18).
- **A05 CORS**: restringido al origen del SPA; ahora configurable por `.env` (`cors.allowedOrigin`) vía constructor de `Config\Cors`, con `supportsCredentials` y headers/métodos acotados. El runbook de S7 solo fija la variable en producción.
- **A04/A07 rate limit en mutantes**: filtro `throttle-mut` (60/min por actor) en las 10 rutas POST/PATCH; el login ya tenía `throttle-login` 5/min desde S1 (S6-19).
- **A01 RBAC**: cada ruta re-verifica el rol server-side (filtro `rbac`), no solo la visibilidad del SPA.
- **A08 uploads/integridad**: foto validada por MIME/extensión y servida por controlador anti-IDOR (S3); `origen_costo_estimado` lo asigna el backend (S3).
- **A09 auditoría**: todos los eventos críticos se escriben dentro de su transacción y son consultables por Dirección con filtros.

### Checklist de hardening §4.2 — estado en este entorno

| Ítem | Estado |
|---|---|
| CORS restringido al origen del front | ✅ (configurable por `.env`) |
| Cabeceras CSP/nosniff/Referrer/X-Frame | ✅ (filtro de aplicación) |
| Fotos fuera del webroot, servidas por controlador autorizado | ✅ (desde S3) |
| `.env` fuera de Git | ✅ (desde S0) |
| `composer audit` / `npm audit` sin vulnerabilidades altas | ✅ |
| Usuario MySQL de mínimos privilegios · HTTPS+HSTS · `CI_ENVIRONMENT=production` · API solo por Nginx a `public/` · cookies refresh · `setup_admin` eliminado · backups | ⏭️ Runbook S7 (infra del VPS; no ejecutable en este entorno de desarrollo) |

## Trazabilidad (matriz doc 06 §4)

AUTH-01..04 ✅ (§2.1, E2E login) · UNI-01..05 ✅ (§2.2/§2.8) · DIE-01..03 ✅ (§2.3) · REQ-01..07 ✅ (§2.4/§2.7, E2E Yonke) · COM-01..04 ✅ (§2.7, E2E compra) · TAL-01..04 ✅ (§2.5/§2.9) · FIC-01..04 ✅ (integración /ficha, E2E Yonke) · DASH-01..06 ✅ (§2.6) · **USR-01..03 ✅ (S6-05..12, §2.10 escalada, E2E S6-23)** · **INT-01..05 ✅ (huérfanas §2.3, estimado/real §2.4, consistencia §2.7, auditoría §2.10 + AuditoriaTest)**. **Sin RF crítico sin prueba.**

## Criterios de aceptación de calidad para release (doc 06 §5)

- [x] 100% de transiciones de estado probadas (§2.7–2.9) — cubierto en S2/S4.
- [~] **Cobertura de Services ≥ 80%** — ver "Pendientes"; sustentado por inventario Servicio→test (no medible automáticamente en este entorno).
- [x] PHPStan nivel 8 sin errores; `tsc --noEmit` sin errores; ESLint limpio.
- [x] Todos los casos de seguridad negativos (§2.10) pasan.
- [x] Smoke E2E: cada ruta carga y es operable (15 casos E2E, incluidos flujos por teclado del demo).
- [x] `composer audit` y `npm audit` sin vulnerabilidades altas/críticas.
- [x] Umbrales de rendimiento (§3) cumplidos; `EXPLAIN` verificado (RendimientoTest en la suite, S5).
- [x] Matriz de trazabilidad (§4) sin RF crítico sin prueba.

## Pendientes / hallazgos

- **Cobertura de Services (§5) no medible automáticamente aquí**: el entorno usa PHP 8.5 de Herd-lite (binario preempaquetado) **sin driver de cobertura** — no hay `pcov` ni `xdebug`, no existen `phpize`/`pecl` para compilarlos y no hay `sudo`; `phpdbg` tampoco viene incluido. En su lugar se sustenta cualitativamente: **los 13 servicios y sus 32 métodos públicos se ejercen desde la suite de 107 tests feature** (cada endpoint atraviesa su servicio; los servicios internos —Consolidado, Valorizacion, Cuenta, Auditoria— se cubren de forma transversal por Diésel/Taller/Compras/Requisiciones/Usuarios). Queda como acción para el VPS/CI del S7 activar `pcov` y emitir el porcentaje real.
- **Filtro `throttle-mut` y caché de archivo**: el throttler usa caché `file` que persiste entre tests del proceso; el test de rate limit limpia la caché al arrancar (`cache()->clean()`). En producción el runbook debe usar un backend de caché con TTL real (Redis o el propio file con limpieza), documentado en S7.
- `?periodo=` del dashboard (doc 05 §8) sigue sin implementar (heredado de S5; la UI no lo pide). Anotado para re-sync del doc 05.
- Cookies del refresh `HttpOnly+Secure+SameSite` (checklist §4.2): el MVP usa token de acceso en memoria (S1); el flujo de refresh por cookie queda documentado en el runbook S7 junto con el resto de la infra.
