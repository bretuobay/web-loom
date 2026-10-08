#!/usr/bin/env bash
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
LOG="$ROOT/phase4-validation-output.log"
: > "$LOG"

OVERALL=0

run_step() {
  local name="$1"
  shift
  echo "===== $name =====" | tee -a "$LOG"
  if "$@" >> "$LOG" 2>&1; then
    echo "$name: PASS (exit 0)" | tee -a "$LOG"
    return 0
  else
    local ec=$?
    echo "$name: FAIL (exit $ec)" | tee -a "$LOG"
    OVERALL=1
    return 0
  fi
}

run_step "pnpm install" pnpm install
run_step "build @web-loom/template-core" pnpm --filter @web-loom/template-core run build
run_step "build @web-loom/template-core-tooling" pnpm --filter @web-loom/template-core-tooling run build
run_step "build @web-loom/template-core-lint" pnpm --filter @web-loom/template-core-lint run build
run_step "build @web-loom/template-core-vite" pnpm --filter @web-loom/template-core-vite run build

run_step "template-core lint" pnpm --filter @web-loom/template-core run lint
run_step "template-core check-types" pnpm --filter @web-loom/template-core run check-types
run_step "template-core test" pnpm --filter @web-loom/template-core run test
run_step "template-core bench" pnpm --filter @web-loom/template-core run bench
run_step "template-core size" pnpm --filter @web-loom/template-core run size

run_step "template-core-vite-ssr lint" pnpm --filter @web-loom/template-core-vite-ssr run lint
run_step "template-core-vite-ssr check-types" pnpm --filter @web-loom/template-core-vite-ssr run check-types
run_step "template-core-vite-ssr test" pnpm --filter @web-loom/template-core-vite-ssr run test
run_step "template-core-vite-ssr build" pnpm --filter @web-loom/template-core-vite-ssr run build

run_step "template-core-vite lint" pnpm --filter @web-loom/template-core-vite run lint
run_step "template-core-vite check-types" pnpm --filter @web-loom/template-core-vite run check-types
run_step "template-core-vite test" pnpm --filter @web-loom/template-core-vite run test
run_step "template-core-vite build" pnpm --filter @web-loom/template-core-vite run build

run_step "template-core-lint lint" pnpm --filter @web-loom/template-core-lint run lint
run_step "template-core-lint check-types" pnpm --filter @web-loom/template-core-lint run check-types
run_step "template-core-lint test" pnpm --filter @web-loom/template-core-lint run test

run_step "ecommerce-template-core type-check" pnpm --filter @web-loom/ecommerce-template-core run type-check
run_step "ecommerce-template-core lint" pnpm --filter @web-loom/ecommerce-template-core run lint
run_step "ecommerce-template-core test" pnpm --filter @web-loom/ecommerce-template-core run test
run_step "ecommerce-template-core build:client" pnpm --filter @web-loom/ecommerce-template-core run build:client
run_step "ecommerce-template-core build:server" pnpm --filter @web-loom/ecommerce-template-core run build:server

if [ "$OVERALL" -eq 0 ]; then
  echo "PHASE4_OVERALL: PASS" >> "$LOG"
else
  echo "PHASE4_OVERALL: FAIL" >> "$LOG"
fi

grep -E '^(=====|.*: (PASS|FAIL)|PHASE4_OVERALL)' "$LOG"
