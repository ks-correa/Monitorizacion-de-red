#!/usr/bin/env bash
set -euo pipefail

echo "Frontend:"
curl -i http://localhost:8080 | sed -n '1,12p'

echo
echo "Backend health por proxy:"
curl -sS http://localhost:8080/api/health
echo

echo "DB health por proxy:"
curl -sS http://localhost:8080/api/db-health
echo

echo "Backend health directo:"
curl -sS http://localhost:8000/health
echo

echo "DB health directo:"
curl -sS http://localhost:8000/db-health
echo
