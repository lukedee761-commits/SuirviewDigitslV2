#!/usr/bin/env python3
"""
Static preview server for the SuirViewDigital showcase previews.

`python -m http.server` stalls on this folder once several images are
requested at once: the files live under OneDrive, and concurrent reads
through its filter driver leave connections hanging until they time out.
Reading each file fully into memory before writing the response keeps a
slow disk read from occupying the socket, and ThreadingHTTPServer keeps
one slow request from blocking the rest.
"""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
import mimetypes
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def do_GET(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            path = os.path.join(path, "index.html")
        if not os.path.isfile(path):
            self.send_error(404, "Not found")
            return

        try:
            with open(path, "rb") as fh:
                body = fh.read()
        except OSError as exc:
            self.send_error(500, "Read failed: %s" % exc)
            return

        ctype = mimetypes.guess_type(path)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.address_string(), fmt % args))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8152
    srv = ThreadingHTTPServer(("127.0.0.1", port), partial(Handler, directory=ROOT))
    srv.daemon_threads = True
    print("SuirViewDigital preview on http://localhost:%d" % port, flush=True)
    srv.serve_forever()


if __name__ == "__main__":
    main()
