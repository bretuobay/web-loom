#!/usr/bin/env node
// Enforces the repo's versioning policy (see .claude/skills/versioning.md):
//   1. Every package under packages/* moves in lockstep, patch-only, until the
//      ecosystem deliberately commits to 1.0.0 (major.minor must not change vs. base).
//   2. No package's version may exceed the ceiling set by @web-loom/mvvm-core and
//      @web-loom/signals-core, the two most-exercised packages in the ecosystem.
//
// Usage: node scripts/check-version-policy.mjs [baseRef]
//   baseRef defaults to $BASE_REF or "origin/main".
//
// Deliberate major/minor bumps (e.g. crossing into 1.0.0, or a one-time lockstep
// realignment) are allowed by including "[version-jump]" in the pull request title —
// the CI workflow sets ALLOW_VERSION_JUMP=true when it sees that marker. The ceiling
// check (no package exceeds mvvm-core/signals-core) still applies even with the marker.

import { execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = new URL('..', import.meta.url).pathname;
const PACKAGES_DIR = join(REPO_ROOT, 'packages');
const CEILING_PACKAGES = ['mvvm-core', 'signals-core'];

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version ?? '');
  if (!match) return null;
  const [, major, minor, patch] = match;
  return { major: Number(major), minor: Number(minor), patch: Number(patch) };
}

function compareVersion(a, b) {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

function readCurrentVersion(pkgDir) {
  const pkgJsonPath = join(PACKAGES_DIR, pkgDir, 'package.json');
  const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8'));
  return { name: pkg.name, version: pkg.version };
}

function readBaseVersion(baseRef, pkgDir) {
  try {
    const raw = execSync(`git show ${baseRef}:packages/${pkgDir}/package.json`, {
      cwd: REPO_ROOT,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString('utf8');
    return JSON.parse(raw).version;
  } catch {
    return null; // new package on this branch — nothing to diff against
  }
}

function main() {
  const baseRef = process.argv[2] || process.env.BASE_REF || 'origin/main';
  const allowVersionJump = /^(1|true)$/i.test(process.env.ALLOW_VERSION_JUMP ?? '');
  const packageDirs = readdirSync(PACKAGES_DIR).filter((dir) =>
    statSync(join(PACKAGES_DIR, dir)).isDirectory(),
  );

  const violations = [];
  const current = new Map();

  for (const dir of packageDirs) {
    const { name, version } = readCurrentVersion(dir);
    const parsed = parseVersion(version);
    if (!parsed) {
      violations.push(`${name} (${dir}): version "${version}" is not valid semver`);
      continue;
    }
    current.set(dir, { name, version, parsed });

    const baseVersion = readBaseVersion(baseRef, dir);
    if (baseVersion === null) continue; // new package, no patch-only check possible

    const baseParsed = parseVersion(baseVersion);
    if (
      !allowVersionJump &&
      baseParsed &&
      (parsed.major !== baseParsed.major || parsed.minor !== baseParsed.minor)
    ) {
      violations.push(
        `${name} (${dir}): ${baseVersion} → ${version} changes major.minor — only patch bumps are allowed until 1.0.0 (add "[version-jump]" to the PR title to override)`,
      );
    }
  }

  const ceilingEntries = CEILING_PACKAGES.map((dir) => current.get(dir)).filter(Boolean);
  if (ceilingEntries.length === CEILING_PACKAGES.length) {
    const ceiling = ceilingEntries.reduce((min, entry) =>
      compareVersion(entry.parsed, min.parsed) < 0 ? entry : min,
    );

    for (const [dir, entry] of current) {
      if (CEILING_PACKAGES.includes(dir)) continue;
      if (compareVersion(entry.parsed, ceiling.parsed) > 0) {
        violations.push(
          `${entry.name} (${dir}): ${entry.version} exceeds the ${ceiling.name} ceiling (${ceiling.version})`,
        );
      }
    }
  }

  if (violations.length > 0) {
    console.error('Version policy violations:\n');
    for (const v of violations) console.error(`  - ${v}`);
    console.error('\nSee .claude/skills/versioning.md for the policy.');
    process.exit(1);
  }

  const suffix = allowVersionJump ? ' (major/minor override active via [version-jump])' : '';
  console.log(`Version policy OK — ${current.size} packages checked against ${baseRef}${suffix}.`);
}

main();
