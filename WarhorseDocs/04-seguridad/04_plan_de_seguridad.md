# 04 — Plan de Seguridad
## Warhorse — Hub Consolidador de Gastos por Tracto

| | |
|---|---|
| **Documento** | 04 — Plan de Seguridad |
| **Versión** | 2.0 |
| **Fecha** | 7 de julio de 2026 |
| **Marco** | OWASP Top 10:2021 · OWASP ASVS L2 · LFPDPPP (México) |
| **Depende de** | [02 Arquitectura](../02-arquitectura/02_arquitectura_sistema.md), [03 Modelo de datos](../03-datos/03_modelo_de_datos.md), [ADR-001](../02-arquitectura/ADR/ADR-001_stack-react-vite-ci4-api.md) |

> *v2.0: modelo de amenazas del stack cliente-servidor desacoplado. El cliente React deja de ser confiable; toda decisión de seguridad es server-side (CI4 + Shield).*

---

## 1. Postura de seguridad

### 1.1 Activos a proteger

| Activo | Criticidad | Justificación |
|---|---|---|
| Datos financieros por unidad (consolidado, veredicto, `valor_referencia`) | **Crítica** | Son la base de decisiones de baja de activos; su alteración induce decisiones caras y erróneas. |
| Integridad del `costo_estimado`/`origen_costo_estimado` de Yonke | **Crítica** | Si se falsea, el veredicto miente (ver [ADR-002](../02-arquitectura/ADR/ADR-002_valorizacion-yonke-cascada.md)). |
| Credenciales y tokens de usuarios | **Crítica** | Acceso al sistema; escalada de rol. |
| Fotos de requisición (evidencia) | Alta | Prueban que la pieza corresponde a la unidad; su borrado/suplantación rompe la trazabilidad. |
| Bitácora de auditoría | Alta | Registro de responsabilidad; debe ser inmutable para roles operativos. |
| PII de usuarios (nombre, correo) | Media | Cumplimiento LFPDPPP. |

### 1.2 Actores de amenaza

- **Usuario autenticado malicioso o descuidado** (principal): un rol Taller que intente ver el Dashboard directivo, leer/editar transacciones de otra unidad (IDOR), o forzar un `costo_estimado = 0` en Yonke.
- **Escalada de privilegios:** un usuario que intente auto-asignarse rol admin manipulando el payload.
- **Atacante externo no autenticado:** fuerza bruta de login, inyección, subida de archivos maliciosos.
- **Interceptación en tránsito:** captura de token en redes móviles del taller.

---

## 2. OWASP Top 10 — Controles aplicados

### A01:2021 — Broken Access Control
**Riesgo específico:** el sistema tiene cuatro roles con vistas y datos disjuntos; el riesgo dominante es que un usuario autenticado acceda a funciones o datos fuera de su rol (Taller viendo el Dashboard, Compras liberando taller) o a recursos de otra entidad (IDOR).

Controles:
- **RBAC en filtro de ruta** (re-verificado server-side, no en el cliente):

```php
// app/Config/Filters.php
public array $filters = [
    'api-auth'      => ['before' => ['api/v1/(?!auth/login).*']],
    'rbac:admin'    => ['before' => ['api/v1/dashboard/*','api/v1/usuarios/*','api/v1/parametros/*']],
    'rbac:taller'   => ['before' => ['api/v1/requisiciones', 'api/v1/taller/*']],
    'rbac:compras'  => ['before' => ['api/v1/compras/*']],
    'rbac:diesel'   => ['before' => ['api/v1/diesel/*']],
];
```

- **Policy de propiedad (anti-IDOR)** en el service, antes de operar:

```php
public function authorizeRead(User $actor, Requisicion $req): void
{
    // Taller solo ve requisiciones que creó su rol; Compras ve todas; Dirección lee todo.
    if ($actor->rol === 'taller' && $req->creado_por !== $actor->id
        && ! $this->esMismaUnidadDelTaller($actor, $req)) {
        throw new ForbiddenException(); // → 403
    }
}
```

- El rol **siempre** se lee de `auth()->user()`, nunca de un campo del request.

### A02:2021 — Cryptographic Failures
**Riesgo específico:** robo de credenciales o de token en tránsito por redes móviles del taller; exposición de PII.

Controles:
- Contraseñas con **Argon2id/Bcrypt** vía Shield (nunca en claro ni MD5/SHA1).
- **HTTPS forzado** con HSTS; TLS 1.2+ únicamente.
- Token de acceso de vida corta; refresh en cookie `HttpOnly`+`Secure`+`SameSite=Strict`.
- Datos sensibles adicionales que lo requieran, cifrados en reposo con el helper de cifrado de CI4:

```php
// Ejemplo: cifrar un dato sensible antes de persistir
$encrypter = service('encrypter');
$cifrado   = base64_encode($encrypter->encrypt($valorSensible));
```

### A03:2021 — Injection
**Riesgo específico:** inyección SQL en filtros del catálogo/panel, o XSS a través de campos de texto libre (diagnóstico, descripción de pieza) que Dirección visualiza.

Controles:
- **Prepared statements siempre** vía Query Builder / Model de CI4; prohibido concatenar SQL:

```php
// CORRECTO: binding de parámetros
$this->db->table('requisiciones')
    ->where('estado', $estado)          // parametrizado
    ->where('urgencia', $urgencia)
    ->orderBy('urgencia', 'ASC')
    ->get();
// NUNCA: ->query("... WHERE estado = '$estado'")
```

- **Escape de salida en React** por defecto; prohibido `dangerouslySetInnerHTML` salvo con DOMPurify:

```tsx
import DOMPurify from 'dompurify';
// Solo si fuera imprescindible renderizar HTML; en Warhorse se evita.
const clean = DOMPurify.sanitize(userHtml);
```

- Validación de entrada con reglas de CI4 (tipos, longitudes, enums) antes de la capa de negocio.

### A04:2021 — Insecure Design
**Riesgo específico:** el diseño mismo podría permitir un veredicto falso si el cliente calculara la rentabilidad o si un estimado Yonke pudiera ser $0.

Controles de diseño:
- El **cálculo del veredicto y la valorización viven server-side** (Services); el cliente solo presenta.
- **Invariantes en BD** además de en el service (CHECK de `requisiciones`, doc 03) — defensa en profundidad.
- La cascada de valorización garantiza `costo_estimado > 0` para Yonke; el endpoint rechaza Yonke sin costo (ver [ADR-002](../02-arquitectura/ADR/ADR-002_valorizacion-yonke-cascada.md)).
- **Transacciones ACID** para operaciones multi-tabla (instalación, liberación parcial) evitan estados inconsistentes.

### A05:2021 — Security Misconfiguration
**Riesgo específico:** exponer la API directamente, `.env` filtrado, CORS permisivo, mensajes de error verbosos.

Controles:
- `CI_ENVIRONMENT=production`; errores detallados desactivados.
- La API solo accesible vía Nginx apuntando a `public/`; el resto del proyecto fuera del webroot.
- **CORS restringido** al origen del front:

```php
// app/Config/Cors.php
public array $default = [
    'allowedOrigins'   => ['https://hub.warhorse.mx'],
    'allowedHeaders'   => ['Authorization', 'Content-Type'],
    'allowedMethods'   => ['GET','POST','PATCH','DELETE'],
    'supportsCredentials' => true,
    'maxAge' => 3600,
];
```

- Cabeceras de seguridad en Nginx: CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-Frame-Options: DENY`.

### A07:2021 — Identification and Authentication Failures
**Riesgo específico:** fuerza bruta de login; sesión que no expira; usuario suspendido que sigue entrando.

Controles:
- **Throttling** por IP/usuario en `login` (filtro de CI4):

```php
// Filtro throttle sobre /auth/login
$throttler = service('throttler');
if ($throttler->check(md5($ip.$email), 5, MINUTE) === false) {
    return $this->failTooManyRequests(); // 429
}
```

- Verificación de `activo = 1` en cada login (RF-USR-01); un usuario suspendido recibe 401.
- Tokens con expiración y revocación (Shield); logout revoca (RF-AUTH-03).
- Mensajes de error genéricos (no revelar si falló usuario o contraseña).

### A08:2021 — Software and Data Integrity Failures
**Riesgo específico:** subida de archivos maliciosos disfrazados de foto; manipulación del `origen_costo_estimado`.

Controles:
- **Validación de subida de fotos:** tipo MIME real, extensión permitida, tamaño máximo; almacenamiento **fuera del webroot** con nombre generado; servido por controlador autorizado, nunca ejecutable.

```php
$foto = $this->request->getFile('foto_pieza');
if (! $foto->isValid() || ! in_array($foto->getMimeType(), ['image/jpeg','image/png','image/webp'], true)) {
    throw new BusinessException('Archivo de imagen inválido.');
}
$nombre = bin2hex(random_bytes(16)) . '.' . $foto->guessExtension();
$foto->move(WRITEPATH . '../uploads', $nombre); // fuera del webroot
```

- `origen_costo_estimado` lo asigna el backend (nunca el cliente), garantizando la confiabilidad del dato.
- Dependencias auditadas (`composer audit`, `npm audit`) en CI.

### A09:2021 — Security Logging and Monitoring Failures
**Riesgo específico:** un cambio financiero (instalación, cambio de `valor_referencia`, cambio de rol) sin rastro.

Controles:
- Tabla `auditoria` (doc 03) con actor, acción, valor anterior/nuevo, timestamp; escrita dentro de la misma transacción del cambio.
- Eventos auditados: cambios de estado de requisición, instalaciones (con origen del estimado), liberaciones parciales, cambios de estado/`valor_referencia` de unidad, cambios de rol, ajustes de parámetros del veredicto, logins fallidos repetidos.
- La auditoría no es alterable por roles operativos.

---

## 3. Seguridad específica por capa

### 3.1 Filtros / Middlewares

| Filtro | Propósito | Cuándo aplica |
|---|---|---|
| `cors` | Restringe origen del front | Todas las rutas `/api` |
| `api-auth` (Shield) | Verifica token válido/no revocado | Todas salvo `auth/login` |
| `rbac:<rol>` | Autoriza por rol | Rutas por dominio (ver A01) |
| `throttle` | Limita tasa | `auth/login` y endpoints mutantes |

### 3.2 Autenticación y sesión

```mermaid
sequenceDiagram
    actor U as Usuario
    participant FE as SPA
    participant TH as Throttle
    participant AU as AuthController
    participant SH as Shield
    participant DB as MySQL
    U->>FE: credenciales
    FE->>TH: POST /auth/login
    TH->>AU: dentro de límite (si no → 429)
    AU->>DB: usuario por email, activo=1
    AU->>SH: verifica hash (Argon2id)
    alt válido
        SH-->>FE: token acceso + set-cookie refresh (HttpOnly)
    else inválido / suspendido
        AU-->>FE: 401 genérico
    end
    Note over FE: token en memoria; refresh en cookie
```

Puntos de validación: token en cada request (filtro), expiración, revocación, `activo=1`, rol server-side.

### 3.3 Autorización RBAC (roles × recursos × acciones)

| Recurso | admin | taller | compras | diesel |
|---|---|---|---|---|
| Dashboard / parámetros veredicto | Leer / Ajustar | — | — | — |
| Usuarios | CRUD | — | — | — |
| Catálogo unidades | CRUD | Leer | Leer | Leer (selector) |
| Requisiciones | Leer | Crear | Gestionar estado / costo real | — |
| Taller (ingreso/liberación) | Leer | CRUD | — | — |
| Diésel | Leer | — | — | Crear |
| Auditoría | Leer | — | — | — |

### 3.4 Protección de datos en tránsito y en reposo
- Tránsito: HTTPS/TLS 1.2+ con HSTS.
- Reposo: contraseñas hasheadas (Argon2id); datos sensibles adicionales con `encrypt()` de CI4; clave en `.env` fuera de Git. Backups cifrados.

### 3.5 Seguridad del cliente (SPA)
- Token de acceso en memoria (no `localStorage`), refresh en cookie `HttpOnly`.
- Escape por defecto de React; sin `dangerouslySetInnerHTML` (o con DOMPurify).
- La UI oculta acciones por rol como UX, nunca como control de seguridad.
- CSP que restringe orígenes de scripts.

### 3.6 Seguridad de servicios externos
- Almacén de fotos fuera del webroot, servido por controlador con verificación de sesión/rol.
- Worker de colas con acceso mínimo a BD; jobs idempotentes.

---

## 4. Procedimientos operativos

### 4.1 Gestión de secretos
`.env` fuera de Git (en `.gitignore`), permisos `600`, en el VPS. Rotación de la clave de cifrado y credenciales de BD documentada; si se filtran, rotar de inmediato, revocar tokens y forzar re-login.

### 4.2 Checklist de hardening de servidor
- [ ] HTTPS + HSTS; TLS 1.2+.
- [ ] `CI_ENVIRONMENT=production`; errores no verbosos.
- [ ] API accesible solo por Nginx a `public/`.
- [ ] `.env` fuera de webroot y de Git.
- [ ] Fotos fuera del webroot, servidas por controlador autorizado.
- [ ] CORS restringido al origen del front.
- [ ] Cabeceras CSP/nosniff/Referrer/X-Frame.
- [ ] Cookies `HttpOnly`+`Secure`+`SameSite`.
- [ ] Usuario MySQL de mínimos privilegios.
- [ ] `setup_admin` eliminado tras bootstrap.
- [ ] Backups automáticos de BD y fotos, verificados.
- [ ] `composer audit` / `npm audit` sin vulnerabilidades altas.

### 4.3 Plan de respuesta a incidentes
1. Contener: revocar tokens comprometidos, rotar secretos, aislar el servicio si aplica.
2. Evaluar alcance con la bitácora de `auditoria` y logs de Nginx/PHP.
3. Erradicar la causa (parche, cierre de configuración).
4. Recuperar desde backup verificado.
5. Notificar según LFPDPPP si hubo exposición de PII.
6. Post-mortem y ajuste de controles.

### 4.4 Privacidad y cumplimiento (LFPDPPP)
- PII tratada: nombre y correo de usuarios (empleados). No se maneja PII de terceros ni datos sensibles.
- Principio de minimización: solo lo necesario para operar y autenticar.
- Derechos ARCO: Dirección puede acceder, rectificar (edición de usuario) y eliminar/suspender cuentas; la eliminación conserva la auditoría por obligación de rastreabilidad, anonimizando referencias donde aplique.
- Aviso de privacidad interno para empleados usuarios del sistema.
