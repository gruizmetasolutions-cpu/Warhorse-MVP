# 08 — Identidad Visual y Design System
## Warhorse — Hub Consolidador de Gastos por Tracto

| | |
|---|---|
| **Documento** | 08 — Identidad Visual y Design System |
| **Versión** | 2.0 |
| **Fecha** | 7 de julio de 2026 |
| **Origen** | Tokens extraídos del demo UI/UX construido y validado (`Hub Gastos Tracto - Standalone.html`). |
| **Dirección** | Industrial / operativo: naranja de marca sobre crema y casi-negro, tipografía condensada confiada. |
| **Depende de** | [09 Demo-UX](../demo-ux/09_demo_ux_guia.md), [ADR-003](../02-arquitectura/ADR/ADR-003_demo-first-esqueleto-reutilizable.md) |

> *v2.0: la identidad oficial es la del **demo construido** (naranja/crema/Barlow). La paleta azul del PDF Fleet Intelligence Hub (#1B4E8C, Poppins/Inter) queda **superada** como identidad de marca; el azul sobrevive únicamente como color semántico del estado "Comprado" en badges.*

---

## 1. Identidad de marca

| Campo | Valor |
|---|---|
| Producto | Hub de Gastos por Tracto |
| Endoso | WarHorse México · Dataholics |
| Propósito | Consolidar el gasto por unidad y responder "¿vale la pena meterle más lana a este tracto?" |
| Personalidad | Industrial, directo, confiable, sin adornos. Herramienta de piso de taller y de dirección. |
| Tono visual | Alto contraste, tipografía condensada en mayúsculas para títulos y cifras; superficies limpias sobre fondo cálido. |
| Antipatrones | No usar la paleta azul del PDF como marca; no íconos rellenos ni ilustraciones fotográficas; no saturar el elemento de firma (camión de línea); no degradados decorativos fuera del gauge. |

**Colores de marca primordiales:**

| Hex | Nombre | Rol |
|---|---|---|
| `#F2620F` | Naranja WarHorse | Acción, acento, elemento crítico, marca. |
| `#16191E` | Casi-negro (Ink) | Texto principal, barras normales, botones oscuros. |
| `#F3EFE7` | Crema | Fondo general de la app. |

---

## 2. Paleta de color completa

### 2.1 Tokens base (neutros, superficies, texto)

| Token | Hex | Uso |
|---|---|---|
| `--wh-bg` | `#F3EFE7` | Fondo general (crema). |
| `--wh-surface` | `#FFFFFF` | Superficie de tarjetas y paneles. |
| `--wh-ink` | `#16191E` | Texto principal / casi-negro. |
| `--wh-ink-soft` | `#4A4438` | Texto sobre chips neutros. |
| `--wh-muted` | `#6F6A60` | Texto secundario / captions. |
| `--wh-muted-2` | `#8A8374` | Labels en mayúsculas, metadatos. |
| `--wh-on-dark` | `#DDD7CB` | Texto sobre superficies oscuras (login). |
| `--wh-nav-idle` | `#B8B2A6` | Ítem de navegación inactivo. |
| `--wh-border` | `#D8D2C4` | Bordes de inputs y tarjetas. |
| `--wh-border-soft` | `#EFEAE0` | Bordes/divisores suaves (filas de tabla). |
| `--wh-chip-neutral` | `#EAE6DC` | Fondo de chip neutro. |

### 2.2 Colores de marca / acento

| Token | Hex | Uso |
|---|---|---|
| `--wh-orange` | `#F2620F` | Primario: botones, acentos, borde activo, tracto crítico. |
| `--wh-orange-hover` | `#D9550C` | Hover del primario. |
| `--wh-orange-soft` | `#FDE8DC` | Fondo suave (badge Yonke/crítico). |
| `--wh-orange-ink` | `#B4430A` | Texto sobre fondo naranja suave. |
| `--wh-orange-focus` | `#F9B48A` | Anillo de foco de teclado. |
| `--wh-orange-04` | `rgba(242,98,15,0.16)` | Fondo de ítem de navegación activo. |

### 2.3 Colores semánticos de estado

| Estado | Fondo suave | Texto | Borde | Uso |
|---|---|---|---|---|
| Success / Total / Activo / Rápida | `--wh-green-soft #E5F3E9` | `#2C7A44` | `#9FD4B0` | Reparación total, unidad activa, urgencia rápida, estado Instalado. |
| Warning / Media / Cotizado | `--wh-amber-soft #FBF3D9` | `#8A6D1A` | `#E0C36A` | Criticidad media, estado Cotizado. |
| Error / Crítico / Yonke | `--wh-orange-soft #FDE8DC` | `#B4430A` | `#F2620F` | Criticidad crítica, origen Yonke, mejoralito. |
| Info / Comprado | `--wh-blue-soft #E3ECF7` | `#1B4E8C` | `#9FC0E4` | Estado "Comprado" (único uso del azul del PDF). |
| Neutral / Solicitado / Inactivo | `--wh-chip-neutral #EAE6DC` | `#4A4438` | `#C9C2B2` | Estado Solicitado, unidad inactiva, chip neutro. |

Acento verde de marca sólido: `--wh-green #3FA65C` (avatar de rol Compras, acento positivo).

### 2.4 Reglas de accesibilidad (WCAG 2.1 AA)

| Fondo | Texto | Ratio aprox. | Veredicto |
|---|---|---|---|
| `#F3EFE7` crema | `#16191E` ink | ~15:1 | AAA ✔ |
| `#FFFFFF` blanco | `#16191E` ink | ~17:1 | AAA ✔ |
| `#FFFFFF` | `#6F6A60` muted | ~4.7:1 | AA (texto normal) ✔ |
| `#FDE8DC` naranja soft | `#B4430A` orange-ink | ~5.1:1 | AA ✔ |
| `#E5F3E9` verde soft | `#2C7A44` | ~4.9:1 | AA ✔ |
| `#16191E` ink | `#F3EFE7` crema | ~15:1 | AAA ✔ |
| **EVITAR:** `#F2620F` naranja | `#FFFFFF` blanco | ~3.0:1 | Solo botones (texto grande/bold ≥18px); no en cuerpos. |
| **EVITAR:** `#F3EFE7` | `#8A8374` muted-2 | ~3.1:1 | Solo texto ≥18px bold (labels en mayúsculas). |

---

## 3. Tipografía

| Fuente | Origen | Uso |
|---|---|---|
| **Barlow Condensed** | Google Fonts | Encabezados (H1–H3), KPIs, cifras, labels en mayúsculas, botones. Peso 600–700, `letter-spacing` 0.04–0.22em, `text-transform: uppercase`. |
| **Barlow** | Google Fonts | Cuerpo, datos de tabla, formularios, párrafos. Peso 400–600. |

Escala tipográfica:

| Nivel | Fuente | Tamaño | Peso | Line-height | Uso |
|---|---|---|---|---|---|
| Display (login) | Barlow Condensed | clamp(40–68px) | 700 | 0.98 | Título del login. |
| H1 | Barlow Condensed | 34px | 700 | 1.0 | Título de vista. |
| H2 KPI | Barlow Condensed | 38px | 700 | 1.0 | Valor de KPI (tabular-nums). |
| H3 | Barlow Condensed | 19px | 700 | 1.1 | Título de tarjeta/sección. |
| Label | Barlow Condensed | 13px | 600 | — | Metadatos en mayúsculas, `letter-spacing` 0.14–0.2em. |
| Cuerpo | Barlow | 14–16px | 400–600 | 1.4 | Texto, tablas, formularios. |
| Cifra tabla | Barlow Condensed | 16–18px | 700 | — | Montos (tabular-nums). |

Regla de jerarquía: los títulos y las cifras van en Barlow Condensed en mayúsculas; el contenido corrido en Barlow. **Todos los montos y porcentajes usan `font-variant-numeric: tabular-nums`** para que las columnas alineen.

---

## 4. Espaciado y layout

- **Escala de espaciado:** múltiplos de 4px (4, 8, 12, 16, 24, 32).
- **Radios de borde:** inputs/botones 8–10px; tarjetas 12–14px; chips/badges 6px; píldoras (urgencia/filtros) 999px.
- **Sombras:** tarjeta `0 2px 8px rgba(0,0,0,0.05)`; botón primario `0 4px 12px rgba(242,98,15,0.3)`; selección `0 2px 8px rgba(242,98,15,0.18)`.
- **Layout app:** navegación lateral izquierda (vertical, ítems en mayúsculas con borde-izquierdo naranja activo) + área de contenido sobre fondo crema. Login a dos columnas (60% panel oscuro informativo / 40% formulario).
- **Breakpoints (Tailwind):** `sm 640` `md 768` `lg 1024` `xl 1280`. En móvil: nav colapsa a barra superior/hamburguesa; login apila (info compacta arriba, formulario abajo); tablas con scroll horizontal o tarjetas apiladas; formulario de requisición a una columna.

---

## 5. Componentes

### 5.1 Botón
**Anatomía:** contenedor + label (Barlow Condensed uppercase) + opcional flecha.
**Variantes:** primario (naranja, texto blanco, sombra), oscuro (ink, texto crema — "Ver ficha completa"), secundario/outline (borde `--wh-border`, texto muted).
**Estados:** default; hover (primario→`#D9550C` + `translateY(-1px)`); focus (`outline: 3px solid #F9B48A`); disabled (opacidad 0.5, sin sombra).
**Uso:** primario para la acción principal por vista (Arrancar, Enviar requisición, + Agregar); oscuro para navegación secundaria.

```tsx
<button className="bg-wh-orange hover:bg-wh-orange-hover focus:outline-none focus-visible:ring-4 focus-visible:ring-wh-orange-focus
  text-white font-display font-bold uppercase tracking-wide px-5 py-3.5 rounded-[9px] shadow-[0_4px_12px_rgba(242,98,15,0.35)]
  transition-transform hover:-translate-y-px">
  Enviar requisición
</button>
```
Tokens: `--wh-orange`, `--wh-orange-hover`, `--wh-orange-focus`.

### 5.2 Input / Select / Textarea
**Estados:** default (borde `--wh-border`, fondo blanco); focus (borde naranja + ring suave); error (borde `#F2620F`, mensaje `--wh-orange-ink`); disabled.
**Uso:** validación numérica estricta en campos de costo/litros/km (rechaza texto). Foco siempre visible.

```tsx
<input className="w-full bg-white border border-wh-border rounded-[9px] px-4 py-3 font-body text-wh-ink
  focus:outline-none focus:border-wh-orange focus-visible:ring-4 focus-visible:ring-wh-orange-focus" />
```

### 5.3 Badge / Chip
**Variantes:** criticidad (Rápida verde / Media ámbar / Crítica naranja), origen (Yonke naranja / Compra neutro), estado requisición (Solicitado neutro / Cotizado ámbar / Comprado azul / Instalado verde), estado unidad (Activo verde / Yonke naranja / Inactivo neutro).
**Regla dura:** el badge de origen **Yonke** siempre acompaña un costo marcado como *estimado*; nunca se muestra un estimado con el estilo de un dato facturado (ver [ADR-002](../02-arquitectura/ADR/ADR-002_valorizacion-yonke-cascada.md)).

```tsx
// badge(bg, fg, border): fontSize 12px, weight 700, padding 3px 10px, radius 6px
<span className="text-[12px] font-bold px-2.5 py-0.5 rounded-md
  bg-wh-orange-soft text-wh-orange-ink border border-wh-orange">Yonke · Estimado</span>
```

### 5.4 Tarjeta (KPI / panel)
**Anatomía:** superficie blanca, radio 12–14px, sombra suave, label en mayúsculas + valor grande tabular-nums.
**Uso:** fila de KPIs del Dashboard y de la ficha; paneles de gráficas.

### 5.5 Tabla
**Anatomía:** encabezados en Barlow Condensed uppercase muted; filas con divisor `--wh-border-soft`; montos alineados a la derecha, tabular-nums.
**Uso:** Panel de Compras, Catálogo, Usuarios, historial de reparaciones.
**Estados:** fila hover (fondo crema sutil), fila clickeable (cursor pointer → ficha).

### 5.6 Navegación lateral
**Anatomía:** logo arriba, lista vertical de módulos (uppercase). Ítem activo: fondo `--wh-orange-04`, borde-izquierdo 3px `--wh-orange`, texto naranja; inactivo: texto `--wh-nav-idle`.
**Uso:** los ítems visibles dependen del rol (matriz de permisos, RF-USR-03).

### 5.7 Avatar
Círculo con iniciales; color por rol: admin `#16191E`, taller `#F2620F`, compras `#3FA65C`; opacidad 0.45 si suspendido.

### 5.8 Gráficas (Dashboard)
- **Barras** "Gasto por tracto": barras `--wh-ink`; la del tracto crítico con `repeating-linear-gradient` naranja (rayado); la seleccionada con `outline` naranja. Animación `growBar 0.5s ease`.
- **Gauge** de eficiencia: semicírculo con gradiente gris→naranja→verde; aguja según km/L.
- **Donut** de mantenimiento: % Reparación Total (verde) vs. Mejoralito (naranja).
- **Caja de decisión:** bloque destacado con el veredicto (Mantener/Vender) y su razón textual.

### 5.9 Modal (confirmación)
Usado para "Confirmar instalación" antes de mover una requisición a Instalado. Fondo con overlay, tarjeta blanca, botón primario naranja + cancelar.

### 5.10 Toast / Notificación
Aviso temporal (≈3.2s) tras una acción ("Requisición enviada — Compras la verá en su panel").

### 5.11 Recorrido guiado (tour) y estado vacío
- **Tour:** overlay con recuadro resaltado sobre el elemento (`data-tour`), paso N de M, botón siguiente naranja. Saltable y repetible.
- **Estado vacío:** usa el elemento de firma (camión de línea azul/ink) con moderación ("aún no hay unidades en esta vista"). No repetir el camión en pantallas con datos.

---

## 6. Tokens CSS completos

```css
:root {
  /* Base */
  --wh-bg: #F3EFE7;
  --wh-surface: #FFFFFF;
  --wh-ink: #16191E;
  --wh-ink-soft: #4A4438;
  --wh-muted: #6F6A60;
  --wh-muted-2: #8A8374;
  --wh-on-dark: #DDD7CB;
  --wh-nav-idle: #B8B2A6;
  --wh-border: #D8D2C4;
  --wh-border-soft: #EFEAE0;
  --wh-chip-neutral: #EAE6DC;

  /* Marca / acento */
  --wh-orange: #F2620F;
  --wh-orange-hover: #D9550C;
  --wh-orange-soft: #FDE8DC;
  --wh-orange-ink: #B4430A;
  --wh-orange-focus: #F9B48A;
  --wh-orange-04: rgba(242,98,15,0.16);

  /* Semánticos */
  --wh-green: #3FA65C;
  --wh-green-soft: #E5F3E9;
  --wh-green-ink: #2C7A44;
  --wh-green-border: #9FD4B0;
  --wh-amber-soft: #FBF3D9;
  --wh-amber-ink: #8A6D1A;
  --wh-amber-border: #E0C36A;
  --wh-blue-soft: #E3ECF7;   /* estado Comprado */
  --wh-blue-ink: #1B4E8C;
  --wh-blue-border: #9FC0E4;

  /* Sombras / radios */
  --wh-shadow-card: 0 2px 8px rgba(0,0,0,0.05);
  --wh-shadow-btn: 0 4px 12px rgba(242,98,15,0.30);
  --wh-radius-input: 9px;
  --wh-radius-card: 13px;
  --wh-radius-chip: 6px;

  /* Tipografía */
  --wh-font-body: 'Barlow', system-ui, sans-serif;
  --wh-font-display: 'Barlow Condensed', 'Barlow', sans-serif;
}
```

## 7. Configuración de Tailwind (v4 `@theme`)

```css
/* styles/tokens.css — importado en el entry de Vite */
@import "tailwindcss";

@theme {
  --color-wh-bg: #F3EFE7;
  --color-wh-surface: #FFFFFF;
  --color-wh-ink: #16191E;
  --color-wh-ink-soft: #4A4438;
  --color-wh-muted: #6F6A60;
  --color-wh-muted-2: #8A8374;
  --color-wh-border: #D8D2C4;
  --color-wh-border-soft: #EFEAE0;
  --color-wh-chip-neutral: #EAE6DC;

  --color-wh-orange: #F2620F;
  --color-wh-orange-hover: #D9550C;
  --color-wh-orange-soft: #FDE8DC;
  --color-wh-orange-ink: #B4430A;
  --color-wh-orange-focus: #F9B48A;

  --color-wh-green: #3FA65C;
  --color-wh-green-soft: #E5F3E9;
  --color-wh-amber-soft: #FBF3D9;
  --color-wh-blue-soft: #E3ECF7;

  --font-body: "Barlow", system-ui, sans-serif;
  --font-display: "Barlow Condensed", "Barlow", sans-serif;

  --radius-input: 9px;
  --radius-card: 13px;
}
```

Carga de fuentes (en `index.html`):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;700&family=Barlow+Condensed:wght@600;700&display=swap" rel="stylesheet">
```

## 8. Iconografía

Iconografía **de línea** (line-art), coherente con el camión y el motor dibujados del PDF. Librería recomendada: `lucide-react` (trazo, no relleno). Tamaños estándar: 16px (inline), 20px (navegación/acciones), 24px (encabezados). Color: hereda `currentColor` (ink o naranja). **No** usar íconos rellenos ni emojis.

## 9. Animaciones y microinteracciones

- Duración estándar 150–300ms; easing `ease` / `ease-out`.
- Botón primario hover: `translateY(-1px)` + cambio de fondo.
- Barras del dashboard: `growBar 0.5s ease` al montar; transición de altura 0.3s al re-seleccionar.
- Toast: entra/desvanece en ~200ms, permanece ~3.2s.
- Respetar `prefers-reduced-motion`: desactivar animaciones no esenciales.

## 10. Verificación de accesibilidad

Todas las combinaciones en uso están tabuladas en §2.4. Reglas verificables: contraste AA en texto normal y AAA en texto principal sobre superficies; foco de teclado siempre visible (anillo `--wh-orange-focus`); navegación completa por teclado sin trampas de foco; HTML semántico y jerarquía de encabezados válida; roles/labels ARIA en gráficas (texto alternativo del veredicto y de los KPIs); el color nunca es el único portador de significado (badges llevan texto además de color). Detalle operativo en el doc [09](../demo-ux/09_demo_ux_guia.md) §6.
