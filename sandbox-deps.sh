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
# A node_modules/ that is already there (installed some other way, say) is set aside first and
# never lost: a successful install replaces it, and if nothing works, or the run is interrupted,
# it is put back (with a warning, since it may not match pnpm-lock.yaml).
#
# The attempts with network give up soon on a registry that does not answer, all the attempts
# together stop after SANDBOX_DEPS_TIMEOUT seconds, and a long attempt says every
# SANDBOX_DEPS_PROGRESS seconds that it is still going.
#
# Settings (environment variables):
#   SANDBOX_DEPS=locked                  use only the lockfile (steps 1 and 2), never step 3
#   SANDBOX_OFFLINE=1                    never use the network
#   SANDBOX_DEPS_MIN_AGE_DAYS="14 30"    the N values step 3 tries (default "14 30 60 90")
#   SANDBOX_DEPS_TIMEOUT=600             the most seconds all the attempts may take (default 600)
#   SANDBOX_DEPS_PROGRESS=30             seconds between "still installing" lines (default 30)
#
# Afterwards, run commands with `mk_pnpm <arguments>`: the same pnpm the install used.

SANDBOX_DEPS="${SANDBOX_DEPS:-auto}"
SANDBOX_OFFLINE="${SANDBOX_OFFLINE:-0}"
SANDBOX_DEPS_MIN_AGE_DAYS="${SANDBOX_DEPS_MIN_AGE_DAYS:-14 30 60 90}"
SANDBOX_DEPS_TIMEOUT="${SANDBOX_DEPS_TIMEOUT:-600}"
SANDBOX_DEPS_PROGRESS="${SANDBOX_DEPS_PROGRESS:-30}"
_deps_state_dir=".sandbox/deps"
_deps_kept="$_deps_state_dir/kept-node_modules"
_deps_log="$(mktemp "${TMPDIR:-/tmp}/mindkeep-deps-XXXXXX")"
_deps_pnpm=()
_deps_pid=""
_deps_deadline=0

# pnpm would otherwise download the exact version of "packageManager", which needs network.
export npm_config_manage_package_manager_versions=false

mk_pnpm() {
  "${_deps_pnpm[@]}" "$@"
}

_deps_note() {
  echo "sandbox-deps: $*" >&2
}

# Stop a process and everything it started.
_deps_kill_tree() {
  local child
  for child in $(pgrep -P "$1" 2>/dev/null); do _deps_kill_tree "$child"; done
  kill "$1" 2>/dev/null || true
}

_deps_stop() {
  if [ -n "$_deps_pid" ]; then
    _deps_kill_tree "$_deps_pid"
    wait "$_deps_pid" 2>/dev/null || true
    _deps_pid=""
  fi
}

# Run a command in the background, its output in the log, until it ends or the deadline passes,
# saying now and then that it is still going.
_deps_run() {
  local started=$SECONDS next=$((SECONDS + SANDBOX_DEPS_PROGRESS)) status=0
  [ "$SECONDS" -lt "$_deps_deadline" ] || return 1
  "$@" >>"$_deps_log" 2>&1 &
  _deps_pid=$!
  while kill -0 "$_deps_pid" 2>/dev/null; do
    if [ "$SECONDS" -ge "$_deps_deadline" ]; then
      _deps_note "stopped: installing took more than $SANDBOX_DEPS_TIMEOUT s (SANDBOX_DEPS_TIMEOUT)."
      echo "(stopped at the time limit)" >>"$_deps_log"
      _deps_stop
      return 1
    fi
    if [ "$SECONDS" -ge "$next" ]; then
      _deps_note "still installing ($((SECONDS - started)) s; details in $_deps_log)..."
      next=$((SECONDS + SANDBOX_DEPS_PROGRESS))
    fi
    sleep 0.2
  done
  wait "$_deps_pid" || status=$?
  _deps_pid=""
  return "$status"
}

# Run a quiet attempt; keep its output in the log for the final error message. A failed attempt
# leaves no node_modules/ behind.
_deps_try() {
  echo "\$ $*" >>"$_deps_log"
  if _deps_run "$@"; then return 0; fi
  rm -rf node_modules
  return 1
}

# The node_modules/ found at the start waits apart while installing.
_deps_set_aside() {
  if [ -d node_modules ]; then
    mkdir -p "$_deps_state_dir"
    rm -rf "$_deps_kept"
    mv node_modules "$_deps_kept"
  fi
}

_deps_put_back() {
  if [ -d "$_deps_kept" ]; then
    rm -rf node_modules
    mv "$_deps_kept" node_modules
  fi
}

_deps_interrupted() {
  _deps_stop
  _deps_put_back
  trap - EXIT INT TERM
  exit "$1"
}

# The end of install_dependencies: the node_modules/ set aside is no longer needed (or is back).
_deps_finish() {
  trap - EXIT INT TERM
  rm -rf "$_deps_kept"
  rm -f "$_deps_log"
}

# The Node versions the dependencies accept: ^22.13.0 or >=24.0.0 (as "engines" in package.json).
_deps_check_node() {
  local version major minor
  if ! version="$(node --version 2>/dev/null)"; then
    _deps_note "Node.js is not installed; MindKeep needs Node 22.13+ or 24+."
    return 1
  fi
  IFS=. read -r major minor _ <<<"${version#v}"
  if [ "$major" -ge 24 ] || { [ "$major" -eq 22 ] && [ "$minor" -ge 13 ]; }; then
    return 0
  fi
  _deps_note "Node $version is too old; MindKeep needs Node 22.13+ or 24+."
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

# The pnpm options of a network mode. Online, a registry that does not answer fails within a
# minute instead of being retried for long.
_deps_flags() {
  if [ "$1" = "offline" ]; then
    echo "--offline"
  else
    echo "--prefer-offline --config.fetch-timeout=30000 --config.fetch-retries=1"
  fi
}

_deps_locked() {
  # shellcheck disable=SC2046 # the options are separate words
  _deps_try mk_pnpm install --frozen-lockfile $(_deps_flags "$1")
}

_deps_fallback() {
  local before ok=0
  before="$(cksum <pnpm-lock.yaml)"
  cp pnpm-lock.yaml "$_deps_log.lock"
  # shellcheck disable=SC2046 # the options are separate words
  _deps_try mk_pnpm install $(_deps_flags "$1") --config.lockfile=false \
    --config.minimum-release-age="$(($2 * 1440))" || ok=1
  if [ "$(cksum <pnpm-lock.yaml)" != "$before" ]; then cp "$_deps_log.lock" pnpm-lock.yaml; fi
  rm -f "$_deps_log.lock"
  return "$ok"
}

# Nothing could be installed: put back the node_modules/ found at the start, if there was one.
# It is used, except with SANDBOX_DEPS=locked (only the lockfile's versions will do).
_deps_give_up() {
  local status=1
  if [ -d "$_deps_kept" ]; then
    _deps_put_back
    _deps_note "WARNING: $1; the node_modules that was already here is back, and it may not" \
      "match pnpm-lock.yaml."
    [ "$SANDBOX_DEPS" = "locked" ] || status=0
  else
    _deps_note "$1."
    tail -n 20 "$_deps_log" >&2
  fi
  _deps_finish
  return "$status"
}

install_dependencies() {
  local checksum network age remembered=""
  _deps_check_node && _deps_find_pnpm || return 1
  _deps_note "installing dependencies (details in $_deps_log)..."
  _deps_deadline=$((SECONDS + SANDBOX_DEPS_TIMEOUT))
  trap '_deps_interrupted 130' INT
  trap '_deps_interrupted 143' TERM
  trap '_deps_stop; _deps_put_back' EXIT
  _deps_set_aside
  checksum="$(cat package.json pnpm-lock.yaml | cksum | cut -d ' ' -f 1)"
  if [ "$SANDBOX_DEPS" != "locked" ] && [ -f "$_deps_state_dir/node" ]; then
    remembered="$(awk -v sum="$checksum" '$1 == sum { print $2 }' "$_deps_state_dir/node")"
  fi
  for age in $remembered; do
    for network in $(_deps_networks); do
      if _deps_fallback "$network" "$age"; then
        _deps_note "WARNING: installed from version ranges, skipping releases newer than" \
          "$age days (remembered in $_deps_state_dir). pnpm-lock.yaml is unchanged."
        _deps_finish
        return 0
      fi
    done
  done
  for network in $(_deps_networks); do
    if _deps_locked "$network"; then
      rm -f "$_deps_state_dir/node"
      _deps_finish
      return 0
    fi
  done
  if [ "$SANDBOX_DEPS" = "locked" ]; then
    _deps_give_up "the versions in pnpm-lock.yaml could not be installed (SANDBOX_DEPS=locked)"
    return
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
        _deps_finish
        return 0
      fi
    done
  done
  _deps_give_up "no way to install the dependencies worked"
}
