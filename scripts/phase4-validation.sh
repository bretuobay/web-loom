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

run_step "npm install" npm install
run_step "build @web-loom/template-core" npm run build --workspace=@web-loom/template-core
run_step "build @web-loom/template-core-tooling" npm run build --workspace=@web-loom/template-core-tooling
run_step "build @web-loom/template-core-lint" npm run build --workspace=@web-loom/template-core-lint
run_step "build @web-loom/template-core-vite" npm run build --workspace=@web-loom/template-core-vite

run_step "template-core lint" npm run lint --workspace=@web-loom/template-core
run_step "template-core check-types" npm run check-types --workspace=@web-loom/template-core
run_step "template-core test" npm run test --workspace=@web-loom/template-core
run_step "template-core bench" npm run bench --workspace=@web-loom/template-core
run_step "template-core size" npm run size --workspace=@web-loom/template-core

run_step "template-core-vite-ssr lint" npm run lint --workspace=@web-loom/template-core-vite-ssr
run_step "template-core-vite-ssr check-types" npm run check-types --workspace=@web-loom/template-core-vite-ssr
run_step "template-core-vite-ssr test" npm run test --workspace=@web-loom/template-core-vite-ssr
run_step "template-core-vite-ssr build" npm run build --workspace=@web-loom/template-core-vite-ssr

run_step "template-core-vite lint" npm run lint --workspace=@web-loom/template-core-vite
run_step "template-core-vite check-types" npm run check-types --workspace=@web-loom/template-core-vite
run_step "template-core-vite test" npm run test --workspace=@web-loom/template-core-vite
run_step "template-core-vite build" npm run build --workspace=@web-loom/template-core-vite

run_step "template-core-lint lint" npm run lint --workspace=@web-loom/template-core-lint
run_step "template-core-lint check-types" npm run check-types --workspace=@web-loom/template-core-lint
run_step "template-core-lint test" npm run test --workspace=@web-loom/template-core-lint

run_step "ecommerce-template-core type-check" npm run type-check --workspace=@web-loom/ecommerce-template-core
run_step "ecommerce-template-core lint" npm run lint --workspace=@web-loom/ecommerce-template-core
run_step "ecommerce-template-core test" npm run test --workspace=@web-loom/ecommerce-template-core
run_step "ecommerce-template-core build:client" npm run build:client --workspace=@web-loom/ecommerce-template-core
run_step "ecommerce-template-core build:server" npm run build:server --workspace=@web-loom/ecommerce-template-core

if [ "$OVERALL" -eq 0 ]; then
  echo "PHASE4_OVERALL: PASS" >> "$LOG"
else
  echo "PHASE4_OVERALL: FAIL" >> "$LOG"
fi

grep -E '^(=====|.*: (PASS|FAIL)|PHASE4_OVERALL)' "$LOG"
