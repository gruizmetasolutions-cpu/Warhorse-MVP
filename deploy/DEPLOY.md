# Despliegue de Warhorse en Site5 (hosting compartido)

> [!IMPORTANT]
> **ÚLTIMA VERSIÓN PUBLICADA Y ACTIVA EN PRODUCCIÓN (`REVIEW7-21`)**: 
> Esta guía corresponde a la rama `REVIEW7-21` (Sprint 6 Upgrades) publicada y activa en producción (`https://warhorse.dataholics.com.mx/`).

Dominio temporal: **https://warhorse.dataholics.com.mx/**

El proyecto son dos piezas que van al **mismo dominio**: el SPA (React, ya
compilado) y la API (CodeIgniter 4). El SPA pide siempre `/api/v1/...` sobre el
mismo origen, así que no hay CORS ni subdominios: todo vive bajo un solo docroot.

---

## 1. Estructura de carpetas en el hosting

En Site5 tu home es algo como `/home/uXXXXXXXXX/`. Dentro está `public_html`
(el docroot del dominio). La app de CI4 va **fuera** de `public_html` por
seguridad (así el código, el `.env` y las fotos no son accesibles por URL).

```
/home/uXXXXXXXXX/
├── public_html/                 ← DOCROOT (lo único público)
│   ├── index.html               ← SPA (React)
│   ├── index.php                ← front controller de CI4 (API)
│   ├── .htaccess                ← enruta SPA + /api
│   └── assets/                  ← JS/CSS/imágenes del SPA (con hash)
│
└── warhorse_app/                ← FUERA del webroot (privado)
    ├── app/                     ← código de la aplicación
    ├── vendor/                  ← dependencias (ver paso 3)
    ├── writable/                ← cache, logs, sesiones, uploads (escribible)
    ├── spark                    ← CLI de CI4 (migraciones, cola)
    ├── composer.json / .lock
    └── .env                     ← config de producción (ver paso 4)
```

El contenido listo para subir está en esta carpeta `deploy/`:
- `deploy/public_html/`  → sube tal cual al `public_html` del hosting.
- `deploy/warhorse_app/` → sube tal cual a `~/warhorse_app` (hermano de public_html).

> **Importante:** `warhorse_app` es **hermano** de `public_html`, no va dentro.
> El `index.php` ya apunta a `../warhorse_app/app/...`.

---

## 2. PHP: fija la versión en hPanel

En hPanel → **Avanzado → Configuración de PHP**, elige **PHP 8.2 o 8.3**
(CI4 4.7 exige 8.2 mínimo; no uses 8.0/8.1). Activa las extensiones
`intl`, `mysqli`, `mbstring`, `gd`, `json` (suelen venir activas).

---

## 3. Las dependencias (`vendor/`)

`vendor/` no se incluye en `deploy/` porque pesa mucho. Dos opciones:

- **Con SSH (planes Business/Premium):**
  ```bash
  cd ~/warhorse_app
  composer install --no-dev --optimize-autoloader
  ```
- **Sin SSH:** genera `vendor/` en tu equipo y súbela por FTP/Administrador de
  archivos a `~/warhorse_app/vendor`:
  ```bash
  # en tu equipo, dentro de apps/api
  composer install --no-dev --optimize-autoloader
  # luego sube la carpeta vendor/ resultante a ~/warhorse_app/vendor
  ```
  (Es PHP puro; la `vendor` funciona igual en PHP 8.2–8.4.)

---

## 4. El archivo `.env` de producción

1. Renombra `warhorse_app/.env.production.example` a `warhorse_app/.env`.
2. Rellena los dos secretos marcados con `<...>` copiándolos de tu `.env` de
   desarrollo (`apps/api/.env`): `encryption.key` y `database.default.password`.
3. Deja `CI_ENVIRONMENT = production` y el `app.baseURL` con el dominio de arriba.
4. Permisos: `chmod 600 ~/warhorse_app/.env`.

> Si en producción la conexión a `srv753.hstgr.io` falla, prueba
> `database.default.hostname = localhost` (la BD está en el mismo hosting).

---

## 5. Permisos de `writable/`

CI4 necesita escribir en `writable/` (cache, logs, sesiones, fotos subidas):
```bash
chmod -R 755 ~/warhorse_app/writable
```
Si ves errores de escritura, sube a `775`.

---

## 6. Base de datos

Ya está creada y con el esquema + datos (es la misma BD que venimos usando).
Si necesitaras reconstruirla desde cero **en un hosting con SSH**:
```bash
cd ~/warhorse_app
php spark migrate --all        # aplica todas las migraciones
php spark db:seed InitialSeeder # datos base (ojo: borra y resiembra)
```
**No corras `db:seed` si ya tienes datos reales**: trunca las tablas.

---

## 7. La cola de notificaciones (opcional)

Al crear una requisición se encola un aviso a Compras. En hosting compartido no
hay proceso permanente, así que se procesa por **cron** (hPanel → Cron Jobs),
cada 5 minutos:
```
*/5 * * * * cd /home/uXXXXXXXXX/warhorse_app && /usr/bin/php8.3 spark queue:work --stop-when-empty >/dev/null 2>&1
```
Ajusta la ruta de `php8.3` a la que muestre cPanel. No es crítico: las
requisiciones se crean igual aunque el cron no corra (el aviso solo queda en
cola).

---

## 8. Verificación (en este orden)

1. Abre `https://warhorse.dataholics.com.mx/` → debe cargar el
   login del Hub (no un listado de archivos ni un 500).
2. Abre `https://.../api/v1/auth/me` directo en el navegador → debe responder
   **401** con JSON `{"error":"unauthenticated",...}` (eso confirma que la API
   vive y el `.htaccess` enruta `/api`). Si ves el SPA o un 404, el `.htaccess`
   no está enrutando.
3. Inicia sesión con tu usuario admin. Si el login da 401 pese a credenciales
   correctas → casi siempre es el header `Authorization` que el hosting
   descarta; el `.htaccess` ya lo reinyecta, pero confirma que el archivo se
   subió y que `mod_rewrite`/LiteSpeed está activo.
4. Entra al Tablero: deben verse los KPIs reales. Crea una requisición para
   cerrar el flujo completo.

---

## 9. Errores típicos y su causa

| Síntoma | Causa probable |
|---|---|
| Página en blanco / 500 al abrir | `vendor/` no subida, o PHP < 8.2, o `.env` sin `encryption.key` |
| El `/` muestra la lista de archivos | falta el `.htaccess` o `mod_rewrite`/LiteSpeed apagado |
| `/api/...` devuelve el SPA (index.html) | el `.htaccess` no está enrutando `/api` (revisa que se subió) |
| Login siempre 401 | header `Authorization` descartado (revisa el bloque del `.htaccess`) o BD inaccesible |
| "Unable to connect to the database" | credenciales del `.env`, o probar `hostname = localhost` |
| Rutas del SPA (F5 en /dashboard) dan 404 | falta la regla de fallback a `index.html` en el `.htaccess` |
| Error al escribir logs/subir foto | permisos de `writable/` (sube a 775) |

---

## Resumen de lo compilado

- **SPA**: `npm run build` → `apps/web/dist/` (ya copiado a `deploy/public_html/`).
- **API**: front controller de producción (`index.php` apuntando fuera del
  webroot) + `.htaccess` de enrutamiento + `.env.production.example`.
- Estética y funcionalidad idénticas a lo que ya probaste en local; solo cambia
  dónde viven los archivos y que corre en `CI_ENVIRONMENT=production`.
