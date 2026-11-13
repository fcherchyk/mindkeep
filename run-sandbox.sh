#!/usr/bin/env bash
# A sandbox has no screen to look at, so this builds the app, serves it, plays a whole session in
# a headless browser and saves a picture of every screen, at desktop and phone size, to
# .sandbox/screens/, or to the folder given as the first argument. Each run starts with a fresh
# profile. It uses the installed Chrome if there is one, and otherwise Playwright's own Chromium
# (downloading it once if needed); PW_CHROMIUM=1 forces Chromium. Dependencies: see
# sandbox-deps.sh.
set -euo pipefail
cd "$(dirname "$0")"
source ./sandbox-deps.sh

out="${1:-.sandbox/screens}"
install_dependencies

# Can Playwright start this browser? (channel "chrome" is the installed Chrome.)
can_launch() {
  node -e 'require("@playwright/test").chromium.launch(process.argv[1] ? { channel: process.argv[1] } : {})
    .then((b) => b.close(), () => process.exit(1))' "$1" >/dev/null 2>&1
}

if [ -z "${PW_CHROMIUM:-}" ] && ! can_launch chrome; then
  echo "Chrome is not installed: using Playwright's Chromium." >&2
  export PW_CHROMIUM=1
fi
if [ -n "${PW_CHROMIUM:-}" ] && ! can_launch ""; then
  if [ "$SANDBOX_OFFLINE" = "1" ]; then
    echo "Playwright's Chromium is not installed and SANDBOX_OFFLINE=1 forbids downloading it." >&2
    exit 1
  fi
  echo "Downloading Playwright's Chromium..." >&2
  mk_pnpm exec playwright install chromium
fi

rm -rf "$out"
SCREENS="$out" mk_pnpm exec playwright test
echo "Screens saved in $out"
