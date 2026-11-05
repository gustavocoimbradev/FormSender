#!/usr/bin/env bash
# Prints a QR code for the given URL in the terminal. Silent when it cannot.
# Uses `qrencode` when installed, otherwise `qrcode-terminal` (installed once into .logs/qr).
url="${1:-}"
[ -z "$url" ] && exit 0

if command -v qrencode >/dev/null 2>&1; then
    qrencode -t ANSIUTF8 -m 1 "$url"
    exit 0
fi

cd "$(dirname "$0")/.." || exit 0
cache=".logs/qr"

if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    if [ ! -d "$cache/node_modules/qrcode-terminal" ]; then
        mkdir -p "$cache"
        npm install --prefix "$cache" --silent --no-audit --no-fund qrcode-terminal@0.12.0 >/dev/null 2>&1
    fi

    if [ -d "$cache/node_modules/qrcode-terminal" ]; then
        NODE_PATH="$cache/node_modules" node -e '
const qr = require("qrcode-terminal");
qr.generate(process.argv[1], { small: true }, (code) => console.log(code.replace(/^/gm, "  ")));
' "$url" 2>/dev/null
        exit 0
    fi
fi

# Plan B: pure Python (segno), installed once into the same cache.
if command -v python3 >/dev/null 2>&1; then
    if [ ! -d "$cache/py/segno" ]; then
        mkdir -p "$cache/py"
        python3 -m pip install --quiet --disable-pip-version-check --target "$cache/py" segno >/dev/null 2>&1
    fi

    PYTHONPATH="$cache/py" python3 -c '
import sys
try:
    import segno
except ImportError:
    sys.exit(0)
segno.make(sys.argv[1], error="m").terminal(compact=True, border=1)
' "$url" 2>/dev/null | sed 's/^/  /'
fi
