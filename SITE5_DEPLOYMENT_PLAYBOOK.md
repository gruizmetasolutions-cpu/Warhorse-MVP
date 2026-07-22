# Playbook de Despliegue en Site5 (Production) — Warhorse

Este documento describe la arquitectura final de despliegue, el paso a paso detallado para publicar la aplicación de forma limpia y sin errores en **Site5.com**, y las lecciones aprendidas durante la configuración del entorno compartido.

---

## 1. Arquitectura de Despliegue en Site5

La aplicación consta de un frontend en **React (Vite)** y un backend **CodeIgniter 4 API**. Ambos coexisten bajo el mismo dominio de producción (`warhorse.dataholics.com.mx`), pero con responsabilidades separadas en la raíz del servidor:

```
[Usuario] 
   │
   ▼
[Cloudflare CDN]
   │
   ▼
[FTP Root /] (Site5 cPanel Server)
   ├── assets/              <-- Código JS/CSS compilado (React)
   ├── index.html           <-- Punto de entrada del SPA
   ├── api/
   │    └── index.php       <-- Front Controller de la API (CI4 Bootstrap)
   │
   └── warhorse_app/        <-- Código de la aplicación privada (Fuera del Web Root)
        ├── app/
        ├── vendor/
        ├── .env
        └── ...
```

* **Seguridad (Código Privado)**: Para evitar exponer archivos sensibles de configuración, controladores y dependencias de Composer, la carpeta `warhorse_app` se coloca **un nivel arriba** del directorio web root expuesto (es decir, como carpeta hermana de la raíz del sitio web).
* **Frontend (SPA)**: Se aloja directamente en el directorio raíz (`/` y `/assets/`), sirviendo el compilado estático de React.
* **Backend (API)**: Se aloja en una carpeta física `/api/` en la raíz, que actúa como puerta de enlace a CodeIgniter 4 redireccionando internamente hacia `../warhorse_app`.

---

## 2. Requisitos Previos

* Servidor con **PHP 8.2** o superior (con las extensiones `intl`, `mbstring`, `mysqli` habilitadas).
* Base de datos MySQL activa en cPanel (Site5).
* Cuenta de FTP con permisos de escritura en la raíz del dominio.

---

## 3. Playbook de Despliegue Paso a Paso (Versión Limpia)

Sigue estos pasos en orden estricto para evitar fallos de CORS, bloqueos de conexión a bases de datos o pantallas en blanco de caché.

### Paso 1: Configurar la Estructura en el Servidor (FTP)
1. Accede a tu cliente FTP y asegúrate de estar en la raíz de tu dominio.
2. Crea una carpeta llamada `warhorse_app` (fuera de la carpeta de archivos públicos si es posible, o como directorio hermano de tus accesos directos).
3. Sube todo el contenido del backend de CodeIgniter a `warhorse_app/` (excluyendo la carpeta `public/` y la carpeta `node_modules`).

### Paso 2: Crear el Punto de Entrada de la API
1. En la raíz pública del dominio, crea una carpeta física llamada `api/`.
2. Dentro de `api/`, crea un archivo `index.php` con el siguiente contenido para bootstrapear la aplicación desde `warhorse_app`:

```php
<?php
use CodeIgniter\Boot;
use Config\Paths;

define('FCPATH', __DIR__ . DIRECTORY_SEPARATOR);

if (getcwd() . DIRECTORY_SEPARATOR !== FCPATH) {
    chdir(FCPATH);
}

// Apunta a la ubicación física de Paths.php
require FCPATH . '../warhorse_app/app/Config/Paths.php';

$paths = new Paths();
require $paths->systemDirectory . '/Boot.php';

exit(Boot::bootWeb($paths));
```

### Paso 3: Configurar el archivo `.env` de Backend
Crea el archivo `.env` en la raíz de `warhorse_app/` con las configuraciones del entorno. 

* **Usa `127.0.0.1` en vez de `localhost`**: Site5 restringe las conexiones locales a MySQL por CLI a sockets Unix específicos cuando se usa `localhost`. Para permitir que los comandos de consola y migraciones corran correctamente, fuerza una conexión TCP definiendo el host como `127.0.0.1`.

```env
CI_ENVIRONMENT = production

# URL Base
app.baseURL = 'https://warhorse.dataholics.com.mx/api/'

# Base de Datos (Site5)
database.default.hostname = 127.0.0.1
database.default.database = tu_nombre_db
database.default.username = tu_usuario_db
database.default.password = tu_contraseña_db
database.default.DBDriver = MySQLi
database.default.port = 3306
```

### Paso 4: Reconstruir y Migrar la Base de Datos
No ejecutes volcados de SQL viejos manualmente para evitar incoherencias en los modelos de autenticación. Ejecuta las migraciones de CodeIgniter.
Si la línea de comandos de Site5 te restringe, puedes subir y llamar un script temporal PHP en tu carpeta `/api` para forzar las migraciones de todos los namespaces:

```php
<?php
// Script temporal: run_migrations.php
define("FCPATH", __DIR__ . DIRECTORY_SEPARATOR);
require __DIR__ . "/../warhorse_app/app/Config/Paths.php";
$paths = new Config\Paths();
require $paths->systemDirectory . "/Boot.php";

class Bootstrapper extends \CodeIgniter\Boot {
    public static function init($paths) {
        static::definePathConstants($paths);
        static::loadConstants();
        static::loadDotEnv($paths);
        static::defineEnvironment();
        static::loadEnvironmentBootstrap($paths);
        static::loadCommonFunctions();
        static::loadAutoloader();
        static::setExceptionHandler();
        static::autoloadHelpers();
        static::initializeCodeIgniter();
    }
}
Bootstrapper::init($paths);

$migrate = \CodeIgniter\Config\Services::migrations();
// Migra librerías (Shield, Settings, Queue) y finalmente la App
foreach (["CodeIgniter\Settings", "CodeIgniter\Shield", "CodeIgniter\Queue", "App"] as $ns) {
    $migrate->setNamespace($ns);
    $migrate->latest();
}
echo "Migrado exitosamente!";
```

*Ejecuta también el seeder maestro (`InitialSeeder`) para poblar los usuarios de acceso y parámetros iniciales de veredicto.*

### Paso 5: Compilar y Desplegar el Frontend (React)
1. Compila la aplicación de React en tu máquina local:
   ```bash
   npm run build
   ```
2. **Doble Sincronización en FTP (Requerida en cPanel / Site5)**:
   Dependiendo de la configuración del subdominio en cPanel, el servidor web de Site5 puede servir archivos desde la raíz del FTP (`/`) o desde la carpeta `/public_html/`. Para garantizar que cualquier actualización cargue de inmediato sin importar la configuración del docroot:
   - Sube los archivos compilados en `apps/web/dist/` ejecutando el script de doble sincronización:
     ```bash
     python double_upload.py
     ```
   - Este script copia automáticamente `index.html`, `.htaccess` y la carpeta `assets/` **tanto en la raíz (`/`) como en `/public_html/`**.

### Paso 6: Configurar el archivo `.htaccess` en la Raíz
Crea un archivo `.htaccess` en la raíz pública del dominio para enrutar las peticiones al SPA o a la API de forma transparente:

```apache
RewriteEngine On
RewriteBase /

# Pasar cabecera de Autorización Bearer (Requerido en Site5/CGI)
RewriteCond %{HTTP:Authorization} .
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]

# Ignorar la carpeta física de la API para que CI4 la procese
RewriteCond %{REQUEST_URI} ^/api/ [NC]
RewriteRule ^ - [L]

# Si el archivo o carpeta física existe (CSS, JS, imágenes), servirlo directamente
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Si la ruta no existe físicamente, redirigir al index.html de React (Router SPA)
RewriteRule ^(.*)$ index.html [L]
```

---

## 4. Lecciones Aprendidas & Buenas Prácticas

### 💡 Error de Intercepción de LiteSpeed (Forzado de 200 OK)
* **Problema**: Site5 y servidores que corren detrás de LiteSpeed/CGI interceptan respuestas HTTP con códigos `4xx` y `5xx` devueltas por la API, reemplazando el JSON del error por la página HTML estándar de error del servidor. Esto rompe la lógica de la SPA ya que no puede leer los detalles del fallo de autenticación o validación.
* **Solución**: En el backend, forzar las respuestas HTTP de error como `200 OK` agregando una clave `"real_status": 401/422` dentro del cuerpo del JSON.
* **Ajuste del Frontend**: El cliente HTTP de React debe verificar siempre si el JSON de respuesta exitosa contiene la clave `real_status >= 400` y, de ser así, lanzar un error local para redirigir al usuario al login en lugar de provocar pantallas en blanco.

### 💡 Evasión de la Caché de Cloudflare (Cache Busting)
* **Problema**: Si una llamada a un script estático (por ejemplo, `assets/index-XXXX.js`) falla temporalmente o devuelve HTML debido a un error de enrutamiento y da `200 OK`, Cloudflare cachea esa respuesta. Al corregir el servidor, la aplicación seguirá fallando con errores de tipo MIME (`Expected a JavaScript... but got text/html`) porque Cloudflare sigue sirviendo el HTML guardado en su red.
* **Solución**: Realiza un pequeño cambio funcional en el punto de entrada de React (`main.tsx` o `api.ts`) y vuelve a compilar. Esto obligará a Vite a generar un hash de archivo completamente diferente (ej. `index-YYYY.js`), forzando a Cloudflare a solicitar el recurso real del origen de inmediato.
