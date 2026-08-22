import subprocess
import time
import os
import sys
from PIL import Image

def send_qemu_cmd(cmd):
    py_code = f"""
import socket, time
for attempt in range(5):
    try:
        s = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        s.settimeout(0.5)
        s.connect('/dev/shm/monitor.sock')
        s.sendall(b"{cmd}\\n")
        time.sleep(0.2)
        try:
            s.recv(1024)
        except Exception:
            pass
        s.close()
        break
    except Exception as e:
        time.sleep(0.5)
"""
    subprocess.run(["docker", "exec", "-i", "test-windows11", "python3", "-c", py_code], check=True)

def take_screenshot(output_png="/home/jose/.gemini/antigravity/brain/8dbb8207-1499-4055-98a3-6aac0248ae66/screen.png"):
    send_qemu_cmd("screendump /tmp/screen.ppm")
    subprocess.run(["docker", "cp", "test-windows11:/tmp/screen.ppm", "/tmp/screen.ppm"], check=True)
    Image.open("/tmp/screen.ppm").save(output_png)
    print(f"Screenshot saved to {output_png}")

def send_key(key):
    send_qemu_cmd(f"sendkey {key}")
    time.sleep(0.15)

def type_text(text):
    key_map = {
        ':': 'shift-semicolon',
        '\\': 'backslash',
        '/': 'slash',
        '.': 'dot',
        '-': 'minus',
        '_': 'shift-minus',
        ' ': 'spc',
        '\n': 'ret',
        '=': 'equal',
        '"': 'shift-apostrophe',
        '$': 'shift-4',
        '&': 'shift-7',
        '*': 'shift-8',
        '(': 'shift-9',
        ')': 'shift-0',
        '+': 'shift-equal',
    }
    for char in text:
        if char.isupper():
            send_key(f"shift-{char.lower()}")
        elif char in key_map:
            send_key(key_map[char])
        else:
            send_key(char)
        time.sleep(0.05)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        action = sys.argv[1]
        if action == "screenshot":
            take_screenshot()
        elif action == "key":
            send_key(sys.argv[2])
        elif action == "type":
            type_text(sys.argv[2])
        elif action == "run":
            # open run dialog with win-r
            send_key("meta_l-r")
            time.sleep(1)
            type_text(sys.argv[2])
            time.sleep(0.5)
            send_key("ret")
            time.sleep(2)
            take_screenshot()
