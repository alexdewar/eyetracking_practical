#!/usr/bin/env python

from __future__ import print_function #python 3 print function

LISTEN_PORT = 8000 # port to serve http requests on

import sys
import os
import subprocess

# these modules are named differently in python 2 and 3
if sys.version_info[0] > 2:
    import http.server as httpserver
    import socketserver
else:
    import SimpleHTTPServer as httpserver
    import SocketServer as socketserver

# start the google chrome process
print('Starting Google Chrome...')
url = 'http://localhost:%d/experiment.html' % LISTEN_PORT;
if sys.platform.startswith('linux'):
    subprocess.Popen(['google-chrome-stable', url])
elif sys.platform == 'win32':
    subprocess.Popen(['C:\Program Files (x86)\Google\Chrome\Application\chrome.exe', url])

# change current directory to the directory this script is in
os.chdir(os.path.dirname(os.path.realpath(__file__)))

# serve http requests to this folder
socketserver.TCPServer.allow_reuse_address = True # this is needed to prevent an error when program running 2nd time
handler = httpserver.SimpleHTTPRequestHandler
httpd = socketserver.TCPServer(('localhost', LISTEN_PORT), handler)
print('Starting webserver listening on port', LISTEN_PORT)
httpd.serve_forever() # start serving requests
