import { jsPDF } from 'jspdf'
import type { UsuarioCreado } from './api'

const rolNombre: Record<string, string> = {
  admin: 'Dirección (Admin)',
  taller: 'Taller',
  compras: 'Compras',
  diesel: 'Control de Diésel',
}

// Genera y descarga un PDF de una página con las credenciales temporales del
// nuevo usuario, para entregárselo en mano (alta sin correo). La contraseña
// temporal solo existe en este momento, así que el PDF se arma desde la
// respuesta del alta.
export function descargarCredencialesPdf(usuario: UsuarioCreado): void {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const izq = 56
  let y = 70

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor('#16191E')
  doc.text('HUB DE GASTOS · WARHORSE', izq, y)

  y += 14
  doc.setDrawColor('#F2620F')
  doc.setLineWidth(3)
  doc.line(izq, y, izq + 220, y)

  y += 40
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor('#4A4438')
  doc.text('Credenciales de acceso — entrégalas a la persona en mano.', izq, y)

  const fila = (etiqueta: string, valor: string, resaltar = false): void => {
    y += 34
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor('#8A8374')
    doc.text(etiqueta.toUpperCase(), izq, y)
    y += 18
    doc.setFont(resaltar ? 'courier' : 'helvetica', 'bold')
    doc.setFontSize(resaltar ? 20 : 15)
    doc.setTextColor(resaltar ? '#B4430A' : '#16191E')
    doc.text(valor, izq, y)
  }

  fila('Nombre', usuario.nombre)
  fila('Correo (usuario)', usuario.email)
  fila('Rol', rolNombre[usuario.rol] ?? usuario.rol)
  fila('Contraseña temporal', usuario.password_temporal, true)

  y += 44
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(11)
  doc.setTextColor('#6F6A60')
  doc.text('Al iniciar sesión por primera vez se te pedirá crear tu propia', izq, y)
  doc.text('contraseña. Esta temporal dejará de funcionar en ese momento.', izq, y + 16)

  const slug = usuario.email.split('@')[0].replace(/[^a-z0-9]+/gi, '-') || 'usuario'
  doc.save(`credenciales-${slug}.pdf`)
}
