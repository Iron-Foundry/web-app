# Changelog

All notable changes to web-app are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`package.json` holds the version and is the single source of truth for it.
Bump with `npm version --no-git-tag-version patch|minor` (or `prerelease`).
A MAJOR bump is the maintainer's call and is never made automatically.

## [1.0.1] - 2026-07-28

### Fixed

- `typescript` is now an explicit devDependency. It was only present as a
  transitive peer of `openapi-typescript`, so a bump of that package could have
  removed `tsc` and broken `bun run typecheck`.
- `typecheck` and `gen:api-types` invoke their tool's JS entry point through
  `bun` instead of the `node_modules/.bin` shim. The shims are platform
  specific, so a WSL shell sharing the Windows `node_modules` on `/mnt/c` found
  only `tsc.exe` and failed with `tsc: command not found`.

## [1.0.0] - 2026-07-28

Versioning baseline. The site has been in production; 1.0.0 is adopted as the starting point rather than reconstructing its history. The package was also renamed from `bun-react-template` to `web-app`.
