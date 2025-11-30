#!/usr/bin/env bash
set -e

echo "Building React..."
cd react
npm ci
npm run build
cd ..

echo "React build finished. You can now run: docker compose up -d --build"
