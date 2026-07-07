# Evidencia de pruebas — Sprint 3: Requisiciones + Valorización Yonke

| | |
|---|---|
| **Sprint** | 3 — El flujo diferenciador: Compra/Yonke con foto y cascada |
| **Fecha** | 2026-07-07 |
| **Objetivo** | `POST /requisiciones` con foto real validada fuera del webroot, `ValorizacionService` A→C→manual (ADR-002), policy anti-IDOR, notificación a Compras encolada, y el formulario del taller cableado con subida real. |
| **Referencias** | Roadmap doc 07 §Sprint 3 · doc 06 §2.4 y §2.10 · ADR-002 · doc 04 §A08/§A01 · doc 05 §5 |

## Pruebas ejecutadas

### Backend — PHPUnit Feature (`tests/feature/RequisicionesTest.php`)

| ID | Tipo | Caso (doc 06) | Test | Resultado |
|---|---|---|---|---|
| S3-01 | Feature | §2.4 **Nivel A**: Yonke con histórico de compra → costo = última compra, marca `ultima_compra` | `testYonkeConHistoricoDeCompraUsaUltimaCompra` | ✅ ($6,400 del Kit de clutch facturado) |
| S3-02 | Feature | §2.4 **Nivel C**: sin histórico pero en catálogo → `precio_referencia`, marca `catalogo` | `testYonkeSinHistoricoPeroEnCatalogoUsaCatalogo` | ✅ ($3,200 del Alternador) |
| S3-03 | Feature | §2.4 **Manual**: A y C fallan → 422 sin costo; 201 marcado `manual` con costo > 0 | `testYonkeSinHistoricoNiCatalogoExigeManual` | ✅ |
| S3-04 | Feature | §2.4 Yonke con costo 0 forzado → 422 (**nunca $0**) | `testYonkeConCostoCeroForzadoEs422` | ✅ |
| S3-05 | Feature | §2.4 Yonke sin donante → 422 | `testYonkeSinDonanteEs422` | ✅ |
| S3-06 | Feature | §2.4 donante que no es Yonke → 409 | `testDonanteQueNoEsYonkeEs409` | ✅ |
| S3-07 | Feature | §2.4 sin foto → 422 (RF-REQ-04) | `testSinFotoEs422` | ✅ |
| S3-08 | Feature | §2.4 sin unidad destino → 422 (RF-INT-01) | `testSinUnidadDestinoEs422` | ✅ |
| S3-09 | Seguridad | §2.4 rol no taller → 403 | `testRolNoTallerEs403` | ✅ |
| S3-10 | Seguridad | §2.10 A08 subir `.php` disfrazado → 422 (MIME real con finfo + extensión + tamaño) | `testSubirPhpDisfrazadoDeFotoEsRechazado` | ✅ |
| S3-11 | Seguridad | §2.10 A08 `origen_costo_estimado` del cliente **ignorado** (lo asigna la cascada) | `testOrigenCostoEstimadoDelClienteEsIgnorado` | ✅ |
| S3-12 | Feature/Seguridad | Foto con nombre aleatorio bajo `writable/uploads` (nunca `public/`) + **notificación encolada** en `queue_jobs` (RF-REQ-06, no bloqueante) | `testLaFotoSeGuardaFueraDelWebrootYLaNotificacionSeEncola` | ✅ |
| S3-13 | Seguridad | §2.10 A01 anti-IDOR: taller solo ve SUS requisiciones; compras/admin ven todas | `testTallerSoloVeSusRequisiciones` | ✅ |
| S3-14 | Seguridad | §2.10 A01 anti-IDOR: foto de requisición ajena → 403 | `testFotoDeOtroTallerEs403` | ✅ |

**PHPUnit total: 49 tests / 183 aserciones.** PHPStan nivel 8: 0 errores.

### Frontend — Vitest + RTL

| ID | Caso | Resultado |
|---|---|---|
| S3-15 | Validaciones verbatim en secuencia (destino → pieza → donante → foto), **subida de archivo real**, 422 de la cascada del backend en el campo de costo, envío `manual` con toast + costo | ✅ |
| S3-16 | Pieza en catálogo SIN costo manual: el backend la valoriza (cascada C, $3,200 `catalogo`) y el toast lo informa | ✅ |
| — | Suite completa | ✅ 18/18 |

### E2E — Playwright (`e2e/requisicion.spec.ts`), SPA + API + BD reales

| ID | Caso | Resultado |
|---|---|---|
| S3-17 | Requisición Yonke completa con **foto PNG real**: cascada por catálogo ($4,500), toast con costo, y verificación vía API como Compras (`costo_estimado=4500`, `origen=catalogo`, foto renombrada `[a-f0-9]{32}.png`) | ✅ |
| S3-18 | Validación del donante Yonke verbatim | ✅ |
| — | Suite E2E completa (login + catálogo + requisición) | ✅ 9/9 |

**Compuerta `./verificar.sh`: EN VERDE (8/8).**

## Trazabilidad

RF-REQ-01 ✅ (S3-07/08/15) · RF-REQ-02 ✅ (S3-05/06/18) · RF-REQ-03 ✅ (S3-01..04, cascada completa) · RF-REQ-04 ✅ (S3-07/10) · RF-REQ-05 ✅ (S3-15/16, formulario dinámico) · RF-REQ-06 ✅ (S3-12, cola) · RF-REQ-07 ✅ (creación 24/7 vía API sin dependencia manual) · RF-INT-01 ✅ (S3-08) · RF-INT-02/04 ✅ (S3-11/12, estimado marcado y trazado) · RNF-04 anti-IDOR ✅ (S3-13/14).

## Hallazgos y desviaciones

1. **Feature tests con archivos**: `UploadedFile::isValid/move` exigen `is_uploaded_file()` (imposible de simular); el service verifica explícitamente (manteniendo `is_uploaded_file` fuera de `testing`) y usa `copy()` en testing. Además el servicio `Superglobals` de CI4 toma un **snapshot** de `$_FILES`: en tests hay que llamar `service('superglobals')->setFilesArray()`.
2. **PHPStan** se quedó sin memoria al crecer el código; la compuerta ahora corre con `--memory-limit=1G`.
3. El toast de éxito ahora informa el costo estimado calculado y su origen (extensión útil; el texto base del demo se conserva).
4. Interinidad conocida: el Panel de Compras sigue leyendo datos mock hasta el Sprint 4, por lo que una requisición real recién creada aún no aparece ahí (verificada vía API en S3-17).
5. BD dev re-sembrada al cierre (los E2E crean requisiciones reales).

## Estado de la compuerta

✅ **Sprint 3 COMPLETO al 100%.**
