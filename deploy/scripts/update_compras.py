import os
import re

filepath = r'C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\pages\Compras.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'const [revertirReq, setRevertirReq] = useState<FilaCompras | null>(null)',
    'const [revertirReq, setRevertirReq] = useState<FilaCompras | null>(null)\n  const [origenRefaccion, setOrigenRefaccion] = useState(\'\')'
)

content = content.replace(
    "estado: 'Comprado',",
    "estado: 'Comprado',\n          origen_refaccion: origenRefaccion.trim() || undefined,"
)

content = content.replace(
    "setFactura('')\n              setArchivoFactura(null)",
    "setFactura('')\n              setArchivoFactura(null)\n              setOrigenRefaccion('')"
)

content = re.sub(
    r'<label style=\{etiqueta\}>\s*NÃºmero de factura \(Opcional\)',
    r'<label style={etiqueta}>\n                  Origen de la compra / refacción\n                  <input type="text" style={campo} value={origenRefaccion} onChange={(e) => setOrigenRefaccion(e.target.value)} placeholder="Ej. Nacional, Importado, Distribuidor Local" />\n                </label>\n                <label style={etiqueta}>\n                  Número de factura (Opcional)',
    content
)

# Also handle without the utf-8 artifacts
content = re.sub(
    r'<label style=\{etiqueta\}>\s*NÃ.mero de factura \(Opcional\)',
    r'<label style={etiqueta}>\n                  Origen de la compra / refacción\n                  <input type="text" style={campo} value={origenRefaccion} onChange={(e) => setOrigenRefaccion(e.target.value)} placeholder="Ej. Nacional, Importado, Distribuidor Local" />\n                </label>\n                <label style={etiqueta}>\n                  Número de factura (Opcional)',
    content
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
