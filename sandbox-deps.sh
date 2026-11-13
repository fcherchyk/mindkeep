#!/usr/bin/env bash
# Dependency setup shared by test-sandbox.sh and run-sandbox.sh. Source it; do not run it.
#
# `install_dependencies` checks Node and pnpm, then installs node_modules, trying in order:
#   1. the versions in pnpm-lock.yaml, offline (from the pnpm store);
#   2. the versions in pnpm-lock.yaml, with network;
#   3. when the registry refuses versions the lockfile pins (a mirror that lags behind, or a
#      "minimum release age" policy): a new resolution within the ranges of package.json that
#      skips releases newer than N days, for each N in SANDBOX_DEPS_MIN_AGE_DAYS, offline first
#      and then with network.
# Step 3 never changes pnpm-lock.yaml: it installs without reading or writing a lockfile and
# prints a warning, since the versions differ from the lockfile. It remembers in .sandbox/deps/
# which N worked: while package.json and the lockfile are unchanged, later runs go straight to
# that N (delete .sandbox/deps/ to try the lockfile again). A failed attempt deletes
# node_modules/, so a half install never survives into the next one.
#
# Settings (environment variables):
#   SANDBOX_DEPS=locked                  use only the lockfile (steps 1 and 2), never step 3
#   SANDBOX_OFFLINE=1                    never use the network
#   SANDBOX_DEPS_MIN_AGE_DAYS="14 30"    the N values step 3 tries (default "14 30 60 90")
#
# Afterwards, run commands with `mk_pnpm <arguments>`: the same pnpm the install used.

SANDBOX_DEPS="${SANDBOX_DEPS:-auto}"
SANDBOX_OFFLINE="${SANDBOX_OFFLINE:-0}"
SANDBOX_DEPS_MIN_AGE_DAYS="${SANDBOX_DEPS_MIN_AGE_DAYS:-14 30 60 90}"
_deps_state_dir=".sandbox/deps"
_deps_log="$(mktemp "${TMPDIR:-/tmp}/mindkeep-deps-XXXXXX")"
_deps_pnpm=()

# pnpm would otherwise download the exact version of "packageManager", which needs network.
export npm_config_manage_package_manager_versions=false

mk_pnpm() {
  "${_deps_pnpm[@]}" "$@"
}

_deps_note() {
  echo "sandbox-deps: $*" >&2
}

# Run a quiet attempt; keep its output in the log for the final error message. A failed attempt
# leaves no node_modules/ behind.
_deps_try() {
  echo "\$ $*" >>"$_deps_log"
  if "$@" >>"$_deps_log" 2>&1; then return 0; fi
  rm -rf node_modules
  return 1
}

# The Node versions the dependencies accept: ^22.22.2 or >=24.15.0 (as "engines" in package.json).
_deps_check_node() {
  local version major minor patch
  if ! version="$(node --version 2>/dev/null)"; then
    _deps_note "Node.js is not installed; MindKeep needs Node 22.22.2+ or 24.15.0+."
    return 1
  fi
  IFS=. read -r major minor patch <<<"${version#v}"
  if [ "$major" -ge 25 ] || { [ "$major" -eq 24 ] && [ "$minor" -ge 15 ]; } ||
    { [ "$major" -eq 22 ] && { [ "$minor" -gt 22 ] || { [ "$minor" -eq 22 ] && [ "$patch" -ge 2 ]; }; }; }; then
    return 0
  fi
  _deps_note "Node $version is too old; MindKeep needs Node 22.22.2+ or 24.15.0+."
  return 1
}

_deps_find_pnpm() {
  local wanted have
  if command -v pnpm >/dev/null 2>&1; then
    _deps_pnpm=(pnpm)
  elif command -v corepack >/dev/null 2>&1; then
    _deps_pnpm=(corepack pnpm)
  else
    _deps_note "pnpm is not installed (nor corepack, which comes with Node and can run it)."
    return 1
  fi
  wanted="$(sed -n 's/.*"packageManager": "pnpm@\([^"]*\)".*/\1/p' package.json)"
  have="$(mk_pnpm --version 2>/dev/null)" || {
    _deps_note "${_deps_pnpm[*]} does not run."
    return 1
  }
  if [ -n "$wanted" ] && [ "$have" != "$wanted" ]; then
    _deps_note "using pnpm $have (package.json asks for $wanted)."
  fi
}

# The network modes to try: offline first, then online unless SANDBOX_OFFLINE=1.
_deps_networks() {
  if [ "$SANDBOX_OFFLINE" = "1" ]; then echo offline; else echo "offline online"; fi
}

_deps_flag() {
  if [ "$1" = "offline" ]; then echo "--offline"; else echo "--prefer-offline"; fi
}

_deps_locked() {
  _deps_try mk_pnpm install --frozen-lockfile "$(_deps_flag "$1")"
}

_deps_fallback() {
  local before ok=0
  before="$(cksum <pnpm-lock.yaml)"
  cp pnpm-lock.yaml "$_deps_log.lock"
  _deps_try mk_pnpm install "$(_deps_flag "$1")" --config.lockfile=false \
    --config.minimum-release-age="$(($2 * 1440))" || ok=1
  if [ "$(cksum <pnpm-lock.yaml)" != "$before" ]; then cp "$_deps_log.lock" pnpm-lock.yaml; fi
  rm -f "$_deps_log.lock"
  return "$ok"
}

install_dependencies() {
  local checksum network age remembered=""
  _deps_check_node && _deps_find_pnpm || return 1
  _deps_note "installing dependencies (details in $_deps_log)..."
  checksum="$(cat package.json pnpm-lock.yaml | cksum | cut -d ' ' -f 1)"
  if [ "$SANDBOX_DEPS" != "locked" ] && [ -f "$_deps_state_dir/node" ]; then
    remembered="$(awk -v sum="$checksum" '$1 == sum { print $2 }' "$_deps_state_dir/node")"
  fi
  for age in $remembered; do
    for network in $(_deps_networks); do
      if _deps_fallback "$network" "$age"; then
        _deps_note "WARNING: installed from version ranges, skipping releases newer than" \
          "$age days (remembered in $_deps_state_dir). pnpm-lock.yaml is unchanged."
        rm -f "$_deps_log"
        return 0
      fi
    done
  done
  for network in $(_deps_networks); do
    if _deps_locked "$network"; then
      rm -f "$_deps_state_dir/node" "$_deps_log"
      return 0
    fi
  done
  if [ "$SANDBOX_DEPS" = "locked" ]; then
    _deps_note "the versions in pnpm-lock.yaml could not be installed (SANDBOX_DEPS=locked)."
    tail -n 20 "$_deps_log" >&2
    return 1
  fi
  for age in $SANDBOX_DEPS_MIN_AGE_DAYS; do
    [ "$age" != "$remembered" ] || continue
    for network in $(_deps_networks); do
      if _deps_fallback "$network" "$age"; then
        mkdir -p "$_deps_state_dir"
        echo "$checksum $age" >"$_deps_state_dir/node"
        _deps_note "WARNING: the versions in pnpm-lock.yaml are not available here, so the" \
          "dependencies were installed from their version ranges, skipping releases newer" \
          "than $age days ($network). pnpm-lock.yaml is unchanged."
        rm -f "$_deps_log"
        return 0
      fi
    done
  done
  _deps_note "no way to install the dependencies worked."
  tail -n 20 "$_deps_log" >&2
  return 1
}
