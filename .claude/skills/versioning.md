# Versioning Policy

How package versions in `packages/*/package.json` are managed until the ecosystem commits to a stable 1.0.0.

## The rule

1. **Lockstep, patch-only.** Every package's version moves together at **0.8.0** for now. A version bump changes only the patch digit (`0.8.0` → `0.8.1`) — never `major.minor` — until there's a deliberate, repo-wide decision to cross into `1.0.0`.
2. **Ceiling.** No package's version may exceed `@web-loom/mvvm-core` or `@web-loom/signals-core` — they're the two most-exercised packages in the ecosystem and set the pace for everyone else. A brand-new package should start at or below the current ceiling, not ahead of it.

This applies to every package under `packages/`, regardless of publish status (published, coming-soon/unpublished, or internal `@repo/*`-scoped) — see the root `README.md`'s Packages section for that breakdown.

## Why

Package versions had drifted inconsistently — `@web-loom/template-core` had reached `1.2.0` while `mvvm-core`/`signals-core`, the packages it depends on and exists to prove out, were still at `0.8.0`. A version number ahead of the packages it's built on is misleading about API stability. Lockstep versioning keeps the whole ecosystem legible: one number tells you where every package stands, and nothing claims more stability than `mvvm-core` itself has earned yet.

## Enforcement

`scripts/check-version-policy.mjs` (run via `npm run check-versions`, or automatically in `.github/workflows/version-policy-guard.yml` on every pull request touching `packages/*/package.json`) diffs each package's version against the PR's base branch and fails the check if:

- any package's `major.minor` changed (a non-patch bump), or
- any non-`mvvm-core`/`signals-core` package exceeds the `mvvm-core`/`signals-core` ceiling.

**When you (Claude Code) are asked to bump a package's version in this repo:** only ever bump the patch digit, and only for the specific package(s) actually being released — don't touch unrelated packages' versions. If a task seems to call for a minor/major bump (a breaking change, or crossing into 1.0.0), stop and confirm with the user first — that's a deliberate, repo-wide decision, not a routine edit.

### The escape hatch

Crossing a `major.minor` boundary is sometimes intentional — the one-time lockstep realignment to `0.8.0` that introduced this policy, or eventually the deliberate jump to `1.0.0`. To allow that, include `[version-jump]` in the pull request title; the workflow sets `ALLOW_VERSION_JUMP=true` and the patch-only check is skipped for that PR (the ceiling check still applies). Don't add this marker casually — it's meant for the rare, deliberate case, not routine releases.
