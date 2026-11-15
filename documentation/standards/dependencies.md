# Dependencies

How dependencies are managed: one npm workspace, exact versions, and a
lockfile that's checked on every build.

**Code:** `package.json`, `package-lock.json`, `scripts/check-lockfile.js`,
`.github/workflows/ci.yaml`

## The Workspace

The root `package.json` lists the workspace packages (`packages/shared`,
`packages/backend`, `packages/session`, `worker`, `web-application`), and one
root `package-lock.json` pins every dependency for all of them. There are no
lockfiles in the packages. The internal `@communities/*` packages are linked
from source, versioned together by the Release workflow, and never
published or downloaded from a registry.

Dependencies come from the public npm registry. No credentials are needed.

## Installing

Install from the repository root, at the Node version in `.nvmrc`:

```
npm ci
```

`npm ci` installs exactly what the lockfile says and fails if anything
doesn't match its integrity hash. Use it rather than `npm install` unless
you're changing dependencies.

## Adding or Changing a Dependency

Always from the repository root, naming the workspace package, and pinning
the exact version:

```
npm install <package>@<version> --save-exact -w packages/backend
npm install <package>@<version> --save-exact --save-dev -w web-application
```

| Rule | Why |
| ---- | --- |
| **Exact versions**, no `^` or `~`. | Every version change is a deliberate, reviewed change to `package.json`. |
| **In the package that uses it**, not the root, unless it's for the repository itself (the Capacitor packages, `concurrently`). | Each Docker image installs only what its packages need. |
| **Prefer what's already there.** Check whether a package already in the workspace does the job before adding one. | Fewer packages, smaller attack surface. |
| **Run the lockfile check** before you commit. | CI runs it too, and fails the build. |

```
npm run check:lockfile
```

The check fails if `package-lock.json` resolves anything from a host other
than `registry.npmjs.org`, has a registry package without a `sha512`
integrity hash, or resolves an internal `@communities/*` package from
anywhere but the workspace (the `@communities` scope on the public registry
isn't ours). If you normally install through a mirror, override it for this
repository with `--registry=https://registry.npmjs.org/`.

After changing dependencies, rebuild the Docker images; see
[Running with Docker](../getting-started/running-with-docker.md).

## `packages/session`

`packages/session` is our fork of express-session, and keeps the version
ranges it inherited. See [The Session Package](../server/session-package.md).
