# ADR-002 — Valorización de piezas canibalizadas de Yonke (cascada de tres niveles)

| | |
|---|---|
| **Estado** | Aceptado |
| **Fecha** | 7 de julio de 2026 |
| **Reemplaza** | — |
| **Depende de** | [ADR-001](ADR-001_stack-react-vite-ci4-api.md) |

## 1. Contexto

El diferenciador del sistema es rastrear piezas canibalizadas de unidades Yonke (WH03, WH60) que hoy salen "en la sombra", sin registro ni costo. Alonso (Dirección) exigió explícitamente (chat 01/07/2026) que esas piezas tengan un **costo estimado** asignado, aunque no exista compra real.

El problema técnico: si una pieza Yonke se registra en $0, el `Costo Real Acumulado` de la unidad receptora queda subvaluado y el **veredicto de rentabilidad miente** (una unidad parecería barata cuando en realidad consumió valor de la flota). Pero tampoco existe una regla contable formal de valorización aprobada por el área financiera. Se necesita una regla de trabajo del MVP que nunca produzca $0 y que sea auditable y reversible.

## 2. Decisión

Cuando `origen = Yonke`, el backend asigna `costo_estimado` mediante una **función de valorización en cascada** implementada en un `Service` server-side (nunca en el cliente). La cascada tiene tres niveles y **siempre** produce un valor mayor que cero:

| Nivel | Método | Cuándo aplica | Marca `origen_costo_estimado` |
|---|---|---|---|
| **A (primario)** | Última compra registrada | Existe en el ledger un `costo_real` de la misma pieza (por `numero_parte` o descripción normalizada del catálogo). Se usa el más reciente. | `ultima_compra` |
| **C (fallback)** | Catálogo de referencia | La pieza nunca se ha comprado o no hay registro, pero existe en el Catálogo de Piezas con precio de referencia. | `catalogo` |
| **Manual (último recurso)** | Captura manual obligatoria | A y C fallan. El sistema **exige** que el usuario capture un estimado > 0 y lo marca para auditoría. | `manual` |

Cada requisición Yonke persiste su `origen_costo_estimado`, de modo que Dirección conoce la confiabilidad de cada dato.

> Se conserva la nomenclatura "A → C → manual" de la especificación funcional v2.0 §5.2 (el nivel intermedio "B" se colapsó a fallback de catálogo en la decisión final; no se renumera para no romper trazabilidad con la spec).

## 3. Consecuencias

**Positivas**
- El consolidado nunca se subvalúa por piezas Yonke; el veredicto de rentabilidad se mantiene honesto.
- La confiabilidad de cada estimado es auditable (`origen_costo_estimado`).
- Reversible: cuando finanzas defina la regla contable formal, se cambia el `Service` sin tocar el modelo de datos.

**Negativas / trade-offs aceptados**
- Un estimado por "última compra" puede quedar obsoleto si el precio de mercado cambió; se acepta como aproximación del MVP.
- El nivel manual depende del juicio del usuario del taller (baja estandarización); mitigado marcándolo explícitamente para revisión de Dirección.

**Neutrales**
- No afecta la ruta Compra, que usa `costo_real` facturado.

## 4. Impacto en documentos existentes

- **03 Modelo de datos:** campos `costo_estimado`, `costo_real`, `origen_costo_estimado`, `numero_factura` en `requisiciones`; tabla `catalogo_piezas`.
- **05 API:** el endpoint de creación/instalación de requisición Yonke devuelve el `costo_estimado` calculado y su origen.
- **04 Seguridad:** la función de valorización vive server-side; el cliente no puede inyectar un costo que evada la cascada (salvo el manual, que se marca).
- **06 Pruebas:** casos para cada nivel de la cascada y para el caso borde A+C fallan → exige manual.

## 5. Implicaciones de seguridad

- El cálculo es **server-side**: un cliente no puede forzar un `costo_estimado = 0` para una pieza Yonke; la validación rechaza Yonke sin costo > 0 antes de instalar.
- El campo `origen_costo_estimado` es asignado por el backend, no por el cliente, para que no se pueda falsear la confiabilidad del dato.
- Toda instalación Yonke queda en `auditoria` con el origen del estimado.

## 6. Regla de negocio asociada (UI)

Un `costo_estimado` (Yonke) siempre se presenta visualmente distinto de un `costo_real` (Compra): badge naranja "Yonke / Estimado" frente a badge neutro "Compra". El sistema **nunca** hace pasar un estimado por un dato facturado (ver [08 Design System](../../01-vision/08_identidad_visual_design_system.md)).
