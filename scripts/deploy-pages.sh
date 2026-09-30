#!/usr/bin/env bash
# Publish reviewed source on main and generated static files on gh-pages.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "$(git branch --show-current)" != main ]]; then echo 'Run from main.' >&2; exit 1; fi
if [[ -n "$(git status --porcelain)" ]]; then echo 'Commit changes before deploying.' >&2; exit 1; fi
remote=$(git remote get-url origin)
export BASE_PATH=${BASE_PATH:-/cuhk-wayfinder/}
npm test
npm run build
git push origin main
publish_dir=$(mktemp -d "${TMPDIR:-/tmp}/cuhk-pages.XXXXXX")
trap 'rm -rf "$publish_dir"' EXIT
if git ls-remote --exit-code --heads origin gh-pages >/dev/null 2>&1; then
  git clone --quiet --single-branch --branch gh-pages "$remote" "$publish_dir"
else
  git -C "$publish_dir" init -b gh-pages
  git -C "$publish_dir" remote add origin "$remote"
fi
rsync -a --delete --exclude .git dist/ "$publish_dir/"
git -C "$publish_dir" add -A
if ! git -C "$publish_dir" diff --cached --quiet; then
  git -C "$publish_dir" commit -m "Deploy $(git rev-parse --short HEAD)"
  git -C "$publish_dir" push origin gh-pages
fi
printf 'Published build from source %s\n' "$(git rev-parse --short HEAD)"
