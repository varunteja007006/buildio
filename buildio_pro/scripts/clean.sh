#!/usr/bin/env bash
# Workspace cleaner for the monorepo. Pathspec-limited `git clean`, so
# untracked files like .env are never touched.
#
# Usage: scripts/clean.sh [--dry] <deps|cache|all>
#   deps  - node_modules in the root and every workspace
#   cache - build caches and outputs (.next, .turbo, .cache, dist, .expo)
#   all   - deps + cache
#   --dry - list what would be deleted instead of deleting (-n)
set -euo pipefail

dry=()
if [ "${1:-}" = "--dry" ]; then
  dry=(-n)
  shift
fi
mode="${1:-all}"

# NOTE: globs are expanded by bash (unquoted) on purpose: `git clean -d`
# does not match wildcard pathspecs against untracked directories, but it
# does accept real paths. A non-matching glob is passed through literally
# and matches nothing, which is a harmless no-op.
deps=(node_modules apps/*/node_modules packages/*/node_modules)
cache=(
  node_modules/.cache
  .next .turbo .cache dist
  apps/*/.next apps/*/.turbo apps/*/.cache apps/*/dist apps/*/.expo
  packages/*/.turbo packages/*/.cache packages/*/dist
)

case "$mode" in
  deps) paths=("${deps[@]}") ;;
  cache) paths=("${cache[@]}") ;;
  all) paths=("${deps[@]}" "${cache[@]}") ;;
  *) echo "usage: $0 [--dry] <deps|cache|all>" >&2; exit 1 ;;
esac

exec git clean -x -d -f "${dry[@]}" -- "${paths[@]}"
