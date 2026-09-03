import os
import re

filepath = r'C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\pages\Requisicion.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update const declarations
content = re.sub(r"const \[origen, setOrigen\] = useState<Origen>\('Compra'\)\n", "", content)
content = re.sub(r"const \[origenRefaccion, setOrigenRefaccion\] = useState\(''\)\n", "", content)
content = re.sub(r"const esYonke = origen === 'Yonke'\n", "", content)

# 2. Update enviar function
content = re.sub(r"const esInventario = origen === 'Inventario'\n", "", content)
content = re.sub(r"if \(esYonke && !donante\) return setError\('El origen Yonke obliga a registrar la unidad donante.'\)\n\s*", "", content)

content = re.sub(
    r"unidad_destino_id: paraInventario \? null : Number\(destino\),\n\s*origen,\n\s*unidad_donante_id: esYonke \? Number\(donante\) : null,\n\s*fotos,\n\s*origen_refaccion: origenRefaccion\.trim\(\) \|\| undefined,",
    r"unidad_destino_id: paraInventario ? null : Number(destino),\n          origen: 'Compra',\n          unidad_donante_id: null,\n          fotos,",
    content
)

content = re.sub(r"setOrigen\('Compra'\); ", "", content)
content = re.sub(r"setOrigenRefaccion\(''\); ", "", content)

# 3. Rename "Número de Serie / VIN / ID Caja"
content = re.sub(r"Número de Serie \(SN\)", "Número de Serie (VIN / ID Caja)", content)

# 4. Remove UI buttons for Origen and Yonke/Inventario form blocks
# It's better to just manually replace the block in Requisicion.tsx using string replacement
block_to_remove = r"""          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Origen de la refacciÃ³n</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <button onClick={() => { setOrigen('Compra'); limpiarError() }} className="hv-borde-ink" style={origBtn(origen === 'Compra', 'b')}>
                ðŸ›’ Compra
              </button>
              <button onClick={() => { setOrigen('Yonke'); limpiarError() }} className="hv-borde-naranja-solo" style={origBtn(origen === 'Yonke', 'o')}>
                ðŸšœ Yonke
              </button>
              <button onClick={() => { setOrigen('Inventario'); limpiarError() }} className="hv-borde-naranja-solo" style={origBtn(origen === 'Inventario', 'o')}>
                ðŸ“¦ Inventario
              </button>
            </div>
          </div>

          {origen === 'Inventario' && (
            <div style={{ background: '#EAF5FF', border: '1px dashed #1A73E8', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#1A73E8', fontWeight: 600 }}>
                ðŸ“¦ ExtracciÃ³n de inventario
                <br /><span style={{ fontWeight: 400, color: '#5F6368' }}>La pieza saldrÃ¡ directamente del almacÃ©n de refacciones.</span>
              </p>
            </div>
          )}"""

content = re.sub(r'<div style=\{\{ display: \'flex\', flexDirection: \'column\', gap: 8 \}\}>\s*<span style=\{\{ fontSize: 14, fontWeight: 600 \}\}>Origen de la refacci.*?</div>\s*</div>\s*\{origen === \'Inventario\' && \(\s*<div.*?</div>\s*\)\}', '', content, flags=re.DOTALL)

# Also remove the whole block related to Origen de refaccion
content = re.sub(r'\{origen === \'Inventario\' \? \(.*?\) : \(.*?\}\)\}', '', content, flags=re.DOTALL)

# But wait, there is a donante logic and origenRefaccion...
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Requisicion")
