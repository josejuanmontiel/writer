import os
import shutil
from huggingface_hub import hf_hub_download

repo_id = "lmo3/gliner2-multi-v1-onnx"
output_path = "models/gliner2"
os.makedirs(output_path, exist_ok=True)

print(f"📥 Descargando módulos de GLiNER2 desde {repo_id}...")

# Archivos específicos que necesitamos
files_to_download = [
    ("onnx/encoder.onnx", "model.onnx"),
    ("onnx/encoder.onnx.data", "model.onnx.data"),
    ("onnx/span_rep.onnx", "span_rep.onnx"),
    ("onnx/span_rep.onnx.data", "span_rep.onnx.data"),
    ("onnx/classifier.onnx", "classifier.onnx"),
    ("onnx/classifier.onnx.data", "classifier.onnx.data"),
    ("onnx/count_embed.onnx", "count_embed.onnx"),
    ("onnx/count_embed.onnx.data", "count_embed.onnx.data"),
    ("tokenizer.json", "tokenizer.json"),
    ("tokenizer_config.json", "tokenizer_config.json"),
    ("config.json", "config.json"),
    ("gliner2_config.json", "gliner2_config.json")
]

for remote_file, local_name in files_to_download:
    try:
        print(f"Descargando {remote_file}...")
        path = hf_hub_download(
            repo_id=repo_id,
            filename=remote_file,
            local_dir=output_path,
            local_dir_use_symlinks=False
        )
        
        # Mover el archivo a la raíz de models/gliner2 si bajó a una subcarpeta
        final_local_path = os.path.join(output_path, local_name)
        if os.path.exists(path) and os.path.abspath(path) != os.path.abspath(final_local_path):
            # Asegurarse de que el destino no exista o borrarlo antes de mover
            if os.path.exists(final_local_path):
                os.remove(final_local_path)
            shutil.move(path, final_local_path)
            
    except Exception as e:
        if "404 Client Error" in str(e):
             print(f"ℹ️ El archivo {remote_file} no existe en el repo (normal si no es un modelo split).")
        else:
            print(f"⚠️ Error descargando {remote_file}: {e}")

# Limpiar subcarpeta 'onnx' si quedó vacía o con restos
onnx_dir = os.path.join(output_path, "onnx")
if os.path.exists(onnx_dir):
    try:
        shutil.rmtree(onnx_dir)
    except:
        pass

print(f"\n✅ ¡ÉXITO! Modelo preparado en {output_path}")
print("Go ya puede cargar 'model.onnx' y usarlo como backbone.")
