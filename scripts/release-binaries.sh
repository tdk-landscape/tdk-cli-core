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

# A compiled binary has no import.meta.dirname to walk up from, so it can't
# find engine/ the way a source checkout can. template-engine.ts already
# checks exeDir/tdk-cli as a candidate - bundle the free engine there so a
# standalone binary works the same as `tdk-cli-core` cloned from source.
mkdir -p "${RELEASE_DIR}/tdk-cli"
cp "${ROOT_DIR}/Tiltfile" "${RELEASE_DIR}/tdk-cli/Tiltfile"
cp -R "${ROOT_DIR}/engine" "${RELEASE_DIR}/tdk-cli/engine"
cp -R "${ROOT_DIR}/discovery" "${RELEASE_DIR}/tdk-cli/discovery"
cp -R "${ROOT_DIR}/specs" "${RELEASE_DIR}/tdk-cli/specs"
cp -R "${ROOT_DIR}/ext" "${RELEASE_DIR}/tdk-cli/ext"

(
  cd "${RELEASE_DIR}"
  shasum -a 256 tdk-linux-amd64 tdk-linux-arm64 tdk-darwin-amd64 tdk-darwin-arm64 > checksums.txt
  zip -qr "tdk-cli-${RELEASE_TAG}-binaries.zip" \
    tdk-linux-amd64 tdk-linux-arm64 tdk-darwin-amd64 tdk-darwin-arm64 \
    tdk-cli checksums.txt
  # Fixed filename (no version/tag in the name) so install.sh can always
  # find it via the stable /releases/latest/download/ URL, unlike the zip
  # above whose name embeds the tag and changes every release.
  tar -czf tdk-cli-engine.tar.gz tdk-cli
)

echo "Built release assets in ${RELEASE_DIR}"

if [[ "${PUBLISH}" != "--publish" ]]; then
  exit 0
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh is required to publish release binaries" >&2
  exit 1
fi

# Upload actual files only - tdk-cli/ is a directory (the bundled engine),
# already packed inside the zip, and `gh release upload` can't take a
# directory as an asset.
readonly ASSETS=(
  "${RELEASE_DIR}/tdk-linux-amd64"
  "${RELEASE_DIR}/tdk-linux-arm64"
  "${RELEASE_DIR}/tdk-darwin-amd64"
  "${RELEASE_DIR}/tdk-darwin-arm64"
  "${RELEASE_DIR}/checksums.txt"
  "${RELEASE_DIR}/tdk-cli-${RELEASE_TAG}-binaries.zip"
  "${RELEASE_DIR}/tdk-cli-engine.tar.gz"
)

# Never mark a release latest until every asset is uploaded. `gh release create
# --latest FILE...` publishes the tag first, then uploads binaries, so
# /releases/latest/download/tdk-* 404s for a few minutes (install.sh hits this).
if gh release view "${RELEASE_TAG}" --repo "${RELEASE_REPOSITORY}" >/dev/null 2>&1; then
  gh release upload "${RELEASE_TAG}" --repo "${RELEASE_REPOSITORY}" --clobber "${ASSETS[@]}"
else
  gh release create "${RELEASE_TAG}" \
    --repo "${RELEASE_REPOSITORY}" \
    --title "TDK CLI ${RELEASE_TAG#v}" \
    --draft \
    "${ASSETS[@]}"
fi
gh release edit "${RELEASE_TAG}" --repo "${RELEASE_REPOSITORY}" --draft=false --latest
