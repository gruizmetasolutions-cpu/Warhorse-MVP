# Evidencia de pruebas — Sprint 4: Compras + Taller

| | |
|---|---|
| **Sprint** | 4 — Ciclos de estado y transacciones multi-tabla |
| **Fecha** | 2026-07-07 |
| **Objetivo** | Panel de Compras real con la máquina §4.2 y transacción ACID de instalación; módulo Taller con liberación Total/Parcial, alerta de deuda técnica y reincidencia; pantalla Taller nueva. |
| **Referencias** | Roadmap doc 07 §Sprint 4 · doc 06 §2.5, §2.7 y §2.9 · doc 02 §4.3/§4.4 · doc 05 §6/§7 |

## Pruebas ejecutadas

### Backend — PHPUnit Feature (`ComprasTest.php` + `TallerTest.php`)

| ID | Tipo | Caso (doc 06) | Test | Resultado |
|---|---|---|---|---|
| S4-01 | Feature | RF-COM-01 cola ordenada Crítica→Media→Rápida + filtro estado | `testColaOrdenadaPorUrgenciaYFiltrable` | ✅ |
| S4-02 | Seguridad | cola prohibida para taller → 403 | `testColaProhibidaParaTaller` | ✅ |
| S4-03 | Feature | **§2.7 matriz exhaustiva** (12 celdas: rutas legales Compra/Yonke y todas las ilegales → 409, incluido Instalado terminal) | `testMatrizDeTransicionesExhaustiva` | ✅ |
| S4-04 | Feature | §2.7 Comprado sin `costo_real` → 422 (RF-COM-02) | `testCompradoSinCostoRealEs422` | ✅ |
| S4-05 | Feature | §2.7 Yonke con factura → 409 (RF-INT-03) | `testYonkeConFacturaEs409` | ✅ |
| S4-06 | Seguridad | PATCH por rol taller → 403 | `testAvanzarPorRolTallerEs403` | ✅ |
| S4-07 | Feature | requisición inexistente → 404 | `testRequisicionInexistenteEs404` | ✅ |
| S4-08 | Feature | **ACID**: instalar Compra suma `costo_real` a `total_refacciones` del destino + auditoría `requisicion.instalada` + `fecha_instalacion` | `testInstalarCompraSumaCostoRealAlConsolidadoYAudita` | ✅ |
| S4-09 | Feature | **ACID**: instalar Yonke suma el `costo_estimado` al consolidado | `testInstalarYonkeSumaEstimadoAlConsolidado` | ✅ |
| S4-10 | Feature | **Atomicidad**: transición ilegal no toca consolidado ni estado | `testTransicionIlegalNoTocaElConsolidado` | ✅ |
| S4-11 | Feature | §2.5 ingreso válido queda "En Taller" (liberación null) | `testIngresoValidoQuedaEnTaller` | ✅ |
| S4-12 | Feature | §2.5 unidad inexistente → 422 (RF-INT-01) | `testIngresoConUnidadInexistenteEs422` | ✅ |
| S4-13 | Seguridad | ingreso por rol compras → 403 | `testIngresoPorRolComprasEs403` | ✅ |
| S4-14 | Feature | §2.5 liberación Total suma a `total_taller` + auditoría (RF-TAL-02) | `testLiberacionTotalSumaAlConsolidado` | ✅ |
| S4-15 | Feature | §2.5 liberación Parcial → alerta de deuda técnica + `candidata_reincidencia` + auditoría (RF-TAL-03/04) | `testLiberacionParcialGeneraAlertaYMarcaCandidata` | ✅ |
| S4-16 | Feature | §2.5 Parcial sin pendientes → 422 | `testLiberacionParcialSinPendientesEs422` | ✅ |
| S4-17 | Feature | §2.5 reingreso por la MISMA falla tras mejoralito → `es_reincidencia=1`; falla distinta → no | `testReingresoPorMismaFallaTrasMejoralitoEsReincidencia` | ✅ |
| S4-18 | Feature | **§2.9 exhaustiva**: liberar dos veces (desde Total y desde Parcial) → 409 | `testLiberarDosVecesEs409` | ✅ |
| S4-19 | Feature | liberar registro inexistente → 404 | `testLiberarRegistroInexistenteEs404` | ✅ |
| S4-20 | Feature | GET /taller con `id_unidad` y `dias_en_taller` derivados | `testListadoDeTallerConDiasDerivados` | ✅ |

**PHPUnit total: 69 tests / 299 aserciones.** PHPStan nivel 8: 0 errores.

### Frontend — Vitest + RTL

| ID | Caso | Resultado |
|---|---|---|
| S4-21 | Compras real: modal "Registrar compra" con 422 del backend sin costo/factura; con datos → Comprado; Yonke → Instalado con confirmación (RF-COM-02/03) | ✅ |
| S4-22 | Taller: validación de ingreso, liberación Parcial sin pendientes → error verbatim; con pendientes → toast de mejoralito y pase al historial (RF-TAL-01/03/04) | ✅ |
| — | Suite completa | ✅ 19/19 |

### E2E — Playwright (`e2e/ciclos.spec.ts`), SPA + API + BD reales

| ID | Caso | Resultado |
|---|---|---|
| S4-23 | **Ciclo de compra completo**: Balatas Cotizado → 422 sin datos → Comprado (costo $1,850 + F-E2E-1) → Instalado con confirmación → ✓ Cerrado | ✅ |
| S4-24 | **Taller**: ingreso real de WH210, liberación Parcial (error verbatim sin pendientes) → alerta de deuda técnica + verificación server-side de `candidata_reincidencia` vía API | ✅ |
| — | Suite E2E completa (11 tests, con reseed automático previo) | ✅ 11/11 |

**Compuerta `./verificar.sh`: EN VERDE (8/8).**

## Trazabilidad

RF-COM-01 ✅ (S4-01) · RF-COM-02 ✅ (S4-03/04/23) · RF-COM-03 ✅ (S4-03/09) · RF-COM-04 ✅ (badge Est. en panel real) · RF-TAL-01 ✅ (S4-11/12) · RF-TAL-02 ✅ (S4-14) · RF-TAL-03 ✅ (S4-15/16) · RF-TAL-04 ✅ (S4-15/17/24) · RF-INT-03 ✅ (S4-04/05) · RF-INT-05 ✅ (instalación/estado/liberaciones auditadas) · Transacciones ACID (regla 6 CLAUDE.md) ✅ (S4-08..10).

## Hallazgos y desviaciones

1. **UI extendida (plan)**: pantalla **Taller** nueva (ingreso + liberación Total/Parcial con pendientes) y modal de **costo real + factura** en Compras — el demo avanzaba estados sin capturar; el SRS lo exige. Estética del design system en ambos.
2. **E2E idempotentes**: los ciclos consumen estados sembrados (Balatas solo puede comprarse una vez); se agregó `globalSetup` de Playwright que re-siembra la BD antes de cada corrida de la suite.
3. **Latencia de BD remota**: expects de Playwright a 15s (el login contra Hostinger a veces excede los 5s por defecto) — eliminó los flaky.
4. En E2E, `getByLabel` no resolvía el `<select>` con label envolvente; se usa `getByRole('combobox', { name })`.

## Estado de la compuerta

✅ **Sprint 4 COMPLETO al 100%.**
