#!/bin/sh

datadir=data

if [ ! -d $datadir ]; then
	echo Creating ./$datadir
	mkdir $datadir
fi

echo Setting permissions for ./$datadir
chmod a+w $datadir
