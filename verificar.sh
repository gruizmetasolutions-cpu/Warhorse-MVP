#!/usr/bin/env bash
# Compuerta de sprint de Warhorse (doc 06 §5): TODO debe pasar para avanzar.
set -uo pipefail

RAIZ="$(cd "$(dirname "$0")" && pwd)"
WEB="$RAIZ/apps/web"
API="$RAIZ/apps/api"
FALLAS=0

paso() {
  local nombre="$1"; shift
  echo ""
  echo "══════════════════════════════════════════════════"
  echo "▶ $nombre"
  echo "══════════════════════════════════════════════════"
  if "$@"; then
    echo "✔ $nombre"
  else
    echo "✘ $nombre FALLÓ"
    FALLAS=$((FALLAS + 1))
  fi
}

# ---- Frontend (apps/web) ----
paso "tsc --noEmit"        bash -c "cd '$WEB' && npm run typecheck"
paso "ESLint"              bash -c "cd '$WEB' && npm run lint"
paso "Vitest"              bash -c "cd '$WEB' && npm run test"
if grep -q '"test:e2e"' "$WEB/package.json"; then
  paso "Playwright E2E"    bash -c "cd '$WEB' && npm run test:e2e"
fi

# ---- Backend (apps/api) ----
paso "PHPStan nivel 8"     bash -c "cd '$API' && php -d memory_limit=1G vendor/bin/phpstan analyse --no-progress --memory-limit=1G"
paso "PHPUnit"             bash -c "cd '$API' && vendor/bin/phpunit --no-coverage"

# ---- Auditorías de dependencias ----
paso "npm audit (high+)"   bash -c "cd '$WEB' && npm audit --audit-level=high"
paso "composer audit"      bash -c "cd '$API' && composer audit --no-interaction"

echo ""
echo "══════════════════════════════════════════════════"
if [ "$FALLAS" -eq 0 ]; then
  echo "✔ COMPUERTA EN VERDE — todos los pasos pasaron"
  exit 0
fi
echo "✘ COMPUERTA ROJA — $FALLAS paso(s) fallaron"
exit 1
