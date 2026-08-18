import os
import re

filepath = r'C:\Users\luisc\Documents\Dataholics\Dataholics Guidelines\proyectos\Warhorse\apps\web\src\pages\Catalogo.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Alta interface
content = re.sub(
    r"vencimiento_documentacion: string\n  \}",
    "vencimiento_documentacion: string\n    vin: string\n    numero_economico: string\n    marca: string\n    modelo: string\n    placas: string\n  }",
    content
)

# 2. Update altaVacia
content = re.sub(
    r"const altaVacia: Alta = \{ id_unidad: '', tipo: 'Tractor', estado: 'Activo', fecha_alta: '', valor_referencia: '', vencimiento_documentacion: '' \}",
    "const altaVacia: Alta = { id_unidad: '', tipo: 'Tractor', estado: 'Activo', fecha_alta: '', valor_referencia: '', vencimiento_documentacion: '', vin: '', numero_economico: '', marca: '', modelo: '', placas: '' }",
    content
)

# 3. Update crearUnidad call
content = re.sub(
    r"vencimiento_documentacion: alta\.vencimiento_documentacion === '' \? null : alta\.vencimiento_documentacion,",
    "vencimiento_documentacion: alta.vencimiento_documentacion === '' ? null : alta.vencimiento_documentacion,\n          vin: alta.vin === '' ? null : alta.vin,\n          numero_economico: alta.numero_economico === '' ? null : alta.numero_economico,\n          marca: alta.marca === '' ? null : alta.marca,\n          modelo: alta.modelo === '' ? null : alta.modelo,\n          placas: alta.placas === '' ? null : alta.placas,",
    content
)

# 4. Update table headers
content = re.sub(
    r'<SortTh col="id_unidad" label="Unidad"([^>]+)/>',
    r'<SortTh col="id_unidad" label="ID Unidad" \1/>\n                  <SortTh col="vin" label="VIN / Económico" sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} />\n                  <SortTh col="marca" label="Vehículo" sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} />\n                  <SortTh col="placas" label="Placas" sortCol={ctrl.sortCol} sortDir={ctrl.sortDir} onSort={ctrl.toggleSort} />',
    content
)

# 5. Update table rows
content = re.sub(
    r'<td style=\{\{ ...tdCell, fontFamily: FD, fontWeight: 700, fontSize: 17, color: \'var\(--text-main\)\' \}\}>\{t\.id_unidad\}</td>',
    r'<td style={{ ...tdCell, fontFamily: FD, fontWeight: 700, fontSize: 17, color: \'var(--text-main)\' }}>{t.id_unidad}</td>\n                      <td style={tdCell}>{t.vin || \'<No VIN>\'} <br/><span style={{fontSize: 12, color:\'var(--text-muted)\'}}>{t.numero_economico}</span></td>\n                      <td style={tdCell}>{t.marca} {t.modelo}</td>\n                      <td style={tdCell}>{t.placas}</td>',
    content
)

# 6. Update Alta modal inputs (insert after "Vencimiento Documentos")
alta_inputs = """
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <label style={etiqueta}>
                  VIN
                  <input type="text" style={campo} value={alta.vin} onChange={(e) => setAlta({ ...alta, vin: e.target.value })} />
                </label>
                <label style={etiqueta}>
                  Número Económico
                  <input type="text" style={campo} value={alta.numero_economico} onChange={(e) => setAlta({ ...alta, numero_economico: e.target.value })} />
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <label style={etiqueta}>
                  Marca
                  <input type="text" style={campo} value={alta.marca} onChange={(e) => setAlta({ ...alta, marca: e.target.value })} />
                </label>
                <label style={etiqueta}>
                  Modelo
                  <input type="text" style={campo} value={alta.modelo} onChange={(e) => setAlta({ ...alta, modelo: e.target.value })} />
                </label>
                <label style={etiqueta}>
                  Placas
                  <input type="text" style={campo} value={alta.placas} onChange={(e) => setAlta({ ...alta, placas: e.target.value })} />
                </label>
              </div>
"""
content = re.sub(
    r'<label style=\{etiqueta\}>\s*Vencimiento Documentos \(Placas/Vigencia\)\s*<input type="date" style=\{campo\} value=\{alta\.vencimiento_documentacion\} onChange=\{\(e\) => setAlta\(\{ \.\.\.alta, vencimiento_documentacion: e\.target\.value \}\)\} />\s*</label>',
    r'<label style={etiqueta}>\n                Vencimiento Documentos (Placas/Vigencia)\n                <input type="date" style={campo} value={alta.vencimiento_documentacion} onChange={(e) => setAlta({ ...alta, vencimiento_documentacion: e.target.value })} />\n              </label>' + alta_inputs,
    content
)

# 7. Update Editar modal inputs
editar_inputs = """
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <label style={etiqueta}>
                  VIN
                  <input type="text" style={campo} value={editar.vin || ''} onChange={(e) => setEditar({ ...editar, vin: e.target.value })} />
                </label>
                <label style={etiqueta}>
                  Número Económico
                  <input type="text" style={campo} value={editar.numero_economico || ''} onChange={(e) => setEditar({ ...editar, numero_economico: e.target.value })} />
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <label style={etiqueta}>
                  Marca
                  <input type="text" style={campo} value={editar.marca || ''} onChange={(e) => setEditar({ ...editar, marca: e.target.value })} />
                </label>
                <label style={etiqueta}>
                  Modelo
                  <input type="text" style={campo} value={editar.modelo || ''} onChange={(e) => setEditar({ ...editar, modelo: e.target.value })} />
                </label>
                <label style={etiqueta}>
                  Placas
                  <input type="text" style={campo} value={editar.placas || ''} onChange={(e) => setEditar({ ...editar, placas: e.target.value })} />
                </label>
              </div>
"""
content = re.sub(
    r'<label style=\{etiqueta\}>\s*Vencimiento Documentos \(Placas/Vigencia\)\s*<input type="date" style=\{campo\} value=\{editar\.vencimiento_documentacion\} onChange=\{\(e\) => setEditar\(\{ \.\.\.editar, vencimiento_documentacion: e\.target\.value \}\)\} />\s*</label>',
    r'<label style={etiqueta}>\n                Vencimiento Documentos (Placas/Vigencia)\n                <input type="date" style={campo} value={editar.vencimiento_documentacion} onChange={(e) => setEditar({ ...editar, vencimiento_documentacion: e.target.value })} />\n              </label>' + editar_inputs,
    content
)

# 8. Add fields to editar object tracking
content = re.sub(
    r'vencimiento_documentacion: editar\.vencimiento_documentacion,',
    r'vencimiento_documentacion: editar.vencimiento_documentacion,\n      vin: editar.vin,\n      numero_economico: editar.numero_economico,\n      marca: editar.marca,\n      modelo: editar.modelo,\n      placas: editar.placas,',
    content
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated Catalogo.tsx")
