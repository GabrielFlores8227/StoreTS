#!/bin/bash

DIRECTORIES=$(find . -name "package.json" -exec dirname {} \;)

for DIRECTORY in $DIRECTORIES;
do
  npm install --prefix $DIRECTORY
done
