### Especificación Técnica: Arquitectura de Wizards y Módulos Administrativos Warhorse

##### 1\. Fundamentos Arquitectónicos: Gestión de Estado y Resiliencia Técnica

En entornos operativos de baja conectividad, como los patios de maniobras de Warhorse, la integridad de los datos no es un lujo, sino un requisito crítico de seguridad. Una arquitectura robusta basada en React permite transformar formularios extensos en flujos de trabajo segmentados (Wizards) que reducen la carga cognitiva y mitigan el error humano mediante validaciones asíncronas y persistencia inmediata. Al desacoplar la captura de datos de la conexión activa al servidor, garantizamos que la operación no se detenga, permitiendo que el personal se enfoque en la inspección física mientras el sistema asegura la consistencia de la información en segundo plano.Para implementar este nivel de fiabilidad, el sistema se construye bajo el patrón de  **"Single Source of Truth"**  (Fuente Única de Verdad), utilizando el siguiente stack:

* **React Hook Form:**  Optimiza el rendimiento mediante el manejo de "uncontrolled components", permitiendo que formularios con cientos de campos dinámicos (como el cuestionario de inspección) se ejecuten sin latencia en el cliente.  
* **Zustand:**  Motor de gestión de estado global que facilita la persistencia entre pasos. Su ligereza permite coordinar la información desde la entrada del operador hasta la validación final del taller sin necesidad de prop-drilling complejo.  
* **Zod:**  Motor de validación de esquemas que actúa como el contrato de datos innegociable. Zod permite manejar la  **lógica dinámica de campos dependientes** ; por ejemplo, si un operador selecciona la opción "Otro" en una falla, el esquema se revalida instantáneamente para exigir una descripción textual obligatoria, impidiendo el envío de datos incompletos al backend.

###### *Estrategia de Resiliencia y Recuperación (Offline-First)*

Para prevenir la pérdida de datos ante fallos de red o cierres inesperados, el sistema implementa una capa de  **Hidratación de Estado Local**  y  **Checkpoints de Persistencia**  utilizando  **IndexDB**  (vía persistencia de Zustand). A diferencia de LocalStorage, IndexDB permite manejar volúmenes de datos mayores y estructuras complejas. La estrategia se basa en marcas de tiempo (timestamps) locales que actúan como la fuente de verdad durante la sincronización, asegurando que el flujo de trabajo pueda retomarse exactamente en el campo donde se interrumpió, eliminando la frustración de la doble captura.

Esta solidez técnica es el motor que impulsa la fluidez de las interfaces orientadas a procesos que se detallan a continuación.

##### 2\. Especificación Funcional de Wizards por Perfil de Usuario

El diseño de los Wizards de Warhorse prioriza la velocidad de captura y la visibilidad del estatus. Cada paso está diseñado para recolectar información relevante que alimente automáticamente al siguiente perfil en la cadena operativa, eliminando silos de información.

###### *2.1 Wizard del Operador (Módulo de Patio)*

Este módulo es el punto de entrada de datos. Al acceder, el operador se encuentra con una  **Vista de Resumen**  donde debe elegir entre:  **"Nueva Inspección"**  o  **"Consultar Historial"** .

* **Autenticación Rápida:**  Acceso mediante escaneo de código QR o número de empleado.  
* **Precarga Inteligente:**  El sistema precarga automáticamente  **Nombre, Unidad, Licencia y Tipo de Operación**  (Cruce, Foráneo, Local, Backup). Estos campos son editables pero evitan la captura repetitiva.  
* **Cuestionario Dinámico:**  Basado fielmente en el formato físico de inspección. 

###### *2.2 Wizard del Taller (Gestión de Órdenes de Trabajo \- OT)*

El taller transforma las alertas en acciones. El sistema distingue entre  **OT Correctiva**  (derivada de una inspección) y  **OT Preventiva**  (para mantenimiento programado o gestión de stock).

| Estatus de la OT | Lógica de Transición y Negocio |
| :---- | :---- |
| **Activa** | Orden creada tras aprobación de alerta; genera notificación a mecánicos. |
| **En Proceso** | Trabajo iniciado; bloquea la unidad en el catálogo de disponibilidad. |
| **Liberada** | Conclusión total. La unidad regresa a estatus "Activo" al 100%. |
| **Liberada Parcial** | La unidad sale con un "Warning". Esta lógica es crítica: permite retomar los trabajos pendientes en el futuro  **utilizando el mismo ID de OT** , evitando duplicar registros y manteniendo la trazabilidad del costo. |

###### *2.3 Wizard de Compras (Gestor de Abasto)*

Diseñado con una metáfora de "Carrito de Compras" corporativo. Ninguna requisición puede existir sin estar ligada a un ID de OT (Preventiva o Correctiva).

* **Categorías de Inventario:**  
* **Stock:**  Artículos de almacén general.  
* **Yonke:**  Piezas recuperadas de unidades desmanteladas. Exige el  **etiquetado obligatorio de la unidad origen**  para trazabilidad de costos y vida útil.  
* **Compras Externas:**  Directorio de proveedores "al vuelo" con opción de registro inmediato.  
* **Seguimiento "Estilo Amazon":**  El personal de taller cuenta con una vista de consulta de estatus donde, mediante el ID de seguimiento, visualizan los campos:  **Fecha de arribo, Estatus del pedido y Unidad destino** .  
* **Validación Financiera:**  Al generar la Orden de Compra, el usuario debe  **adjuntar obligatoriamente el XML/Factura** . El sistema permite clasificar el egreso como  **"Caja Chica"**  o  **"Pago Manual"**  (estatus extraordinario para conciliación posterior).

###### *2.4 Wizard de Administración (Dashboard Estratégico)*

Genera inteligencia de negocio a través de 4 reportes maestros:  **Inventario, Compras, Salud de Flota e Inspecciones** .

* **Flujo de Caja Chica:**  Este módulo es independiente y desacoplado del inventario del taller. Su propósito es gestionar gastos misceláneos sin contaminar las métricas de eficiencia (KPIs) del mantenimiento preventivo/correctivo.

##### 3\. Backbone del Sistema y Módulos Administrativos Estáticos

La inteligencia de los Wizards depende de la integridad del backbone: catálogos maestros estandarizados y una matriz de permisos que garantiza la seguridad operativa.

###### *3.1 Catálogos Maestros y Lógica de Salud*

El catálogo de Unidades es el corazón del sistema, gestionando 5 estados de salud con reglas de transición estrictas:

1. **Activo:**  Disponibilidad total.  
2. **Warning:**  Unidad operativa con fallas menores (Ej. Luces, estética).  
3. **Inactivo en Reparación:**  Unidad en taller con OT abierta.  
4. **Inactivo Yonke:**  Unidad destinada al desmantelamiento. Cualquier pieza extraída hereda el ID de esta unidad.  
5. **Dado de Baja:**  Fuera de servicio definitivo.

###### *3.2 Control de Acceso Basado en Roles (RBAC)*

Bloqueo de seguridad implementado en el Frontend (ocultamiento de componentes) y validado en la API (JWT/Scopes).

| Funcionalidad | Operador | Taller | Compras | Admin |
| :---- | :---- | :---- | :---- | :---- |
| **API (Escritura)** | Solo Inspección | OTs / Requisición | Órdenes de Compra | Acceso Total |
| **Vistas** | Historial Propio | Cola de Trabajo | Inventario / Amazon-view | Dashboard Global |
| **Autorización** | Bloqueado | Solo OTs | Solo Compras | Full Bypass |

###### *3.3 Log de Cambios e Historial de Auditoría (Audit Trail)*

Para garantizar la inmutabilidad, cada cambio de estatus (especialmente en Unidades y Autorizaciones de Compra) genera un registro con:  **Usuario ID, Timestamp exacto, Acción, Valor Anterior y Valor Nuevo** . Esto permite reconstruir la "hoja de vida" de cualquier unidad o el flujo de aprobación de una factura.

##### 4\. Ajustes Globales y Parametrización del Sistema

La flexibilidad de Warhorse reside en su capacidad de adaptación mediante parámetros configurables por el Administrador Principal.

* **Umbrales de Advertencia (Warning):**  Configuración de qué respuestas del "Cuestionario Dinámico" disparan automáticamente un estatus de Warning o Inactivo.  
* **Límites de Caja Chica:**  Umbrales máximos de egreso antes de requerir aprobación de nivel administrativo.  
* **Intervalos de Sincronización:**  Definición de tiempos de reintento para la capa de persistencia IndexDB en condiciones de señal errática.  
* **Mantenimiento Predictivo:**  Configuración de intervalos (tiempo/uso) que disparan la creación de OTs Preventivas.Esta especificación actúa como el plano definitivo para la implementación, asegurando que cada componente técnico responda a una necesidad operativa real de Warhorse.


