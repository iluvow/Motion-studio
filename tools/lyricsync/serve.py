"""에디터 서버: 정적 파일 + 곡 목록/저장 API.  python3 -m tools.lyricsync.serve"""
import json, mimetypes, sys
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, unquote
from .common import ROOT, SONGS

EDITOR = ROOT / "editor"


class H(BaseHTTPRequestHandler):
    def _send(self, code, body, ctype="application/json"):
        self.send_response(code); self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body))); self.send_header("Accept-Ranges", "bytes")
        self.end_headers(); self.wfile.write(body)

    def do_GET(self):
        p = unquote(urlparse(self.path).path)
        if p == "/api/songs":
            names = sorted(d.name for d in SONGS.iterdir() if (d / "song.json").exists())
            return self._send(200, json.dumps(names).encode())
        f = EDITOR / "index.html" if p == "/" else None
        if p.startswith("/songs/"):
            f = (SONGS / p[7:]).resolve()
            if SONGS.resolve() not in f.parents: return self._send(403, b"")
        elif p.startswith("/editor/"):
            f = (EDITOR / p[8:]).resolve()
        if f is None or not f.is_file(): return self._send(404, b"not found", "text/plain")
        data = f.read_bytes(); ct = mimetypes.guess_type(f.name)[0] or "application/octet-stream"
        rng = self.headers.get("Range")
        if rng and rng.startswith("bytes="):  # 오디오 탐색(seek)용
            a, _, b = rng[6:].partition("-")
            a = int(a or 0); b = int(b) if b else len(data) - 1
            part = data[a:b + 1]
            self.send_response(206); self.send_header("Content-Type", ct)
            self.send_header("Content-Range", f"bytes {a}-{a + len(part) - 1}/{len(data)}")
            self.send_header("Content-Length", str(len(part))); self.send_header("Accept-Ranges", "bytes")
            self.end_headers(); return self.wfile.write(part)
        self._send(200, data, ct)

    def do_POST(self):  # /api/save/<song>
        p = unquote(urlparse(self.path).path)
        if not p.startswith("/api/save/"): return self._send(404, b"")
        d = (SONGS / p[10:]).resolve()
        if SONGS.resolve() not in d.parents or not d.is_dir(): return self._send(400, b"bad song")
        body = self.rfile.read(int(self.headers["Content-Length"]))
        data = json.loads(body)
        (d / "words.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
        self._send(200, b'{"ok":true}')

    def log_message(self, *a): pass


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    print(f"에디터: http://localhost:{port}")
    ThreadingHTTPServer(("0.0.0.0", port), H).serve_forever()
