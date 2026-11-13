#!/usr/bin/env bash
# Run the checks with no screen and (once the dependencies are in the pnpm store) no network:
# Biome, svelte-check, then Vitest with coverage of at least 80%. Arguments go to Vitest, for
# example `./test-sandbox.sh tests/odd.test.ts`. Dependencies: see sandbox-deps.sh.
set -euo pipefail
cd "$(dirname "$0")"
source ./sandbox-deps.sh

install_dependencies
mk_pnpm lint
mk_pnpm typecheck
mk_pnpm vitest run --coverage "$@"
