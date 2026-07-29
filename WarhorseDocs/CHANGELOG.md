# CHANGELOG — Historial de Cambios · Warhorse

Este archivo documenta cronológicamente todas las mejoras, correcciones y nuevas funcionalidades añadidas a la aplicación Warhorse.

---

## [Sprint 7] - 28 de Julio de 2026

### Añadido
* **Habilitación de Altas en Inventario (WH-002)**:
  * Agregado el botón y formulario flotante "+ Agregar producto" en la pestaña de *Inventario de Almacén* en `Catalogo.tsx`.
  * Campos para definir `stock_minimo`, `stock_maximo`, `stock_actual` y toggle para `validar_limites`.
* **Alertas de Stock y Semáforos (WH-003)**:
  * Semáforos visuales (Rojo, Amarillo, Verde) en el catálogo de unidades calculados según la proximidad de la fecha de vencimiento de su documentación (`vencimiento_documentacion`):
    * **Rojo**: $\le$ 14 días.
    * **Amarillo**: 15 a 28 días.
    * **Verde**: $> 28$ días.
* **Flexibilización de Requisiciones (WH-004)**:
  * El SKU / Número de Parte ahora es opcional para unidades de tipo Caja y Thermo, manteniéndose obligatorio para Tractores y Camionetas de Servicio.
  * Selector de prioridades de urgencia: *Bajo, Medio, Crítico, Inmediato*.
  * Botones de transición doble para requisiciones en estado `'En pago'` en compras: *→ Recolección* y *→ Bajo pedido*.
* **Módulo de Órdenes de Trabajo y Evidencias (WH-005)**:
  * Nueva vista de Órdenes de Trabajo (`OrdenesTrabajo.tsx`) que permite registrar órdenes con asignación de mecánicos, catálogo de materiales y carga de evidencias.
* **Conciliación de Combustible y Telemetría Samsara (WH-006)**:
  * Nueva interfaz de Conciliación Diésel (`ConciliacionDiesel.tsx`) que parsea archivos CSV de combustible y telemetría de Samsara.
  * Permite calcular el rendimiento dinámico (`km / L`) y realizar desgloses parciales para tanques externos o cargas compartidas.

---

## [Mejoras y Ajustes Post-Sprint 7] - 28 de Julio de 2026 (Segunda Sesión)

### Añadido
* **Ficha de Reparación Detallada (Taller)**:
  * Filas interactivas (cursor pointer) en la tabla de **Historial de liberaciones** y **En taller ahora** en `Taller.tsx`.
  * Modal detallado de liberación/ingreso que muestra: unidad, diagnóstico, criticidad, fechas de ingreso/salida, días transcurridos, costo final, tipo de liberación (Total / Mejoralito) y advertencias de deuda técnica (pendientes).
* **Evidencias en Liberaciones de Taller**:
  * Carga de hasta 3 fotografías de evidencias (*Antes/Después, Lavado, K9*) directamente al liberar la unidad en `Taller.tsx`.
  * Conversión automática de archivos a Base64 data URLs para persistencia en `localStorage` y renderizado de miniaturas/galería directamente en la Ficha de Liberación.
* **Filtros Dinámicos del Tablero Directivo**:
  * Conexión de filtros de fecha (Desde / Hasta) y tipo de unidad (Tractor, Caja, etc.) del frontend en `Dashboard.tsx` a la API backend.
  * Re-cálculo en tiempo real en `DashboardService.php` de los KPIs, ranking de flota y veredicto del tracto usando datos transaccionales de cargas, requisiciones y taller.
* **Selector Rápido de Tractos**:
  * Agregado un menú desplegable `<select>` para buscar y elegir directamente qué tracto analizar en el Dashboard sin necesidad de dar clic en las barras.
* **Origen "Inventario" en Requisición de Refacciones**:
  * Tercer origen en requisiciones: **"Inventario"**, que carga el catálogo de almacén y permite seleccionar una pieza en stock.
  * Al enviar la requisición, descuenta automáticamente 1 unidad del `stock_actual` del artículo en `catalogo_piezas`.
  * La requisición se guarda directamente en estado **"Instalado"** y su costo suma al acumulado del tracto destino.

### Modificado
* **Desplazamiento del Menú Lateral (Fix UI)**:
  * Añadido `overflowY: 'auto'` al contenedor lateral del menú en `AppLayout.tsx` para permitir desplazamiento independiente en pantallas de baja altura.

### Eliminado
* **Remoción de "Salud de datos"**:
  * Eliminada la tarjeta informativa de adopción de datos del Dashboard directivo para simplificar la interfaz.
