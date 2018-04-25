#!/bin/sh

rsync -avhr ad374@unix.sussex.ac.uk:public_html/eyetracking/data "$(dirname $0)"
find "$(dirname $0)"/data -type d -exec chmod 755 "{}" \;
