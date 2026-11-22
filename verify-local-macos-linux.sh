#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Errore: installa Node.js 20 o superiore (npm incluso)." >&2
  exit 1
fi

printf '%s\n' 'MANGO WORLD - verifica locale (nessun deployment)'
npm install
npm run qa:static
npm run build
npm run contracts:compile
npm run contracts:test
printf '\n%s\n' 'VERIFICA COMPLETATA: build, compilazione e test sono terminati senza errori.'
printf '%s\n' 'Nessun token è stato distribuito.'
