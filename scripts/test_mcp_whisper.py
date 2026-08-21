#!/usr/bin/env python3
import sys
import os
import json
import time
import threading
import urllib.request

def main():
    audio_path = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.abspath("antigravity_dictation.wav")
    base_url = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:3000"
    
    print(f"Connecting to MCP SSE endpoint at {base_url}/mcp...")
    session_id = None
    events = []
    stream_active = True

    def listen():
        nonlocal session_id, stream_active
        req = urllib.request.Request(f"{base_url}/mcp")
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                for line in resp:
                    if not stream_active:
                        break
                    line_str = line.decode('utf-8', errors='ignore').strip()
                    if line_str.startswith("data: "):
                        raw = line_str[6:].strip()
                        if "sessionid=" in raw.lower() and not session_id:
                            session_id = raw.split("sessionid=")[-1].strip()
                            print(f"Extracted session ID: {session_id}")
                        if raw.startswith("{"):
                            try:
                                parsed = json.loads(raw)
                                events.append(parsed)
                                print(f"Received SSE event: {raw[:100]}...")
                            except Exception:
                                pass
        except Exception as e:
            if stream_active:
                print(f"SSE listener notice: {e}")

    t = threading.Thread(target=listen, daemon=True)
    t.start()

    # Wait for session_id
    for _ in range(30):
        if session_id:
            break
        time.sleep(0.2)

    if not session_id:
        print("ERROR: Failed to obtain sessionid from MCP SSE stream")
        sys.exit(1)

    url = f"{base_url}/mcp?sessionid={session_id}"

    # 1. Initialize MCP
    print("Sending MCP initialize request...")
    init_payload = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "ci-test-runner", "version": "1.0.0"}
        }
    }
    req = urllib.request.Request(url, data=json.dumps(init_payload).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        if resp.status not in (200, 202):
            print(f"ERROR: initialize returned status {resp.status}")
            sys.exit(1)

    time.sleep(1.0)

    # 2. Call transcribe_audio_file tool
    print(f"Calling transcribe_audio_file with path='{audio_path}'...")
    tool_payload = {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/call",
        "params": {
            "name": "transcribe_audio_file",
            "arguments": {"path": audio_path}
        }
    }
    req = urllib.request.Request(url, data=json.dumps(tool_payload).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as resp:
        if resp.status not in (200, 202):
            print(f"ERROR: tools/call returned status {resp.status}")
            sys.exit(1)

    # 3. Wait for response event
    print("Waiting for transcription event result...")
    transcription_received = False
    for _ in range(40): # Wait up to 20 seconds
        for ev in events:
            if ev.get("id") == 2:
                if "result" in ev:
                    print(f"SUCCESS: Received transcription result: {json.dumps(ev['result'], ensure_ascii=False)}")
                    transcription_received = True
                    break
                elif "error" in ev:
                    print(f"ERROR: Received tool error: {json.dumps(ev['error'], ensure_ascii=False)}")
                    sys.exit(1)
        if transcription_received:
            break
        time.sleep(0.5)

    stream_active = False

    if not transcription_received:
        print("ERROR: Timed out waiting for transcription result event")
        sys.exit(1)

    print("MCP Whisper Transcription Integration Test Passed!")
    sys.exit(0)

if __name__ == "__main__":
    main()
