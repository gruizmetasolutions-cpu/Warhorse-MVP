# Evidencia de pruebas — Sprint 5: Dashboard + Veredicto + Diésel

| | |
|---|---|
| **Sprint** | 5 — Dashboard real con veredicto server-side, módulo Diésel y ficha completa |
| **Fecha** | 2026-07-08 |
| **Objetivo** | POST/GET /diesel con pantalla nueva; GET /dashboard con KPIs O(1) del consolidado, ranking con `critico`, eficiencia km/L real, % mantenimiento y veredicto Mantener/Evaluar/Vender server-side; PATCH /parametros/veredicto con UI de ajuste (solo admin, auditado); ficha completa cableada (último mock fuera); rendimiento doc 06 §3. |
| **Referencias** | Roadmap doc 07 §Sprint 5 · doc 06 §2.3, §2.6 y §3 · doc 05 §4/§8 · SRS RF-DIE/RF-DASH/RF-FIC |

## Pruebas ejecutadas

### Backend — PHPUnit Feature (`DieselTest.php` + `DashboardTest.php` + `ParametrosTest.php`)

| ID | Tipo | Caso (doc 06) | Test | Resultado |
|---|---|---|---|---|
| S5-01 | Feature | §2.3 carga válida → 201 + consolidado actualizado + auditoría `diesel.carga` (RF-DIE-01/02, RF-INT-05) | `testCargaValidaActualizaConsolidado` | ✅ |
| S5-02 | Feature | §2.3 texto en `costo_total` → 422 (validación numérica estricta) | `testTextoEnCostoTotalEs422` | ✅ |
| S5-03 | Feature | litros 0 y negativos → 422 | `testLitrosNoPositivosEs422` | ✅ |
| S5-04 | Feature | §2.3 unidad inexistente → 422 sin transacción huérfana (RF-INT-01) | `testUnidadInexistenteEs422SinTransaccionHuerfana` | ✅ |
| S5-05 | Seguridad | §2.3 rol no diesel (taller y admin) → 403 en POST (doc 05 §10) | `testCargaPorRolNoDieselEs403` | ✅ |
| S5-06 | Feature | GET /diesel con filtros `unidad_id/desde/hasta` + paginación (RF-DIE-03) | `testListadoConFiltrosYPaginacion` | ✅ |
| S5-07 | Seguridad | GET /diesel: admin 200, taller 403 | `testListadoPermitidoParaAdminYVetadoParaTaller` | ✅ |
| S5-08 | Feature | §2.6 KPIs O(1) del consolidado + ranking desc con un solo `critico` + parámetros expuestos (RF-DASH-01) | `testKpisYRankingConCritico` | ✅ |
| S5-09 | Feature | §2.6 veredicto sobre umbral con mejoralitos → **Vender** con razón textual del demo; eficiencia 1.2 km/L real; 33/67% mantenimiento (RF-DASH-02/03/04) | `testVeredictoSobreUmbralConMejoralitoEsVender` | ✅ |
| S5-10 | Feature | §2.6 veredicto bajo umbral → **Mantener** (razón "debajo del umbral") | `testVeredictoBajoUmbralEsMantener` | ✅ |
| S5-11 | Feature | sobre umbral sin mejoralitos → **Evaluar**; sin cargas de diésel `eficiencia_km_l = null` (RF-DASH-02/04) | `testSobreUmbralSinMejoralitosEsEvaluar` | ✅ |
| S5-12 | Feature | §2.6 sin `valor_referencia` → `veredicto: null` + `valor_referencia_pendiente: true` | `testUnidadSinValorReferenciaVeredictoNull` | ✅ |
| S5-13 | Feature | §2.6 ajuste de umbral recalcula (50% → Mantener; 40% → Vender) y la **ventana** también (1 mes → 100% mejoralito) (RF-DASH-05) | `testAjusteDeUmbralRecalculaVeredicto` | ✅ |
| S5-14 | Seguridad | §2.6 GET /dashboard por rol no admin → 403 (RF-DASH-06) | `testAccesoPorRolNoAdminEs403` | ✅ |
| S5-15 | Feature | GET /parametros/veredicto devuelve los sembrados (40/12) | `testLecturaDevuelveUmbralYVentanaSembrados` | ✅ |
| S5-16 | Feature | PATCH válido actualiza y **audita** `parametros.veredicto` (doc 05 §8) | `testAjusteValidoActualizaYAudita` | ✅ |
| S5-17 | Feature | fuera de rango (umbral <20/>80, ventana <1/>36, texto) → 422 sin cambios | `testFueraDeRangoEs422` | ✅ |
| S5-18 | Seguridad | GET/PATCH parámetros por rol no admin → 403 | `testAjustePorRolNoAdminEs403` | ✅ |

**PHPUnit total: 88 tests / 547 aserciones (suite completa).** PHPStan nivel 8: 0 errores.

### Rendimiento — doc 06 §3 (`tests/rendimiento/RendimientoTest.php`, BD de pruebas local MariaDB 11.8)

Escenario sembrado con `CargaSeeder` (determinista): **209 unidades / 5.008 requisiciones** + ~2.100 cargas de diésel + 1.000 registros de taller.

| Verificación | Resultado |
|---|---|
| `EXPLAIN` cola de Compras filtrada (`estado=Solicitado`, top-N): índice `idx_req_cola (estado, urgencia DESC, fecha_solicitud)`, **cero `Using filesort`** | ✅ |
| `EXPLAIN` cola sin filtro (top-N): índice `idx_req_cola_global (urgencia DESC, fecha_solicitud)`, **cero `Using filesort`** | ✅ |
| `EXPLAIN` dashboard: solo toca `unidades` + `consolidado_unidad` (O(unidades), sin N+1 sobre transacciones) | ✅ |
| p95 GET /dashboard | **5.0 ms** (< 400 ms) ✅ |
| p95 GET /compras/requisiciones?estado=Solicitado | **3.9 ms** (< 400 ms) ✅ |
| p95 GET /compras/requisiciones (sin filtro) | **3.6 ms** (< 400 ms) ✅ |

Notas de ingeniería del sprint:
- El `ORDER BY FIELD(urgencia, …)` original nunca podía usar índice; se reemplazó por `ORDER BY urgencia DESC` (el ENUM ya ordena Rápida<Media<Crítica) y la cola quedó **paginada** (top-N, `per_page` ≤ 200, default 100), que es lo que permite al optimizador resolver el orden por índice.
- Migración `2026-07-08-000001_IndiceColaCompras`: sustituye `idx_req_estado_urgencia` por `idx_req_cola` + `idx_req_cola_global` (MariaDB 11.8 soporta columnas DESC en índices). Aplicada en BD de pruebas y en la BD de desarrollo.
- `CargaSeeder` cierra con `ANALYZE TABLE`: sin estadísticas frescas tras el bulk insert el optimizador elegía un plan con `Using temporary; Using filesort`.
- Los tiempos son in-process (framework + SQL, sin capa HTTP/red): la aproximación local del p95; la medición sobre Hostinger mediría la latencia del enlace, no la del sistema.

### Frontend — Vitest + RTL (`demo.test.tsx`)

| ID | Caso | Resultado |
|---|---|---|
| S5-19 | Diésel: Greisy aterriza en su pantalla nueva (landing por rol), validación en cliente, carga válida → toast + fila en "Cargas recientes" (RF-DIE-01/02) | ✅ |
| S5-20 | Diésel: 422 numérico del backend mostrado verbatim | ✅ |
| S5-21 | Dashboard: ajustar umbral 40→50 recalcula a Mantener y 50→40 regresa a Vender, con "Umbral X% · Ventana Y meses" visible (RF-DASH-05) | ✅ |
| S5-22 | Dashboard consume `getDashboard` real-mock: Vender/razón/67% mejoralito/KPI $270,600; clic en barra re-selecciona (adaptados del sprint anterior) | ✅ |
| S5-23 | Ficha consume `getFicha`: historial (86 días), pieza Yonke "donada por WH60"; ficha de unidad Yonke con donaciones | ✅ |
| — | Suite completa | ✅ 22/22 |

`lib/mock/` quedó reducido a la matriz visual de Usuarios (módulo de solo lectura hasta el Sprint 6): **Dashboard y Ficha ya no consumen ningún mock**; `getDatos()` y las fixtures del demo se eliminaron.

### E2E — Playwright (`e2e/dashboard-diesel.spec.ts`), SPA + API + BD reales

| ID | Caso | Resultado |
|---|---|---|
| S5-24 | **Dashboard**: WH125 llega seleccionada con Vender + razón textual server-side (45% de $210,000, 67% mejoralito); clic en WH101 → Mantener; ajuste de umbral a 50% recalcula a Mantener y regreso a 40% → Vender; "Ver ficha completa" abre la ficha real con historial y pieza Yonke | ✅ |
| S5-25 | **Diésel**: Greisy aterriza en su pantalla (nav sin Tablero), registra carga de CJ12 y el consolidado sube exactamente el costo (verificación server-side vía API: 3.500 → 6.572,75) | ✅ |
| — | Suite E2E completa (con reseed automático previo) | ✅ 13/13 |

**Compuerta `./verificar.sh`: EN VERDE (8/8)** — tsc · ESLint · Vitest 22/22 · Playwright 13/13 · PHPStan nivel 8 · PHPUnit 88 · npm audit · composer audit.

## Trazabilidad

RF-DIE-01 ✅ (S5-01/02/03/19) · RF-DIE-02 ✅ (S5-01/25) · RF-DIE-03 ✅ (S5-06/07) · RF-DASH-01 ✅ (S5-08/22) · RF-DASH-02 ✅ (S5-09/11) · RF-DASH-03 ✅ (S5-09) · RF-DASH-04 ✅ (S5-09..12/24) · RF-DASH-05 ✅ (S5-13/16/17/21/24) · RF-DASH-06 ✅ (S5-14/18) · RF-FIC-01..04 ✅ (S5-23/24; el endpoint /ficha existe desde S2, este sprint lo cableó al SPA) · RF-INT-01 ✅ (S5-04) · RF-INT-05 ✅ (S5-01/16) · Rendimiento doc 06 §3 ✅ (tabla de arriba).

## Pendientes / hallazgos

- **Incidente (resuelto)**: al intentar apuntar spark a la BD local por variables de entorno se descubrió que CI4 no las respeta sobre `.env`, y un `migrate:refresh -n App` corrió contra la BD de desarrollo revirtiendo también las migraciones de Shield/Settings/Queue. Se restauró de inmediato (`migrate --all` + `InitialSeeder`) y la suite E2E completa confirma el estado. Lección: toda operación de BD local para pruebas se hace vía PHPUnit (grupo `tests`), nunca con overrides de entorno.
- `?periodo=YYYY-MM` de GET /dashboard (doc 05 §8) queda sin implementar: la UI del demo no tiene selector de periodo (chip estático "JULIO 2026") y los KPIs del contrato salen del consolidado O(1); si Dirección lo pide, requerirá agregación por fechas. Registrado para re-sync del doc 05 en el DoD.
- El veredicto usa el Costo Real Acumulado del consolidado (fiel al ejemplo del contrato §8) y la **ventana** acota la evidencia operativa (liberaciones para % mejoralito y cargas para eficiencia), interpretación de RF-DASH-04 "ponderando por % de mejoralitos".
- pcov para cobertura sigue pendiente (≤ Sprint 6).
