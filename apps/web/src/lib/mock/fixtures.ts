// Únicos datos aún simulados tras el Sprint 5: la matriz visual de Usuarios
// (de solo lectura hasta que el módulo se haga real en el Sprint 6).
export const usuariosIniciales = [
  { id: 'u1', nombre: 'Edgar Fraga', rol: 'taller', activo: true },
  { id: 'u2', nombre: 'Montzay Vázquez', rol: 'compras', activo: true },
  { id: 'u3', nombre: 'Dirección WarHorse', rol: 'admin', activo: true },
  { id: 'u4', nombre: 'Héctor Ramírez', rol: 'taller', activo: true },
  { id: 'u5', nombre: 'Karla Ortiz', rol: 'compras', activo: false },
] as const

export const permisosIniciales: Record<string, boolean> = {
  'admin:dashboard': true, 'admin:requisicion': true, 'admin:compras': true, 'admin:catalogo': true, 'admin:usuarios': true,
  'taller:dashboard': false, 'taller:requisicion': true, 'taller:compras': false, 'taller:catalogo': true, 'taller:usuarios': false,
  'compras:dashboard': false, 'compras:requisicion': false, 'compras:compras': true, 'compras:catalogo': true, 'compras:usuarios': false,
}
