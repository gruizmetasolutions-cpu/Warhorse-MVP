export function descargarCSV(headers: string[], rows: string[][], filename: string) {
  const csvContent =
    '\uFEFF' + // UTF-8 BOM
    [headers.join(','), ...rows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
