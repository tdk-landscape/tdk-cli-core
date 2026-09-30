#!/usr/bin/env bash

set -euo pipefail

readonly ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly RELEASE_REPOSITORY="tdk-landscape/tdk-cli-releases"
readonly VERSION="$(node -p "require('${ROOT_DIR}/cli/package.json').version")"
readonly RELEASE_TAG="v${VERSION}"
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
build_target bun-windows-x64 tdk-windows-amd64.exe

test -s "${RELEASE_DIR}/tdk-windows-amd64.exe"
if [[ "$(head -c 2 "${RELEASE_DIR}/tdk-windows-amd64.exe" | od -An -t x1 | tr -d ' \n')" != "4d5a" ]]; then
  echo "Windows binary is not a PE executable (missing MZ signature)" >&2
  exit 1
fi

# A compiled binary has no import.meta.dirname to walk up from, so it can't
# find engine/ the way a source checkout can. template-engine.ts checks
# exeDir/tdk-cli as a candidate - bundle the free engine (and the Handlebars
# templates loadTemplate() reads at module init) there so a standalone binary
# works the same as `tdk-cli-core` cloned from source.
mkdir -p "${RELEASE_DIR}/tdk-cli"
cp "${ROOT_DIR}/Tiltfile" "${RELEASE_DIR}/tdk-cli/Tiltfile"
cp -R "${ROOT_DIR}/engine" "${RELEASE_DIR}/tdk-cli/engine"
cp -R "${ROOT_DIR}/discovery" "${RELEASE_DIR}/tdk-cli/discovery"
cp -R "${ROOT_DIR}/specs" "${RELEASE_DIR}/tdk-cli/specs"
cp -R "${ROOT_DIR}/ext" "${RELEASE_DIR}/tdk-cli/ext"
mkdir -p "${RELEASE_DIR}/tdk-cli/cli"
cp -R "${ROOT_DIR}/cli/templates" "${RELEASE_DIR}/tdk-cli/cli/templates"
# `tdk project` copies these into every project; generated Dockerfiles run them.
mkdir -p "${RELEASE_DIR}/tdk-cli/shared-platform-engineering"
cp -R "${ROOT_DIR}/shared-platform-engineering/docker-templates" \
  "${RELEASE_DIR}/tdk-cli/shared-platform-engineering/docker-templates"

# Smoke-test the binary for this machine the way users install it (binary with
# tdk-cli/ next to it): `tdk project` must find the engine and runtime assets.
host_binary="tdk-$(uname -s | tr '[:upper:]' '[:lower:]')-$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/')"
if [ -x "${RELEASE_DIR}/${host_binary}" ]; then
  smoke_dir="$(mktemp -d)"
  smoke_log="$(cd "${smoke_dir}" && "${RELEASE_DIR}/${host_binary}" project --yes </dev/null 2>&1)" || {
    echo "${smoke_log}" >&2
    echo "Smoke test failed: ${host_binary} project --yes exited non-zero" >&2
    exit 1
  }
  rm -rf "${smoke_dir}"
  if echo "${smoke_log}" | grep -qE "not found"; then
    echo "${smoke_log}" >&2
    echo "Smoke test failed: ${host_binary} could not find its bundled files" >&2
    exit 1
  fi
  echo "Smoke test passed: ${host_binary} project --yes"
fi

(
  cd "${RELEASE_DIR}"
  # Fixed filename (no version/tag in the name) so install.sh can always
  # find it via the stable /releases/latest/download/ URL, unlike the zip
  # below whose name embeds the tag and changes every release.
  tar -czf tdk-cli-engine.tar.gz tdk-cli
  # install.sh and `tdk upgrade` verify the binary and the engine tarball
  # against this file before installing them.
  shasum -a 256 tdk-linux-amd64 tdk-linux-arm64 tdk-darwin-amd64 tdk-darwin-arm64 \
    tdk-windows-amd64.exe \
    tdk-cli-engine.tar.gz > checksums.txt
  zip -qr "tdk-cli-${RELEASE_TAG}-binaries.zip" \
    tdk-linux-amd64 tdk-linux-arm64 tdk-darwin-amd64 tdk-darwin-arm64 tdk-windows-amd64.exe \
    tdk-cli checksums.txt
)

validate_release_assets() {
  local required=(
    tdk-linux-amd64
    tdk-linux-arm64
    tdk-darwin-amd64
    tdk-darwin-arm64
    tdk-windows-amd64.exe
    tdk-cli-engine.tar.gz
    checksums.txt
    "tdk-cli-${RELEASE_TAG}-binaries.zip"
  )
  local asset

  for asset in "${required[@]}"; do
    if [[ ! -s "${RELEASE_DIR}/${asset}" ]]; then
      echo "Required release asset is missing or empty: ${asset}" >&2
      return 1
    fi
  done

  if [[ "$(head -c 2 "${RELEASE_DIR}/tdk-windows-amd64.exe" | od -An -t x1 | tr -d ' \n')" != "4d5a" ]]; then
    echo "Windows binary is not a PE executable (missing MZ signature)" >&2
    return 1
  fi

  local checksum_asset
  for checksum_asset in \
    tdk-linux-amd64 tdk-linux-arm64 tdk-darwin-amd64 tdk-darwin-arm64 \
    tdk-windows-amd64.exe tdk-cli-engine.tar.gz; do
    local checksum_entries
    checksum_entries="$(awk -v name="${checksum_asset}" '$2 == name { count++ } END { print count + 0 }' "${RELEASE_DIR}/checksums.txt")"
    if [[ "${checksum_entries}" != "1" ]]; then
      echo "checksums.txt must contain exactly one entry for ${checksum_asset}" >&2
      return 1
    fi
  done

  (
    cd "${RELEASE_DIR}"
    shasum -a 256 -c checksums.txt
  )

  local zip_contents
  zip_contents="$(unzip -Z1 "${RELEASE_DIR}/tdk-cli-${RELEASE_TAG}-binaries.zip")"
  for asset in \
    tdk-linux-amd64 tdk-linux-arm64 tdk-darwin-amd64 tdk-darwin-arm64 \
    tdk-windows-amd64.exe checksums.txt; do
    if ! grep -Fxq "${asset}" <<<"${zip_contents}"; then
      echo "Binary ZIP is missing ${asset}" >&2
      return 1
    fi
  done
  if ! grep -Eq '^tdk-cli/' <<<"${zip_contents}"; then
    echo "Binary ZIP is missing the tdk-cli/ engine directory" >&2
    return 1
  fi
}

validate_release_assets

echo "Built and validated release assets in ${RELEASE_DIR}"

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
  "${RELEASE_DIR}/tdk-windows-amd64.exe"
  "${RELEASE_DIR}/checksums.txt"
  "${RELEASE_DIR}/tdk-cli-${RELEASE_TAG}-binaries.zip"
  "${RELEASE_DIR}/tdk-cli-engine.tar.gz"
)

# Never mark a release latest until every asset is uploaded. `gh release create
# --latest FILE...` publishes the tag first, then uploads binaries, so
# /releases/latest/download/tdk-* 404s for a few minutes (install.sh hits this).
if existing_release_draft="$(gh release view "${RELEASE_TAG}" --repo "${RELEASE_REPOSITORY}" --json isDraft --jq '.isDraft' 2>/dev/null)"; then
  if [[ "${existing_release_draft}" != "true" ]]; then
    echo "Refusing to overwrite published release ${RELEASE_TAG}; published assets may already be in use" >&2
    exit 1
  fi
  gh release upload "${RELEASE_TAG}" --repo "${RELEASE_REPOSITORY}" --clobber "${ASSETS[@]}"
else
  gh release create "${RELEASE_TAG}" \
    --repo "${RELEASE_REPOSITORY}" \
    --title "TDK CLI ${RELEASE_TAG#v}" \
    --draft \
    "${ASSETS[@]}"
fi
# Verify remote names and bytes before exposing the release as latest.
remote_assets="$(gh release view "${RELEASE_TAG}" --repo "${RELEASE_REPOSITORY}" --json assets --jq '.assets[].name')"
verify_dir="$(mktemp -d)"
trap 'rm -rf "${verify_dir}"' EXIT
for asset in \
  tdk-linux-amd64 tdk-linux-arm64 tdk-darwin-amd64 tdk-darwin-arm64 \
  tdk-windows-amd64.exe tdk-cli-engine.tar.gz checksums.txt \
  "tdk-cli-${RELEASE_TAG}-binaries.zip"; do
  if ! grep -Fxq "${asset}" <<<"${remote_assets}"; then
    echo "Published release is missing required asset: ${asset}" >&2
    exit 1
  fi
  gh release download "${RELEASE_TAG}" \
    --repo "${RELEASE_REPOSITORY}" \
    --dir "${verify_dir}" \
    --pattern "${asset}"
  if ! cmp -s "${RELEASE_DIR}/${asset}" "${verify_dir}/${asset}"; then
    echo "Uploaded release asset does not match local build: ${asset}" >&2
    exit 1
  fi
done

gh release edit "${RELEASE_TAG}" --repo "${RELEASE_REPOSITORY}" --draft=false --latest
