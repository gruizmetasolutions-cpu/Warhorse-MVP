# Warhorse — Hub Consolidador de Gastos por Tracto

Monorepo del sistema (WarHorse México · Dataholics). Documentación completa en
[`WarhorseDocs/`](WarhorseDocs/README.md) — leer `WarhorseDocs/CLAUDE.md` antes de tocar código.

```
apps/web        SPA React 19 + Vite + TS + Tailwind 4 (promoción del demo validado)
apps/api        API REST CodeIgniter 4.7 + Shield + Queue (PHP 8.2+, MySQL 8)
WarhorseDocs/   Docs 01–09, demo validado y evidencias de prueba por sprint
verificar.sh    Compuerta de sprint: corre TODA la verificación (front+back+audits)
```

## Arranque rápido

```bash
# Frontend
cd apps/web && npm install && npm run dev          # http://localhost:5173

# Backend (requiere .env con credenciales de MySQL)
cd apps/api && composer install
php spark migrate --all                            # esquema doc 03 + tablas Shield
php spark db:seed InitialSeeder                    # catálogos + usuarios + datos demo
php spark serve                                    # http://localhost:8080

# Compuerta de calidad (obligatoria antes de cerrar cada sprint)
./verificar.sh
```

## Reglas del proyecto

- El contrato de la API es el doc 05 (congelado por el demo validado); el DDL es el doc 03 §4.
- Sprints según `WarhorseDocs/07-roadmap/07_roadmap_sprints.md`; **ningún sprint inicia sin la
  compuerta del anterior en verde** y su evidencia en `WarhorseDocs/06-pruebas/evidencias/sprint-N.md`.
- Seguridad server-side siempre (doc 04): RBAC + propiedad en cada endpoint, transacciones ACID,
  auditoría de eventos críticos.
