"""Agente ligero de IMPULSA.

Muestra únicamente el código de emparejamiento. La URL del backend es interna
y no se muestra en la interfaz.
"""

import json
import os
import platform
import re
import socket
import sys
import threading
import tkinter as tk
import urllib.error
import urllib.request
import uuid
from tkinter import ttk

# Uso interno: nunca se muestra en pantalla.
API = "https://impulsa-api-v1l0.onrender.com"
SCAN_FOLDER_DEFAULT = r"C:\Escanner"


def _config_paths():
    exe_dir = os.path.dirname(getattr(sys, "executable", "")) or os.getcwd()
    return [
        os.path.join(exe_dir, "config.json"),
        os.path.join(os.getcwd(), "config.json"),
        os.path.join(
            os.environ.get("APPDATA", ""),
            "Microsoft", "Windows", "Start Menu", "Programs", "Startup",
            "IMPULSA-Agent", "config.json",
        ),
    ]


def _load_config():
    for path in _config_paths():
        try:
            with open(path, encoding="utf-8") as fh:
                return json.load(fh)
        except Exception:
            continue
    return {}


CFG = _load_config()
SCAN_FOLDER = CFG.get("carpeta") or SCAN_FOLDER_DEFAULT
PERSONA = CFG.get("persona") or "Digitador"
BASE_DIR = os.path.dirname(getattr(sys, "executable", "")) or os.getcwd()
SENT_PATH = os.path.join(BASE_DIR, "sent.json")


def _pc_name():
    return socket.gethostname()


def _ip():
    try:
        return socket.gethostbyname(_pc_name())
    except OSError:
        return ""


def _mac():
    return ":".join(re.findall("..", "%012x" % uuid.getnode())).upper()


def _post(path, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        API + path,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def upload_scan(file_path):
    name = os.path.basename(file_path)
    with open(file_path, "rb") as fh:
        data = fh.read()
    if not data:
        return False

    boundary = "----ImpulsaUploadBoundary"
    body = b"".join(
        [
            f'--{boundary}\r\nContent-Disposition: form-data; name="persona"\r\n\r\n{PERSONA}\r\n'.encode(),
            f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{name}"\r\n'
            f"Content-Type: application/octet-stream\r\n\r\n".encode(),
            data,
            f"\r\n--{boundary}--\r\n".encode(),
        ]
    )
    req = urllib.request.Request(
        API + "/api/scans/upload",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8")).get("ok", False)


def load_sent():
    try:
        with open(SENT_PATH, encoding="utf-8") as fh:
            return set(json.load(fh))
    except Exception:
        return set()


def save_sent(names):
    try:
        with open(SENT_PATH, "w", encoding="utf-8") as fh:
            json.dump(sorted(names), fh)
    except Exception:
        pass


class AgentApp:
    def __init__(self, root):
        self.root = root
        self.root.title("IMPULSA · Agente de PC")
        self.root.geometry("420x280")
        self.root.resizable(False, False)
        self.root.configure(bg="#0B1120")

        style = ttk.Style()
        style.theme_use("clam")
        style.configure("TLabel", background="#0B1120", foreground="#94A3B8", font=("Segoe UI", 10))
        style.configure("Title.TLabel", foreground="#F8FAFC", font=("Segoe UI", 16, "bold"))
        style.configure("Status.TLabel", foreground="#60A5FA", font=("Segoe UI", 10))
        style.configure("TButton", font=("Segoe UI", 10, "bold"), padding=8)

        frame = ttk.Frame(root, padding=28)
        frame.pack(fill="both", expand=True)

        ttk.Label(frame, text="IMPULSA", style="Title.TLabel").pack(anchor="w")
        ttk.Label(frame, text="Ingresa tu código de emparejamiento").pack(anchor="w", pady=(6, 18))

        self.code_var = tk.StringVar()
        self.code_var.trace_add("write", self._format_code)
        entry = ttk.Entry(
            frame,
            textvariable=self.code_var,
            font=("Consolas", 22, "bold"),
            justify="center",
        )
        entry.pack(fill="x", pady=(0, 16))
        entry.focus()

        self.status = ttk.Label(frame, text="", style="Status.TLabel", wraplength=340)
        self.status.pack(fill="x", pady=(0, 12))

        self.button = ttk.Button(frame, text="Emparejar", command=self.pair)
        self.button.pack(fill="x")

        self.heartbeat_stop = threading.Event()
        self.scan_stop = threading.Event()
        threading.Thread(target=self._watch_scans, daemon=True).start()

    def _format_code(self, *_):
        raw = re.sub(r"[^A-Za-z0-9]", "", self.code_var.get()).upper()[:8]
        formatted = raw[:4] + ("-" + raw[4:] if len(raw) > 4 else "")
        if formatted != self.code_var.get():
            self.code_var.set(formatted)

    def _set_status(self, text, color="#60A5FA"):
        self.status.configure(text=text, foreground=color)

    def pair(self):
        code = re.sub(r"[^A-Z0-9]", "", self.code_var.get().upper())
        if len(code) < 6:
            self._set_status("Ingresa un código válido.", "#FBBF24")
            return

        self.button.configure(state="disabled")
        self._set_status("Validando código...")

        def worker():
            try:
                result = _post(
                    "/api/pc/report-system",
                    {
                        "code": code,
                        "pc_name": _pc_name(),
                        "ip": _ip(),
                        "mac": _mac(),
                        "sistema": platform.platform(),
                    },
                )
                if not result.get("ok"):
                    raise RuntimeError(result.get("error", "Código no válido."))
                name = (result.get("user") or {}).get("name") or _pc_name()
                self.root.after(0, self._paired, name)
                threading.Thread(target=self._heartbeat, args=(code,), daemon=True).start()
            except Exception as exc:  # noqa: BLE001 - mensaje al usuario
                self.root.after(0, self._failed, str(exc))

        threading.Thread(target=worker, daemon=True).start()

    def _paired(self, name):
        self._set_status(f"PC emparejada correctamente · {name}", "#34D399")
        self.button.configure(state="normal")

    def _failed(self, message):
        self._set_status(f"No se pudo emparejar: {message}", "#F87171")
        self.button.configure(state="normal")

    def _watch_scans(self):
        sent = load_sent()
        sizes = {}
        while not self.scan_stop.wait(3):
            if not os.path.isdir(SCAN_FOLDER):
                continue
            try:
                names = os.listdir(SCAN_FOLDER)
            except OSError:
                continue
            for name in names:
                if name.startswith(".") or name.endswith(".sent.json") or name in sent:
                    continue
                path = os.path.join(SCAN_FOLDER, name)
                if not os.path.isfile(path):
                    continue
                try:
                    size = os.path.getsize(path)
                except OSError:
                    continue
                if size == 0:
                    continue
                # Espera a que el escáner termine de escribir el archivo.
                if sizes.get(name) != size:
                    sizes[name] = size
                    continue
                try:
                    if upload_scan(path):
                        sent.add(name)
                        save_sent(sent)
                except Exception:
                    pass

    def _heartbeat(self, code):
        while not self.heartbeat_stop.wait(30):
            try:
                _post(
                    "/api/pc/heartbeat",
                    {
                        "pc": _pc_name(),
                        "ip": _ip(),
                        "mac": _mac(),
                        "sistema": platform.platform(),
                        "codigo": code,
                    },
                )
            except Exception:
                pass


if __name__ == "__main__":
    root = tk.Tk()
    AgentApp(root)
    root.mainloop()
