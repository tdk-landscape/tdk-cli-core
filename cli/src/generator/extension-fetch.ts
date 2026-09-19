// Fetches the TDK Tilt extension (engine/discovery/specs/ext) from a gated
// distribution endpoint at `tdk up` time, instead of requiring the caller to
// have access to the private tdk-cli source repo.
//
// Design intent: the endpoint (not this client) is the actual access-control
// boundary. No decryption key or copy of the extension source ships inside
// this binary — there is nothing here for someone to extract. The endpoint
// can rate-limit, log, or revoke access at any time without a new release.
//
// See docs/extension-distribution.md for the endpoint contract this expects
// and the server-side responsibilities (packaging + signing the bundle from
// the private source, which must be done by someone with repo access - not
// by this client).

import { createHash, verify as verifySignature } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { extractTarball } from "../utils/tar";

const DEFAULT_ENDPOINT = "https://tdk-extension-dist.oranguman.workers.dev/v1/extension";

// Ed25519 public key, PEM-encoded. Placeholder - replace with the real key
// generated for the distribution endpoint before this ships. The matching
// private key must never leave the server; it is used there to sign each
// bundle so this client can verify it wasn't tampered with in transit.
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
REPLACE_WITH_REAL_ED25519_PUBLIC_KEY
-----END PUBLIC KEY-----`;

interface BundleManifest {
  version: string;
  sha256: string;
  signature: string; // base64, signs the sha256 hex string
}

function cacheDir(version: string): string {
  return join(homedir(), ".tdk", "cache", `extension-${version}`);
}

function isCached(version: string): boolean {
  const dir = cacheDir(version);
  return existsSync(join(dir, "Tiltfile")) && existsSync(join(dir, "engine"));
}

async function fetchManifest(endpoint: string, version: string): Promise<BundleManifest> {
  const res = await fetch(`${endpoint}/${version}/manifest.json`);
  if (!res.ok) {
    throw new Error(`manifest fetch failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as BundleManifest;
}

async function fetchBundle(endpoint: string, version: string): Promise<Buffer> {
  const res = await fetch(`${endpoint}/${version}/bundle.tar.gz`);
  if (!res.ok) {
    throw new Error(`bundle fetch failed: ${res.status} ${res.statusText}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

function verifyBundle(bundle: Buffer, manifest: BundleManifest): boolean {
  const actualHash = createHash("sha256").update(bundle).digest("hex");
  if (actualHash !== manifest.sha256) {
    return false;
  }
  return verifySignature(
    null,
    Buffer.from(manifest.sha256, "hex"),
    PUBLIC_KEY_PEM,
    Buffer.from(manifest.signature, "base64")
  );
}

/**
 * Fetches, verifies, and caches the extension bundle for `version`.
 * Returns the local directory containing Tiltfile/engine/discovery/specs/ext,
 * or null if the endpoint is unreachable / verification fails (caller should
 * fall back to the existing TDK_EXTENSION_PATH / sibling-checkout resolution).
 */
export async function fetchExtension(
  version: string,
  endpoint: string = process.env.TDK_EXTENSION_ENDPOINT || DEFAULT_ENDPOINT
): Promise<string | null> {
  if (isCached(version)) {
    return cacheDir(version);
  }

  try {
    const manifest = await fetchManifest(endpoint, version);
    const bundle = await fetchBundle(endpoint, version);

    if (!verifyBundle(bundle, manifest)) {
      console.warn("⚠️  Extension bundle failed signature verification - discarding.");
      return null;
    }

    const dir = cacheDir(version);
    mkdirSync(dir, { recursive: true });
    extractTarball(bundle, dir);
    return dir;
  } catch (err) {
    console.warn(`⚠️  Could not fetch TDK extension from ${endpoint}: ${(err as Error).message}`);
    return null;
  }
}
