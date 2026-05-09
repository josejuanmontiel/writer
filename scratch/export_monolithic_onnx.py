import os
from pathlib import Path
from gliner import GLiNER

# Utilizaremos el modelo multilingüe oficial que soporta extracción de relaciones (si usamos v2.1)
# o el v2.5. Para NER clásico + relaciones, probemos v2.1
model_id = "urchade/gliner_multi-v2.1"
print(f"📥 Cargando GLiNER model '{model_id}'...")

# Cargar el modelo en PyTorch
model = GLiNER.from_pretrained(model_id, load_onnx_model=False)

output_dir = "models/gliner2_monolithic"
os.makedirs(output_dir, exist_ok=True)
print(f"⚙️ Exportando modelo a ONNX en: {output_dir}...")

# Exportar el modelo completo a ONNX
# Esto usará el método interno de GLiNER para trazar todo el grafo PyTorch a un solo archivo ONNX
result = model.export_to_onnx(
    save_dir=output_dir,
    onnx_filename="model.onnx",
    quantize=False
)

print(f"✅ ¡Exportación completada!\nResultado: {result}")

# Inspeccionar el modelo resultante para verificar las entradas
import onnx
onnx_model = onnx.load(result["onnx_path"])
print("\n🔍 --- Inspección del Modelo ONNX Monolítico ---")
print("INPUTS esperados por ONNX:")
for i in onnx_model.graph.input:
    print(f"  {i.name}: {[d.dim_value if d.dim_value else d.dim_param for d in i.type.tensor_type.shape.dim]}")
print("\nOUTPUTS que nos devolverá ONNX:")
for o in onnx_model.graph.output:
    print(f"  {o.name}: {[d.dim_value if d.dim_value else d.dim_param for d in o.type.tensor_type.shape.dim]}")
