import torch
import openvino as ov
from transformers import DebertaV2Model, DebertaV2Config, AutoTokenizer
from safetensors.torch import load_file
import os
import glob
import time

model_id = "fastino/gliner2-base-v1"
output_path = "models/gliner2"
os.makedirs(output_path, exist_ok=True)

print(f"🚀 Iniciando exportación optimizada para Intel (OpenVINO) de {model_id}...")

# 1. Cargar arquitectura
config = DebertaV2Config.from_pretrained("microsoft/deberta-v3-base")
model = DebertaV2Model(config)

# 2. Cargar pesos
print("📦 Cargando pesos en memoria...")
cache_path = os.path.expanduser("~/.cache/huggingface/hub/models--fastino--gliner2-base-v1/snapshots/*/model.safetensors")
files = glob.glob(cache_path)
if not files:
    raise FileNotFoundError("No se encontró el archivo model.safetensors")
state_dict = load_file(files[0])
new_state_dict = {k.replace("encoder.", ""): v for k, v in state_dict.items() if k.startswith("encoder.")}
model.resize_token_embeddings(128011)
model.load_state_dict(new_state_dict, strict=False)
model.eval()

print("⚡ Convirtiendo grafo con OpenVINO (Intel Optimizer)...")
example_input = {
    "input_ids": torch.randint(0, 100, (1, 16)),
    "attention_mask": torch.ones((1, 16))
}

# Convertimos el modelo de PyTorch a OpenVINO Intermediate Representation (IR)
# Este paso es órdenes de magnitud más rápido que torch.onnx.export
ov_model = ov.convert_model(model, example_input=example_input)

# Configurar dimensiones dinámicas
ov_model.inputs[0].get_node().set_partial_shape(ov.PartialShape([-1, -1]))
ov_model.inputs[1].get_node().set_partial_shape(ov.PartialShape([-1, -1]))
ov_model.validate_nodes_and_infer_types()

print("💾 Guardando modelo...")
# Guardamos en formato IR (XML/BIN) que es nativo de Intel
ov.save_model(ov_model, os.path.join(output_path, "model.xml"))

# Intentamos exportar a ONNX (Hugot en Go prefiere ONNX)
# Usamos un exportador de PyTorch pero ya con el modelo "trazado" debería ser rápido
print("📦 Generando archivo .onnx para compatibilidad con Go...")
try:
    # Intentamos el export nativo de PyTorch pero con opciones mínimas
    torch.onnx.export(
        model, 
        (example_input["input_ids"], example_input["attention_mask"]), 
        os.path.join(output_path, "model.onnx"),
        input_names=["input_ids", "attention_mask"],
        output_names=["last_hidden_state"],
        dynamic_axes={
            "input_ids": {0: "batch_size", 1: "sequence_length"},
            "attention_mask": {0: "batch_size", 1: "sequence_length"},
            "last_hidden_state": {0: "batch_size", 1: "sequence_length"},
        },
        opset_version=14,
        do_constant_folding=False # Rápido
    )
except Exception as e:
    print(f"Aviso: Falló la exportación ONNX directa ({e}), pero tienes el XML de OpenVINO listo.")

# Guardar tokenizer
tokenizer = AutoTokenizer.from_pretrained(model_id)
tokenizer.save_pretrained(output_path)

print(f"🏁 ¡HECHO! Todo listo en {output_path}")
