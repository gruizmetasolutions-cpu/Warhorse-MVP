# 05 — Especificación de la API
## Warhorse — Hub Consolidador de Gastos por Tracto

| | |
|---|---|
| **Documento** | 05 — Especificación de la API |
| **Versión** | 2.0 (congelada por el demo validado) |
| **Fecha** | 7 de julio de 2026 |
| **Auth** | CI4 Shield — Bearer token de acceso (header `Authorization`) |
| **Base URL** | `https://hub.warhorse.mx/api/v1` |
| **Formato** | JSON (request y response); `Content-Type: application/json` (multipart en subida de foto) |
| **Depende de** | [01 SRS](../01-vision/01_SRS_especificacion_requisitos.md), [03 Modelo de datos](../03-datos/03_modelo_de_datos.md), [04 Seguridad](../04-seguridad/04_plan_de_seguridad.md), [ADR-003](../02-arquitectura/ADR/ADR-003_demo-first-esqueleto-reutilizable.md) |

> *v2.0: este contrato es la firma de `lib/api.ts` del demo (Demo-First, [ADR-003](../02-arquitectura/ADR/ADR-003_demo-first-esqueleto-reutilizable.md)). Se considera congelado tras la validación del demo; cambios requieren nueva versión menor y re-sincronización del cliente.*

---

## 1. Convenciones

### 1.1 Versionado
Versión en la ruta: `/api/v1`. Un cambio incompatible incrementa a `/api/v2`.

### 1.2 Autenticación
- Se obtiene un token con `POST /auth/login`.
- Se adjunta en cada petición: `Authorization: Bearer <token>`.
- El refresh vive en cookie `HttpOnly`; el token de acceso se guarda en memoria del SPA.
- Revocación: `POST /auth/logout`. El backend valida expiración y revocación en cada request; el rol se resuelve server-side.

### 1.3 Códigos de estado HTTP

| Código | Semántica en Warhorse |
|---|---|
| 200 | OK (lectura o mutación sin creación). |
| 201 | Recurso creado (requisición, unidad, usuario, registro). |
| 204 | Operación sin cuerpo (logout, eliminación lógica). |
| 400 | Petición malformada (JSON inválido). |
| 401 | No autenticado / token inválido, expirado o revocado. |
| 403 | Autenticado pero sin permiso (rol o propiedad — IDOR). |
| 404 | Recurso inexistente. |
| 409 | Conflicto de estado (transición ilegal, duplicado de `id_unidad`). |
| 422 | Validación fallida (campos). |
| 429 | Rate limit excedido. |
| 500 | Error interno (sin detalle en producción). |

### 1.4 Formato de error estándar

```json
{
  "error": "validation",
  "message": "La foto de la pieza es obligatoria.",
  "fields": {
    "foto_pieza_url": ["required"],
    "unidad_donante_id": ["required_if:origen,Yonke"]
  }
}
```

`error` es un código estable (`validation`, `unauthenticated`, `forbidden`, `not_found`, `conflict`, `rate_limited`, `server_error`). `fields` solo aparece en 422.

### 1.5 Rate limiting

| Grupo de endpoints | Límite |
|---|---|
| `auth/login` | 5 / minuto / (IP+email) |
| Mutaciones (POST/PATCH/DELETE) | 60 / minuto / usuario |
| Lecturas (GET) | 240 / minuto / usuario |

### 1.6 Paginación
Parámetros `?page=<n>&per_page=<m>` (máx `per_page`=100, default 25). Respuesta:

```json
{
  "data": [ /* … */ ],
  "meta": { "page": 1, "per_page": 25, "total": 132, "total_pages": 6 }
}
```

---

## 2. Autenticación y sesión

### POST /auth/login — Iniciar sesión
Autentica por correo/contraseña; devuelve token y rol. RF-AUTH-01.

**Autenticación:** pública
**Rate limit:** grupo login

**Request:**
```json
{ "email": "montzay@warhorse.mx", "password": "••••••••" }
```

**Respuesta exitosa 200:**
```json
{
  "token": "eyJ...accessToken",
  "usuario": { "id": 2, "nombre": "Montzay Vázquez", "rol": "compras" },
  "landing": "compras"
}
```

**Respuestas de error:** 401 credenciales inválidas o usuario suspendido (mensaje genérico); 422 email/password ausentes; 429 rate limit.
**Seguridad:** verifica `activo=1`; no revela si falló usuario o contraseña; throttling por IP+email.

### POST /auth/logout — Cerrar sesión
Revoca el token actual. RF-AUTH-03.
**Autenticación:** Bearer. **Respuesta 204.** Cualquier uso posterior del token → 401.

### GET /auth/me — Usuario actual
Devuelve el usuario autenticado y sus módulos visibles (matriz de permisos, RF-USR-03).
**Respuesta 200:**
```json
{ "id": 2, "nombre": "Montzay Vázquez", "rol": "compras",
  "permisos": { "dashboard": false, "requisicion": false, "compras": true, "catalogo": true, "usuarios": false } }
```

---

## 3. Unidades (catálogo maestro)

### GET /unidades — Listar unidades
Fuente única de la flota. RF-UNI-01/04.
**Autenticación:** Bearer (cualquier rol; usado por selectores).
**Query:** `?estado=Activo|Yonke|Inactivo` (opcional), paginación.
**Respuesta 200:**
```json
{ "data": [
    { "id": 12, "id_unidad": "WH125", "tipo": "Tractor", "estado": "Activo",
      "valor_referencia": 620000.00, "costo_real_acumulado": 312500.00, "candidata_reincidencia": true },
    { "id": 3, "id_unidad": "WH03", "tipo": "Tractor", "estado": "Yonke",
      "valor_referencia": null, "costo_real_acumulado": 0.00, "candidata_reincidencia": false }
  ], "meta": { "page": 1, "per_page": 25, "total": 2, "total_pages": 1 } }
```

### POST /unidades — Alta de unidad
**Autenticación:** Bearer + rol `admin`. RF-UNI-02.
**Request:**
```json
{ "id_unidad": "WH130", "tipo": "Tractor", "estado": "Activo",
  "fecha_alta": "2026-07-01", "valor_referencia": 700000.00 }
```
**Respuesta 201:** la unidad creada. **Errores:** 409 `id_unidad` duplicado; 422 valor no numérico; 403 rol distinto de admin.

### PATCH /unidades/{id} — Editar / cambiar estado
**Autenticación:** Bearer + rol `admin`. RF-UNI-03.
**Request (parcial):** `{ "estado": "Yonke" }` o `{ "valor_referencia": 550000.00 }`.
**Respuesta 200.** **Errores:** 409 transición ilegal (§4.1 SRS); 403.
**Seguridad:** cambio de estado y `valor_referencia` se auditan.

### GET /unidades/{id}/ficha — Ficha de tracto
Encabezado, KPIs, reparaciones, piezas instaladas y (si Yonke) piezas donadas. RF-FIC-01..04.
**Autenticación:** Bearer.
**Respuesta 200:**
```json
{
  "unidad": { "id_unidad": "WH125", "tipo": "Tractor", "estado": "Activo", "valor_referencia": 620000.00 },
  "kpis": { "diesel": 180000.00, "refacciones": 92500.00, "taller": 40000.00, "costo_real_acumulado": 312500.00 },
  "reparaciones": [
    { "fecha_ingreso": "2026-03-01", "fecha_salida": "2026-05-26", "dias_en_taller": 86,
      "diagnostico": "Transmisión", "criticidad": "Crítico", "tipo_liberacion": "Total", "costo_taller": 32000.00 }
  ],
  "piezas_instaladas": [
    { "descripcion_pieza": "Turbo", "origen": "Yonke", "unidad_donante_id": "WH03",
      "costo": 4500.00, "es_estimado": true, "estado": "Instalado", "fecha": "2026-06-22" }
  ],
  "piezas_donadas": []
}
```
Para una unidad Yonke, `reparaciones`/`piezas_instaladas` van vacías y `piezas_donadas` trae las salidas hacia otras unidades.

---

## 4. Diésel

### POST /diesel — Registrar carga
**Autenticación:** Bearer + rol `diesel`. RF-DIE-01/02.
**Request:**
```json
{ "unidad_id": 12, "fecha": "2026-07-05", "litros": 320.5, "costo_total": 8975.00, "km_recorridos": 410 }
```
**Respuesta 201:** el registro; el consolidado de la unidad se actualiza. **Errores:** 422 valor no numérico o unidad ausente; 403.
**Seguridad:** validación numérica estricta; unidad validada contra catálogo (RF-INT-01).

### GET /diesel — Listar cargas
**Autenticación:** Bearer + rol `diesel` o `admin`. **Query:** `?unidad_id=&desde=&hasta=`, paginación.

---

## 5. Requisiciones

### POST /requisiciones — Crear requisición
**Autenticación:** Bearer + rol `taller`. RF-REQ-01..05.
**Request (multipart: campos + archivo `foto_pieza`):**
```json
{
  "unidad_destino_id": 14,
  "origen": "Yonke",
  "unidad_donante_id": 3,
  "descripcion_pieza": "Turbo",
  "numero_parte": null,
  "urgencia": "Crítica",
  "costo_estimado_manual": 4500.00
}
```
`costo_estimado_manual` solo se usa si la cascada cae a nivel manual; en los demás casos el backend calcula y lo ignora.

**Respuesta exitosa 201:**
```json
{
  "id": 87, "estado": "Solicitado", "origen": "Yonke",
  "unidad_destino_id": 14, "unidad_donante_id": 3,
  "descripcion_pieza": "Turbo", "urgencia": "Crítica",
  "costo_estimado": 4500.00, "origen_costo_estimado": "ultima_compra",
  "foto_pieza_url": "/uploads/ab12…jpg", "fecha_solicitud": "2026-07-01"
}
```

**Respuestas de error:**

| Código | Condición |
|---|---|
| 422 | Falta destino, descripción o foto; Yonke sin donante; Yonke sin costo cuando A y C fallan. |
| 403 | Rol distinto de `taller`. |
| 409 | `unidad_donante_id` no está en estado Yonke. |

**Seguridad:** foto obligatoria y validada (A08); `costo_estimado`/`origen_costo_estimado` calculados server-side por la cascada ([ADR-002](../02-arquitectura/ADR/ADR-002_valorizacion-yonke-cascada.md)); notificación a Compras encolada (asíncrona).

### GET /requisiciones — Listar (uso interno de ficha/taller)
**Autenticación:** Bearer. **Query:** `?unidad_destino_id=&unidad_donante_id=&estado=`.
**Seguridad:** rol `taller` solo ve las de su ámbito (policy anti-IDOR); Compras y admin ven todas.

---

## 6. Compras (gestión de ciclo)

### GET /compras/requisiciones — Cola de Compras
**Autenticación:** Bearer + rol `compras` o `admin`. RF-COM-01.
**Query:** `?estado=Solicitado|Cotizado|Comprado|Instalado` (default Todos); orden por urgencia Crítica→Media→Rápida.
**Respuesta 200:** lista con `origen`, `es_estimado`, `costo` (estimado o real), `urgencia`, `estado`, `unidad_destino_id`, `unidad_donante_id`.

### PATCH /compras/requisiciones/{id}/estado — Avanzar ciclo
**Autenticación:** Bearer + rol `compras`. RF-COM-02/03; máquina §4.2 SRS.
**Request (según transición):**
```json
{ "estado": "Comprado", "costo_real": 5200.00, "numero_factura": "F-10233" }
```
o para instalar:
```json
{ "estado": "Instalado" }
```
**Respuesta 200:** la requisición actualizada.
**Respuestas de error:**

| Código | Condición |
|---|---|
| 409 | Transición ilegal (p. ej. Solicitado→Comprado en ruta Compra; o instalar Compra sin `costo_real`). |
| 422 | Falta `costo_real`/`numero_factura` al pasar a Comprado (ruta Compra). |
| 403 | Rol distinto de `compras`. |

**Seguridad:** la instalación corre en transacción ACID (actualiza requisición + consolidado destino + donación si Yonke) y se audita con `origen_costo_estimado`. Una requisición Yonke puede saltar Solicitado→Instalado; una de Compra no.

---

## 7. Taller

### POST /taller — Registrar ingreso
**Autenticación:** Bearer + rol `taller`. RF-TAL-01.
**Request:**
```json
{ "unidad_id": 14, "fecha_ingreso": "2026-07-02", "diagnostico": "Frenos", "criticidad": "Media" }
```
**Respuesta 201:** el registro "En Taller".

### PATCH /taller/{id}/liberar — Liberar unidad
**Autenticación:** Bearer + rol `taller`. RF-TAL-03/04; máquina §4.3 SRS.
**Request (Total):** `{ "tipo_liberacion": "Total", "fecha_salida": "2026-07-04", "costo_taller": 3800.00 }`
**Request (Parcial):**
```json
{ "tipo_liberacion": "Parcial", "fecha_salida": "2026-07-04", "costo_taller": 1500.00,
  "pendientes": ["Wiper", "Chapa de puerta"] }
```
**Respuesta 200.** **Errores:** 422 Parcial sin pendientes; 409 unidad no está En Taller.
**Seguridad:** transacción ACID; Parcial genera alerta de deuda técnica y marca `candidata_reincidencia`; un reingreso por la misma falla se marca `es_reincidencia`.

---

## 8. Dashboard (Dirección)

### GET /dashboard — Consolidado y ranking
**Autenticación:** Bearer + rol `admin`. RF-DASH-01..04.
**Query:** `?periodo=YYYY-MM` (opcional).
**Respuesta 200:**
```json
{
  "kpis": { "diesel": 1250000, "refacciones": 480000, "taller": 210000, "costo_real_acumulado": 1940000 },
  "ranking": [
    { "id_unidad": "WH125", "costo_total": 312500, "critico": true },
    { "id_unidad": "WH101", "costo_total": 210000, "critico": false }
  ],
  "seleccion": {
    "id_unidad": "WH125",
    "eficiencia_km_l": 1.2,
    "pct_reparacion_total": 80,
    "pct_mejoralito": 20,
    "veredicto": "Vender",
    "razon": "El costo acumulado ($312,500) representa el 50% del valor estimado ($620,000), por encima del umbral del 40%. Además, 20% de sus liberaciones fueron mejoralito: reincide.",
    "valor_referencia_pendiente": false
  },
  "parametros": { "umbral_pct": 40, "ventana_meses": 12 }
}
```
Si `valor_referencia` es NULL: `veredicto: null`, `valor_referencia_pendiente: true`.
**Seguridad:** solo `admin`; cálculo del veredicto server-side (nunca en el cliente).

### PATCH /parametros/veredicto — Ajustar umbral/ventana
**Autenticación:** Bearer + rol `admin`. RF-DASH-05.
**Request:** `{ "umbral_pct": 50, "ventana_meses": 12 }`
**Respuesta 200:** parámetros actualizados; recalcula veredictos. **Errores:** 422 fuera de rango (umbral 20–80, ventana 1–36); 403.
**Seguridad:** cambio auditado.

---

## 9. Usuarios y permisos (Dirección)

### GET /usuarios — Listar usuarios
**Autenticación:** Bearer + rol `admin`. RF-USR-01.

### POST /usuarios — Alta de usuario
**Request:** `{ "nombre": "Greisy López", "email": "greisy@warhorse.mx", "rol": "diesel" }` (contraseña temporal generada/enviada). **Respuesta 201.**

### PATCH /usuarios/{id} — Cambiar rol / suspender
**Request:** `{ "rol": "compras" }` o `{ "activo": false }`. RF-USR-01/02.
**Respuesta 200.** **Seguridad:** cambio de rol y suspensión auditados; un usuario suspendido no puede autenticarse.

### GET /auditoria — Bitácora
**Autenticación:** Bearer + rol `admin`. **Query:** `?entidad=&entidad_id=&actor_id=&desde=&hasta=`, paginación. RF-INT-05.

---

## 10. Resumen de endpoints

| Método | Ruta | Rol | RF |
|---|---|---|---|
| POST | /auth/login | público | AUTH-01 |
| POST | /auth/logout | cualquiera | AUTH-03 |
| GET | /auth/me | cualquiera | USR-03 |
| GET | /unidades | cualquiera | UNI-01/04 |
| POST | /unidades | admin | UNI-02 |
| PATCH | /unidades/{id} | admin | UNI-03 |
| GET | /unidades/{id}/ficha | cualquiera | FIC-01..04 |
| POST | /diesel | diesel | DIE-01/02 |
| GET | /diesel | diesel/admin | DIE-03 |
| POST | /requisiciones | taller | REQ-01..05 |
| GET | /requisiciones | taller/compras/admin | REQ / FIC |
| GET | /compras/requisiciones | compras/admin | COM-01 |
| PATCH | /compras/requisiciones/{id}/estado | compras | COM-02/03 |
| POST | /taller | taller | TAL-01 |
| PATCH | /taller/{id}/liberar | taller | TAL-03/04 |
| GET | /dashboard | admin | DASH-01..04 |
| PATCH | /parametros/veredicto | admin | DASH-05 |
| GET | /usuarios | admin | USR-01 |
| POST | /usuarios | admin | USR-01 |
| PATCH | /usuarios/{id} | admin | USR-01/02 |
| GET | /auditoria | admin | INT-05 |
