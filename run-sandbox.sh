#!/usr/bin/env bash
# A sandbox has no screen to look at, so this builds the app, serves it, plays a whole session in
# a headless browser and saves a picture of every screen, at desktop and phone size, to
# .sandbox/screens/, or to the folder given as the first argument. Each run starts with a fresh
# profile. It uses the installed Chrome; set PW_CHROMIUM=1 to use Playwright's own Chromium.
set -euo pipefail
cd "$(dirname "$0")"

out="${1:-.sandbox/screens}"
pnpm install --frozen-lockfile --prefer-offline --silent
rm -rf "$out"
SCREENS="$out" pnpm exec playwright test
echo "Screens saved in $out"
