#!/bin/sh

echo Creating folders and setting permissions for data directory
ssh ad374@unix.sussex.ac.uk -C "mkdir -p public_html/eyetracking/{server,data}; chmod a+w public_html/eyetracking/data"

echo Syncing
rsync -avhr --delete $(dirname $0)/server ad374@unix.sussex.ac.uk:public_html/eyetracking

