import sys
import os
import time
import subprocess
import json
import urllib.request
from PIL import Image
from vnc_ctl import VNCClient

ARTIFACT_DIR = "/home/jose/.gemini/antigravity-ide/brain/5a8a087b-169e-4842-8713-d8ccc9f4a4b4"
CONTAINER_NAME = "test-windows11"
VNC_HOST = "172.24.0.2"
VNC_PORT = 5900
GUEST_IP = "172.30.0.2"
MCP_PORT = 3000

def take_screenshot(filename="screen.png"):
    output_path = os.path.join(ARTIFACT_DIR, filename) if os.path.exists(ARTIFACT_DIR) else filename
    script = (
        "import socket, time\n"
        "s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)\n"
        "s.connect('/dev/shm/monitor.sock')\n"
        "s.sendall(b'screendump /tmp/screen.ppm\\n')\n"
        "time.sleep(0.3)\n"
        "s.close()\n"
    )
    subprocess.run(["docker", "exec", "-i", CONTAINER_NAME, "python3", "-c", script], check=True)
    subprocess.run(["docker", "cp", f"{CONTAINER_NAME}:/tmp/screen.ppm", "/tmp/screen.ppm"], check=True)
    Image.open("/tmp/screen.ppm").save(output_path)
    print(f"📸 Screenshot saved to {output_path}")
    return output_path

def win_run(command_str, wait_sec=3.0, screenshot_name=None):
    vnc = VNCClient(host=VNC_HOST, port=VNC_PORT)
    vnc.connect()
    
    # 1. Send Win+R
    vnc.key(0xffeb, True)
    time.sleep(0.1)
    vnc.key_press(ord('r'))
    time.sleep(0.1)
    vnc.key(0xffeb, False)
    time.sleep(1.0)
    
    # 2. Type command
    vnc.type_string(command_str)
    time.sleep(0.5)
    
    # 3. Press Enter (Return)
    vnc.key_press(0xff0d)
    time.sleep(wait_sec)
    
    vnc.close()
    
    if screenshot_name:
        return take_screenshot(screenshot_name)

def run_e2e_test():
    print("🚀 [TEST-E2E] Iniciando suite de pruebas automatizadas en Windows 11 VM...")
    
    # 1. Asegurar copia de audio de prueba
    sample_src = "lib/whisper.cpp/bindings/go/samples/jfk.wav"
    sample_dst = "dist-win/antigravity_dictation.wav"
    if os.path.exists(sample_src):
        subprocess.run(["cp", sample_src, sample_dst], check=True)
        print(f"🎵 Audio de prueba copiado a {sample_dst}")
    
    # 2. Lanzar la aplicación en Windows si no está corriendo
    print("🪟 Verificando / arrancando writer.exe en Windows 11...")
    win_run("cmd /k cd /d Z:\\ && run.bat\n", wait_sec=5.0)
    
    # 3. Descubrir endpoint SSE de MCP
    print("🌐 Conectando con servidor MCP (SSE) en Windows 11...")
    cmd = """
import urllib.request, json, threading, time

session_id = None
events = []

def listen():
    global session_id
    req = urllib.request.Request('http://172.30.0.2:3000/mcp')
    with urllib.request.urlopen(req) as resp:
        for line in resp:
            line_str = line.decode().strip()
            if line_str.startswith('data: '):
                raw = line_str[6:].strip()
                if 'sessionid=' in raw.lower():
                    session_id = raw.split('sessionid=')[-1]
            if line_str.startswith('data: {'):
                events.append(json.loads(line_str[6:].strip()))

t = threading.Thread(target=listen, daemon=True)
t.start()
time.sleep(2.0)

if not session_id:
    print('ERROR: No se descubrió sessionid')
    exit(1)

url = f'http://172.30.0.2:3000/mcp?sessionid={session_id}'

# Initialize
init_payload = {
    'jsonrpc': '2.0',
    'id': 1,
    'method': 'initialize',
    'params': {
        'protocolVersion': '2024-11-05',
        'capabilities': {},
        'clientInfo': {'name': 'e2e-test', 'version': '1.0.0'}
    }
}
req = urllib.request.Request(url, data=json.dumps(init_payload).encode(), headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    assert resp.status in (200, 202), f'Init falló: {resp.status}'

time.sleep(1.0)
# Call transcribe_audio_file tool
tool_payload = {
    'jsonrpc': '2.0',
    'id': 2,
    'method': 'tools/call',
    'params': {
        'name': 'transcribe_audio_file',
        'arguments': {'path': 'antigravity_dictation.wav'}
    }
}
req = urllib.request.Request(url, data=json.dumps(tool_payload).encode(), headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as resp:
    assert resp.status in (200, 202), f'Tool call falló: {resp.status}'

# Esperar inferencia Whisper
time.sleep(10.0)

for ev in events:
    if ev.get('id') == 2 and 'result' in ev:
        print('SUCCESS_RESULT:', json.dumps(ev['result']))
        exit(0)

print('ERROR: No se recibió resultado de transcripción')
exit(1)
"""
    result = subprocess.run(["docker", "exec", CONTAINER_NAME, "python3", "-c", cmd], capture_output=True, text=True)
    print("📋 Salida del test MCP:", result.stdout)
    if result.returncode != 0:
        print("❌ Error en el test:", result.stderr)
        raise RuntimeError("Test de transcripción MCP falló.")
    
    assert "Americans" in result.stdout or "country" in result.stdout
    print("✅ Inferencia Whisper ejecutada con éxito.")
    
    # 4. Captura de pantalla de verificación
    shot = take_screenshot("e2e_dictation_verified.png")
    print(f"🎉 ¡Todas las pruebas automáticas en Windows 11 pasaron con éxito! Captura guardada en {shot}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        action = sys.argv[1]
        if action == "screenshot":
            name = sys.argv[2] if len(sys.argv) > 2 else "screen.png"
            take_screenshot(name)
        elif action == "run":
            cmd = sys.argv[2]
            name = sys.argv[3] if len(sys.argv) > 3 else "after_run.png"
            win_run(cmd, wait_sec=4.0, screenshot_name=name)
        elif action == "type":
            vnc = VNCClient(host=VNC_HOST, port=VNC_PORT)
            vnc.connect()
            vnc.type_string(sys.argv[2])
            vnc.close()
        elif action in ("test-e2e", "test"):
            run_e2e_test()
    else:
        run_e2e_test()
