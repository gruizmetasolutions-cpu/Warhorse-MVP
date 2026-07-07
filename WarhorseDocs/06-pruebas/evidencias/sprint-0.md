# Evidencia de pruebas — Sprint 0: Cimientos

| | |
|---|---|
| **Sprint** | 0 — Cimientos (monorepo + BD + pipeline) |
| **Fecha** | 2026-07-07 |
| **Objetivo** | Monorepo operativo (`apps/web` + `apps/api`), esquema de BD aplicado en la BD real, seeders reproducibles y compuerta de calidad (`verificar.sh`) en verde. |
| **Referencias** | Roadmap doc 07 §Sprint 0 · DDL doc 03 §4 · Plan de pruebas doc 06 §1.2/§5 |
| **Commits** | `8298f59` (scaffold) + commit de cierre de este sprint |

## Pruebas ejecutadas

| ID | Tipo | Módulo | Caso (doc) | Cómo se verificó | Resultado |
|---|---|---|---|---|---|
| S0-01 | Estático front | apps/web | doc 06 §1 (tsc cero errores) | `npm run typecheck` | ✅ 0 errores |
| S0-02 | Estático front | apps/web | doc 06 §1 (ESLint limpio) | `npm run lint` | ✅ 0 errores |
| S0-03 | Unitaria front | apps/web (demo promovido) | flujos del demo | `npm run test` — Vitest + RTL | ✅ 10/10 |
| S0-04 | Estático back | apps/api | doc 06 §1 (PHPStan nivel 8) | `php vendor/bin/phpstan analyse` | ✅ 0 errores |
| S0-05 | Unitaria back | apps/api (appstarter) | base del framework | `vendor/bin/phpunit` | ✅ 5 tests, 7 aserciones |
| S0-06 | Seguridad deps | apps/web | doc 06 §5 (npm audit) | `npm audit --audit-level=high` | ✅ 0 vulnerabilidades |
| S0-07 | Seguridad deps | apps/api | doc 06 §5 (composer audit) | `composer audit` | ✅ 0 advisories |
| S0-08 | Integración BD | migraciones | doc 07 S0 (migrate reproducible) | `php spark migrate --all` contra la BD real (Hostinger) | ✅ 9 tablas dominio + Shield/Settings/Queue |
| S0-09 | Integración BD | seeders | doc 07 S0 (seed reproducible) | `php spark db:seed InitialSeeder` **dos veces** + `migrate:refresh --all -f` + seed desde cero; conteos exactos (9 unidades, 6 usuarios, 8 piezas, 8 requisiciones, 10 taller, 10 diésel, 9 consolidados, 1 parámetros) | ✅ reproducible |
| S0-10 | Integridad BD | consolidado_unidad | doc 03 §5 (columna generada) | WH125: 18000+43500+32000 → `costo_real_acumulado` = **93,500.00** | ✅ |
| S0-11 | Integridad BD | requisiciones | doc 03 §4 (CHECK invariantes) | INSERT Yonke con `numero_factura` → rechazado por `chk_req_yonke_donante` en la BD | ✅ defensa en profundidad activa |
| S0-12 | Smoke conexión | BD real | doc 07 S0 | mysqli directo: conexión OK, `SELECT DATABASE()` correcto | ✅ |
| S0-13 | Integración BD tests | esquema | doc 06 §1.2 (BD aislada por suite) | `tests/database/EsquemaTest.php`: migraciones completas contra la BD de pruebas + 10 tablas presentes | ✅ 3/3 |
| S0-14 | Integridad BD tests | consolidado / requisiciones | doc 03 §5 + RF-INT-03 | columna generada suma 350.75 y CHECK Yonke-con-factura rechazado, ahora como tests PHPUnit permanentes | ✅ |

**Compuerta `./verificar.sh`: EN VERDE (7/7 pasos; PHPUnit 8 tests / 20 aserciones).**

## Trazabilidad

Este sprint no implementa RF de negocio; habilita la base para todos (esquema doc 03 = soporte de RF-UNI/DIE/REQ/COM/TAL/DASH/USR/INT). La verificación de integridad S0-10/S0-11 anticipa RF-INT-02/03 a nivel BD.

## Hallazgos y desviaciones

1. **La BD real es MariaDB 11.8 (Hostinger), no MySQL 8** como asume el doc 03. Ajuste aplicado: collation `utf8mb4_0900_ai_ci` → `utf8mb4_unicode_ci` (existe en ambos motores). CHECKs, columna generada STORED, JSON y ENUM funcionan igual. **Acción sugerida**: anotar en el doc 03 la compatibilidad MariaDB o confirmar que producción será MySQL 8.
2. **BD de pruebas: RESUELTO.** hPanel no permitía crearla con el usuario existente, así que la BD de pruebas corre en Docker local: contenedor `warhorse_test_db`, **MariaDB 11.8.8 — la misma versión exacta del servidor real** (`mariadb:11.8`, puerto 3309, BD `warhorse_test`). Grupo `tests` configurado en `.env` (con `DBPrefix` vacío; el default del appstarter es `db_`). Ventaja adicional: los tests no pagan latencia de red.
3. **Sin driver de cobertura PHP** (pcov/xdebug no instalados): la medición de cobertura ≥80% del doc 06 se hará efectiva a más tardar en el Sprint 6 instalando `pcov`.
4. **Latencia BD remota**: las migraciones/seeds tardan segundos por viaje de red; para los tests Feature se evaluará minimizar round-trips (transacción con rollback por test).

## Estado de la compuerta

✅ **Sprint 0 COMPLETO al 100%.** Único pendiente no bloqueante: instalar `pcov` para medir cobertura (hallazgo 3), a más tardar en el Sprint 6.
