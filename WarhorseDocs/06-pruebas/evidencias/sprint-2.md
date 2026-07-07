# Evidencia de pruebas — Sprint 2: Catálogo de unidades + Consolidado

| | |
|---|---|
| **Sprint** | 2 — Fuente única de la flota y base del consolidado |
| **Fecha** | 2026-07-07 |
| **Objetivo** | CRUD de unidades (admin) con máquina de estados §4.1, `ConsolidadoService` 1:1, ficha base (RF-FIC-01..04), auditoría de cambios sensibles, y el SPA con catálogo vivo + alta/edición. |
| **Referencias** | Roadmap doc 07 §Sprint 2 · Plan de pruebas doc 06 §2.2 y §2.8 · DDL doc 03 · Contrato doc 05 §3 |

## Pruebas ejecutadas

### Backend — PHPUnit Feature (`tests/feature/UnidadesTest.php`)

| ID | Tipo | Caso (doc 06) | Test | Resultado |
|---|---|---|---|---|
| S2-01 | Feature | doc 05 §1.6 listado paginado `{data, meta}` + filtro `?estado=` | `testListadoPaginadoYFiltroPorEstado` | ✅ |
| S2-02 | Feature | §2.2 alta válida → 201, fila 1:1 en `consolidado_unidad`, auditada | `testAltaValidaCreaConsolidadoYAudita` | ✅ |
| S2-03 | Feature | §2.2 `id_unidad` duplicado → 409 | `testAltaDuplicadaEs409` | ✅ |
| S2-04 | Seguridad | §2.2 alta por rol no admin → 403 | `testAltaPorRolNoAdminEs403` | ✅ |
| S2-05 | Feature | §2.2 `valor_referencia` no numérico → 422 | `testValorReferenciaNoNumericoEs422` | ✅ |
| S2-06 | Feature | §2.2 cambio a Yonke → disponible como donante + auditado (RF-UNI-03) | `testCambioAYonkeLaVuelveDonanteYAudita` | ✅ |
| S2-07 | Feature | RF-INT-05 cambio de `valor_referencia` auditado | `testCambioDeValorReferenciaSeAudita` | ✅ |
| S2-08 | Seguridad | PATCH por rol no admin → 403 | `testPatchPorRolNoAdminEs403` | ✅ |
| S2-09 | Feature | **§2.8 máquina de estados exhaustiva** (6 celdas: A→Y OK, A→I OK, Y→A OK, Y→I OK, I→A 409, I→Y 409) | `testMaquinaDeEstadosExhaustiva` | ✅ |
| S2-10 | Feature | PATCH unidad inexistente → 404 | `testPatchUnidadInexistenteEs404` | ✅ |
| S2-11 | Feature | RF-FIC-01..03 ficha activa: KPIs del consolidado, 86 días, pieza Yonke `es_estimado` con donante | `testFichaDeUnidadActiva` | ✅ |
| S2-12 | Feature | RF-FIC-04 ficha Yonke: sin reparaciones, con piezas donadas | `testFichaDeYonkeMuestraDonaciones` | ✅ |
| S2-13 | Feature | ficha inexistente → 404 | `testFichaInexistenteEs404` | ✅ |

**PHPUnit total: 34 tests / 115 aserciones.** PHPStan nivel 8: 0 errores.

### Frontend — Vitest + RTL

| ID | Caso | Resultado |
|---|---|---|
| S2-14 | Admin da de alta unidad desde el modal → toast + fila + **propagación al selector de Requisición** (RF-UNI-01/02) | ✅ |
| S2-15 | Alta duplicada muestra el 409 del backend en el modal | ✅ |
| S2-16 | Taller NO ve los controles de admin (+Agregar/Editar) | ✅ |
| — | Suite previa (auth, guardas, flujos del demo) sigue en verde | ✅ 17/17 total |

### E2E — Playwright (`e2e/catalogo.spec.ts`), SPA + API + BD reales

| ID | Caso | Resultado |
|---|---|---|
| S2-17 | Alta real por admin → toast → fila en catálogo → **selector del taller la muestra** (catálogo vivo end-to-end) | ✅ |
| S2-18 | Alta duplicada (WH125): el 409 del backend llega al modal | ✅ |
| — | Suite E2E completa (login + catálogo) | ✅ 7/7 |

**Compuerta `./verificar.sh`: EN VERDE (8/8).**

## Trazabilidad

RF-UNI-01 ✅ (S2-01/14/17) · RF-UNI-02 ✅ (S2-02/03/05) · RF-UNI-03 ✅ (S2-06/09) · RF-UNI-04 ✅ (S2-01, filtros UI) · RF-UNI-05 ✅ (Ver ficha) · RF-FIC-01..04 ✅ a nivel API (S2-11..13; la UI de ficha se cablea en S5) · RF-INT-05 parcial ✅ (alta/estado/valor auditados).

## Hallazgos y desviaciones

1. **UI extendida (decisión de plan)**: el demo no tenía alta/edición de unidades; se agregó modal "+ Agregar unidad" y "Editar" (solo admin) con la estética del design system.
2. **Tour vs E2E**: `addInitScript` debe llamarse **antes** de `page.goto` — si no, el overlay del tour (primer ingreso) tapa la UI y los clicks del E2E expiran. Con el fix, la suite E2E bajó de 2-4 min a ~16 s.
3. Los E2E crean unidades `E2E######` en la BD de desarrollo; al cierre del sprint se re-corrió `InitialSeeder` para dejarla limpia.
4. Se agregó `App\Libraries\Bd` (filas/fila) para satisfacer PHPStan 8 ante `ResultInterface|false` del Query Builder.

## Estado de la compuerta

✅ **Sprint 2 COMPLETO al 100%.**
