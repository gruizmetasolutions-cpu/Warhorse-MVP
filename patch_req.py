import re

with open(r"apps\web\src\pages\Requisicion.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    "import { ApiError, crearRequisicion, getArticulosAlmacen, type ArticuloAlmacenApi } from '../lib/api'",
    "import { ApiError, crearRequisicion, getArticulosAlmacen, getOrdenesTrabajo, type ArticuloAlmacenApi, type OrdenTrabajoApi } from '../lib/api'"
)

c = c.replace(
    "const [numeroSerie, setNumeroSerie] = useState('')",
    "const [numeroSerie, setNumeroSerie] = useState('')\n  const [ordenTrabajoId, setOrdenTrabajoId] = useState('')\n  const [ordenesTrabajo, setOrdenesTrabajo] = useState<OrdenTrabajoApi[]>([])"
)

c = c.replace(
    "void getArticulosAlmacen().then(setArticulos)",
    "getArticulosAlmacen().then(setArticulos).catch(() => {})\n    getOrdenesTrabajo().then(setOrdenesTrabajo).catch(() => {})"
)

c = c.replace(
    "numero_serie: numeroSerie.trim() || undefined,\n        })",
    "numero_serie: numeroSerie.trim() || undefined,\n          orden_trabajo_id: ordenTrabajoId ? Number(ordenTrabajoId) : null,\n        })"
)

c = c.replace(
    "setSelArticuloId('')",
    "setSelArticuloId(''); setOrdenTrabajoId('')"
)

c = c.replace(
    """        <label style={etiqueta}>
          Tipo de Origen
          <span style={ayudaCampo}>¿Cómo se resolverá esta requisición?</span>
          <select
            value={origen}
            onChange={(e) => {
              setOrigen(e.target.value as Origen)
              setError('')
            }}
            style={{ padding: '10px', border: '1px solid #D8D2C4', borderRadius: 8, fontSize: 14 }}
          >
            <option value="Compra">Compra Nueva</option>
            <option value="Inventario">Tomar de Inventario (Stock)</option>
            <option value="Yonke">Extraer de Yonke</option>
          </select>
        </label>""",
    """        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <label style={etiqueta}>
            Tipo de Origen
            <span style={ayudaCampo}>¿Cómo se resolverá esta requisición?</span>
            <select
              value={origen}
              onChange={(e) => {
                setOrigen(e.target.value as Origen)
                setError('')
              }}
              style={{ padding: '10px', border: '1px solid #D8D2C4', borderRadius: 8, fontSize: 14 }}
            >
              <option value="Compra">Compra Nueva</option>
              <option value="Inventario">Tomar de Inventario (Stock)</option>
              <option value="Yonke">Extraer de Yonke</option>
            </select>
          </label>
          <label style={etiqueta}>
            Orden de Trabajo (Opcional)
            <span style={ayudaCampo}>Si la requisición pertenece a una orden activa de taller</span>
            <select
              value={ordenTrabajoId}
              onChange={(e) => setOrdenTrabajoId(e.target.value)}
              style={{ padding: '10px', border: '1px solid #D8D2C4', borderRadius: 8, fontSize: 14 }}
            >
              <option value="">-- Ninguna --</option>
              {ordenesTrabajo.filter(ot => ot.estado === 'Activa').map((ot) => (
                <option key={ot.id} value={ot.id}>
                  {ot.folio} - {ot.unidad?.id_unidad || `Unidad ${ot.unidad?.id || '?'}`} ({ot.diagnostico})
                </option>
              ))}
            </select>
          </label>
        </div>"""
)

with open(r"apps\web\src\pages\Requisicion.tsx", "w", encoding="utf-8") as f:
    f.write(c)

