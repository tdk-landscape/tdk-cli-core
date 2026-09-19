#!/usr/bin/env bash

set -euo pipefail

readonly ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly RELEASE_REPOSITORY="tdk-landscape/tdk-cli-releases"
readonly VERSION="$(node -p "require('${ROOT_DIR}/cli/package.json').version")"
readonly RELEASE_TAG="v${VERSION}-$(git -C "${ROOT_DIR}" rev-parse --short HEAD)"
readonly RELEASE_DIR="${ROOT_DIR}/release-dist-${RELEASE_TAG#v}"
readonly PUBLISH="${1:-}"

if ! command -v bun >/dev/null 2>&1; then
  echo "bun is required to build release binaries" >&2
  exit 1
fi

rm -rf "${RELEASE_DIR}"
mkdir -p "${RELEASE_DIR}"

build_target() {
  local target="$1"
  local output="$2"

  bun build --compile --target="${target}" --outfile="${RELEASE_DIR}/${output}" "${ROOT_DIR}/cli/src/cli.ts"
}

build_target bun-linux-x64 tdk-linux-amd64
build_target bun-linux-arm64 tdk-linux-arm64
build_target bun-darwin-x64 tdk-darwin-amd64
build_target bun-darwin-arm64 tdk-darwin-arm64

(
  cd "${RELEASE_DIR}"
  shasum -a 256 tdk-* > checksums.txt
  zip -q "tdk-cli-${RELEASE_TAG}-binaries.zip" tdk-* checksums.txt
)

echo "Built release assets in ${RELEASE_DIR}"

if [[ "${PUBLISH}" != "--publish" ]]; then
  exit 0
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh is required to publish release binaries" >&2
  exit 1
fi

if gh release view "${RELEASE_TAG}" --repo "${RELEASE_REPOSITORY}" >/dev/null 2>&1; then
  gh release upload "${RELEASE_TAG}" --repo "${RELEASE_REPOSITORY}" --clobber "${RELEASE_DIR}"/*
  gh release edit "${RELEASE_TAG}" --repo "${RELEASE_REPOSITORY}" --latest
else
  gh release create "${RELEASE_TAG}" \
    --repo "${RELEASE_REPOSITORY}" \
    --title "TDK CLI ${RELEASE_TAG#v}" \
    --latest \
    "${RELEASE_DIR}"/*
fi