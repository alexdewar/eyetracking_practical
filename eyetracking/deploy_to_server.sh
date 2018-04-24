#!/bin/sh

echo Creating folders and setting permissions for data directory
year=$(date +%Y)
ssh ad374@unix.sussex.ac.uk -C "mkdir -p public_html/eyetracking/{server,data/$year}; chmod a+w public_html/eyetracking/data/{,$year}"

echo Syncing
rsync -avhr --delete "$(dirname $0)"/server ad374@unix.sussex.ac.uk:public_html/eyetracking
