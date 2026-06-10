#!/usr/bin/env python3
"""Local static server that disables caching so edits to JS/data always load."""
import http.server, socketserver, os

PORT = 8765

# Always serve this script's directory, regardless of the launcher's cwd.
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("127.0.0.1", PORT), NoCacheHandler) as httpd:
    print(f"Serving (no-cache) on http://127.0.0.1:{PORT}")
    httpd.serve_forever()
