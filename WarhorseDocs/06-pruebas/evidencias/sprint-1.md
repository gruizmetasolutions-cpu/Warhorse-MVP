# Evidencia de pruebas — Sprint 1: Auth + RBAC

| | |
|---|---|
| **Sprint** | 1 — Autenticación real y control de acceso |
| **Fecha** | 2026-07-07 |
| **Objetivo** | CI4 Shield con tokens de acceso, endpoints `auth/login|logout|me`, filtros `api-auth`/`rbac`/`throttle-login`/CORS, y el SPA con login real, nav filtrado por rol y guardas de ruta. |
| **Referencias** | Roadmap doc 07 §Sprint 1 · Plan de pruebas doc 06 §2.1 y §2.10 · Seguridad doc 04 §A01/A07 · Contrato doc 05 §2 |

## Pruebas ejecutadas

### Backend — PHPUnit Feature (`tests/feature/AuthTest.php`), contra MariaDB 11.8 de pruebas

| ID | Tipo | Caso (doc 06) | Test | Resultado |
|---|---|---|---|---|
| S1-01 | Feature | §2.1 Login válido (por 4 roles: token + landing) | `testLoginValidoDevuelveTokenYLandingPorRol` | ✅ |
| S1-02 | Feature/Seguridad | §2.1 Login inválido → 401 genérico (no revela causa) | `testLoginInvalidoEs401Generico` | ✅ |
| S1-03 | Feature | §2.1 Usuario inexistente → 401 | `testUsuarioInexistenteEs401Generico` | ✅ |
| S1-04 | Feature | §2.1 Usuario suspendido → 401 | `testUsuarioSuspendidoEs401` | ✅ |
| S1-05 | Feature | doc 05 §1.4 — 422 con `fields` si faltan datos | `testLoginSinCamposEs422` | ✅ |
| S1-06 | Seguridad | §2.1 Fuerza bruta: 6º intento en 1 min → 429 | `testFuerzaBrutaSextoIntentoEnUnMinutoEs429` | ✅ |
| S1-07 | Feature | §2.1 Logout revoca; reusar token → 401 (RF-AUTH-03) | `testLogoutRevocaElToken` | ✅ |
| S1-08 | Seguridad | §2.1 Token expirado → 401 | `testTokenExpiradoEs401` | ✅ |
| S1-09 | Seguridad | §2.10 A07 request sin token → 401 | `testRequestSinTokenEs401` | ✅ |
| S1-10 | Feature | RF-USR-03 `/auth/me` con matriz de permisos por rol | `testMeDevuelvePermisosDeLaMatrizPorRol` | ✅ |
| S1-11 | Seguridad | Suspensión posterior al token → 401 inmediato | `testUsuarioSuspendidoTrasEmitirTokenPierdeAcceso` | ✅ |
| S1-12 | Seguridad | §2.10 A01 RBAC: taller → ruta admin = 403; admin = 200 | `testRbacRolSinPermisoEs403` | ✅ |
| S1-13 | Seguridad | §2.10 A01 escalada: `rol=admin` en payload ignorado | `testEscaladaDeRolEnPayloadEsIgnorada` | ✅ |

**PHPUnit total: 21 tests / 75 aserciones (incluye el esquema del Sprint 0).** PHPStan nivel 8: 0 errores.

### Frontend — Vitest + RTL (`src/__tests__/demo.test.tsx`, API de auth mockeada)

| ID | Tipo | Caso | Resultado |
|---|---|---|---|
| S1-14 | Unit front | Login real por credenciales; Dirección→Tablero, Taller→Requisición, Compras→Panel (RF-AUTH-02) | ✅ 3 tests |
| S1-15 | Unit front | Login inválido muestra "Credenciales inválidas." sin entrar | ✅ |
| S1-16 | Unit front | Nav filtrado por rol (taller ve solo Requisición+Catálogo) y guarda de módulo /compras→landing (RF-USR-03) | ✅ |
| S1-17 | Unit front | Sin sesión, ruta protegida redirige a /login | ✅ |
| S1-18 | Unit front | Salir cierra sesión y regresa al login (RF-AUTH-03) | ✅ |
| — | Unit front | Flujos del demo (dashboard/ficha/requisición/compras/usuarios/tour) siguen en verde | ✅ 14/14 total |

### E2E — Playwright (`e2e/login.spec.ts`), SPA + API real + BD sembrada

| ID | Caso (doc 06 §4 AUTH) | Resultado |
|---|---|---|
| S1-19 | Dirección aterriza en Tablero Directivo con su nombre en el nav | ✅ |
| S1-20 | Taller aterriza en Requisición; nav sin Compras/Tablero | ✅ |
| S1-21 | Compras aterriza en su Panel | ✅ |
| S1-22 | Credenciales inválidas → error genérico, permanece en /login | ✅ |
| S1-23 | Salir revoca la sesión y regresa al login | ✅ |

**Compuerta `./verificar.sh`: EN VERDE (8/8 pasos, ahora incluye Playwright E2E).**

## Trazabilidad

RF-AUTH-01 ✅ (S1-01/02/19) · RF-AUTH-02 ✅ (S1-01/19-21) · RF-AUTH-03 ✅ (S1-07/18/23) · RF-USR-03 (matriz/visibilidad) ✅ (S1-10/16/20) · RNF-04 parcial (RBAC server-side S1-12/13; propiedad anti-IDOR llega con recursos en S3) · RNF-05 ✅ (hash Shield + expiración/revocación S1-07/08).

## Hallazgos y desviaciones

1. **Filtro `api-auth` stateless**: el autenticador de Shield cachea el usuario por proceso; el filtro verifica el Bearer token con `check()` en cada request (correcto para API y para tests).
2. **Shield exige `Security::$csrfProtection = 'session'`** aunque la API no usa CSRF (solo se manifiesta fuera de `testing`); ajustado, y `defaultAuthenticator = 'tokens'`.
3. **Permisos extendidos al SRS**: la matriz incluye los módulos `taller` y `diesel` (pantallas de los sprints 4 y 5); el landing de roles sin pantalla aún cae en Catálogo.
4. **E2E**: el puerto 5173 tenía el Vite del demo viejo; los webServer de Playwright reusan servidores — cuidar que el 5173 sea el de `apps/web`.
5. El label del pie del nav cambió de "Datos demo en vivo · Jul 2026" a "Sesión activa · Hub v1" (ya no son datos demo; el resto de la estética es idéntica).

## Estado de la compuerta

✅ **Sprint 1 COMPLETO al 100%.**
