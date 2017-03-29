#!/usr/bin/env python

from __future__ import print_function

LISTEN_PORT = 8000

import sys
import subprocess
if sys.version_info[0] > 2:
    import http.server as httpserver
    import socketserver
else:
    import SimpleHTTPServer as httpserver
    import SocketServer as socketserver

print('Starting Google Chrome...')
subprocess.Popen(['google-chrome-stable', 'http://localhost:%d' % LISTEN_PORT])

handler = httpserver.SimpleHTTPRequestHandler

socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(("", LISTEN_PORT), handler)

print('Starting webserver listening on port', LISTEN_PORT)
httpd.serve_forever()
