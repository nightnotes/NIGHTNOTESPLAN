#!/usr/bin/env bash
set -e
echo ">>> Unpacking site.zip to dist/"
rm -rf dist
mkdir -p dist
unzip -o site.zip -d dist
echo ">>> Contents of dist/"
ls -la dist
