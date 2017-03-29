#!/usr/bin/env python

from __future__ import print_function

import sys
import subprocess
if sys.version_info[0] > 2:
    import http.server as httpserver
    import socketserver
else:
    import SimpleHTTPServer as httpserver
    import SocketServer as socketserver

print('Starting Google Chrome...')
subprocess.call(['google-chrome-stable', 'http://localhost:8000'])

PORT = 8000

handler = httpserver.SimpleHTTPRequestHandler

httpd = socketserver.TCPServer(("", PORT), handler)

print("Starting webserver listening on port", PORT)
httpd.serve_forever()
