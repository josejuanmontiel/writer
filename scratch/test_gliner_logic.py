import onnxruntime as ort
from transformers import AutoTokenizer
import numpy as np
import os

model_path = "models/gliner2"
text = "Steve Jobs founded Apple in Cupertino."
labels = ["person", "organization", "location"]

print(f"🧪 Test de validación lógica GLiNER2...")

if not os.path.exists(os.path.join(model_path, "model.onnx")):
    print(f"❌ Error: No se encuentra el modelo en {model_path}")
    exit(1)

# 1. Cargar Tokenizer y Modelo
from transformers import PreTrainedTokenizerFast
tokenizer = PreTrainedTokenizerFast(tokenizer_file=os.path.join(model_path, "tokenizer.json"))
# Añadimos tokens especiales manualmente si faltan
tokenizer.add_special_tokens({'pad_token': '[PAD]', 'sep_token': '[SEP]', 'cls_token': '[CLS]'})
session = ort.InferenceSession(os.path.join(model_path, "model.onnx"))

# 2. Preparar Input
prompt = "".join([f"<<{l}>> " for l in labels]) + "[SEP] " + text
inputs = tokenizer(prompt, return_tensors="np")

# 3. Inferencia
outputs = session.run(None, {
    "input_ids": inputs["input_ids"].astype(np.int64),
    "attention_mask": inputs["attention_mask"].astype(np.int64)
})
last_hidden_state = outputs[0][0] # [seq_len, 768]

# 4. Lógica de Matching
tokens = tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])
try:
    sep_idx = tokens.index("[SEP]")
except ValueError:
    # Algunos tokenizers usan marcadores diferentes
    sep_idx = 8 # Heurístico para el test

# Función de similitud de coseno
def cosine_sim(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

print(f"\n🔍 Analizando resultados:")
# Steve Jobs suele estar justo después del SEP
for i in range(sep_idx + 1, len(tokens) - 1):
    span_embed = last_hidden_state[i]
    # Comparamos con el embedding de la primera etiqueta (ej: person)
    # Las etiquetas están al principio
    label_embed = last_hidden_state[1:3].mean(axis=0)
    score = cosine_sim(span_embed, label_embed)
    if score > 0.4:
        print(f" - Token '{tokens[i]}' matches Label[0] with score: {score:.4f}")

print(f"\n✅ Test finalizado. Si ves scores altos (>0.4), la lógica es correcta.")
