import socket
import struct
import time
import sys

SHIFTED = {
    ':': ord(';'),
    '_': ord('-'),
    '+': ord('='),
    '"': ord("'"),
    '<': ord(','),
    '>': ord('.'),
    '?': ord('/'),
    '~': ord('`'),
    '!': ord('1'),
    '@': ord('2'),
    '#': ord('3'),
    '$': ord('4'),
    '%': ord('5'),
    '^': ord('6'),
    '&': ord('7'),
    '*': ord('8'),
    '(': ord('9'),
    ')': ord('0'),
    '{': ord('['),
    '}': ord(']'),
    '|': ord('\\'),
}

class VNCClient:
    def __init__(self, host="127.0.0.1", port=5900):
        self.host = host
        self.port = port
        self.s = None
        self.width = 0
        self.height = 0

    def connect(self):
        self.s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.s.connect((self.host, self.port))
        
        # 1. Handshake
        banner = self.s.recv(12)
        self.s.sendall(b"RFB 003.008\n")
        
        # 2. Security types
        num_types = self.s.recv(1)[0]
        types = self.s.recv(num_types)
        
        # Select None (1)
        self.s.sendall(b"\x01")
        
        # Security result
        res = self.s.recv(4)
        
        # 3. ClientInit
        self.s.sendall(b"\x01") # shared
        
        # 4. ServerInit
        init_data = self.s.recv(24)
        self.width, self.height = struct.unpack(">HH", init_data[:4])
        name_len = struct.unpack(">I", init_data[20:24])[0]
        self.name = self.s.recv(name_len).decode('latin1')
        print(f"VNC Connected: {self.width}x{self.height} '{self.name}'")
        
        # Request full framebuffer update
        self.s.sendall(struct.pack(">BBHHHH", 3, 0, 0, 0, self.width, self.height))
        time.sleep(0.1)

    def mouse_move(self, x, y, buttons=0):
        msg = struct.pack(">BBHH", 5, buttons, int(x), int(y))
        self.s.sendall(msg)

    def click(self, x, y, button=1):
        self.mouse_move(x, y, 0)
        time.sleep(0.1)
        self.mouse_move(x, y, button)
        time.sleep(0.15)
        self.mouse_move(x, y, 0)
        time.sleep(0.1)

    def double_click(self, x, y, button=1):
        self.click(x, y, button)
        time.sleep(0.15)
        self.click(x, y, button)

    def key(self, keysym, down=True):
        msg = struct.pack(">BB2xI", 4, 1 if down else 0, keysym)
        self.s.sendall(msg)

    def key_press(self, keysym):
        self.key(keysym, True)
        time.sleep(0.04)
        self.key(keysym, False)
        time.sleep(0.04)

    def type_char(self, ch):
        shift_key = 0xffe1 # Shift_L
        if ch.isupper():
            self.key(shift_key, True)
            time.sleep(0.03)
            self.key_press(ord(ch.lower()))
            time.sleep(0.03)
            self.key(shift_key, False)
        elif ch in SHIFTED:
            self.key(shift_key, True)
            time.sleep(0.03)
            self.key_press(SHIFTED[ch])
            time.sleep(0.03)
            self.key(shift_key, False)
        elif ch == '\n':
            self.key_press(0xff0d) # Return
        elif ch == '\t':
            self.key_press(0xff09) # Tab
        elif ch == '\b':
            self.key_press(0xff08) # BackSpace
        elif ch == ' ':
            self.key_press(0x0020)
        else:
            self.key_press(ord(ch))
        time.sleep(0.03)

    def type_string(self, text):
        for ch in text:
            self.type_char(ch)

    def close(self):
        if self.s:
            try:
                self.s.close()
            except:
                pass

if __name__ == "__main__":
    vnc = VNCClient()
    vnc.connect()
    vnc.close()
