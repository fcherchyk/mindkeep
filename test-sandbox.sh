#!/usr/bin/env bash
# Run the checks with no screen and (once the dependencies are in the pnpm store) no network:
# Biome, svelte-check, then Vitest with coverage of at least 80%. Arguments go to Vitest, for
# example `./test-sandbox.sh tests/odd.test.ts`.
set -euo pipefail
cd "$(dirname "$0")"

pnpm install --frozen-lockfile --prefer-offline --silent
pnpm lint
pnpm typecheck
pnpm vitest run --coverage "$@"
