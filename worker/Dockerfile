FROM node:24.5.0

# Build from the repository root so the image can install the npm workspace
# (one root package-lock.json) and include the internal @communities/*
# packages from source:
#
#   docker build -f worker/Dockerfile .

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /opt/communities

# Install from the manifests and lockfile alone, so this layer stays cached
# until one of them changes. npm validates the lockfile against every
# workspace, so all workspace manifests are copied, including ones this image
# doesn't use.
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY packages/backend/package.json packages/backend/package.json
COPY packages/session/package.json packages/session/package.json
COPY worker/package.json worker/package.json
COPY web-application/package.json web-application/package.json

# NODE_ENV=production makes npm skip devDependencies, and the development
# setup in compose.yaml needs them (nodemon, dotenv), so include them
# explicitly. This replaces the old `--production=false`.
RUN npm ci --workspace worker --include=dev

# Copy only what the worker needs, from least to most likely to change, to
# maximize layer caching.
COPY packages/shared packages/shared
COPY packages/backend packages/backend
COPY worker/config worker/config
COPY worker/jobs worker/jobs
COPY worker/index.js worker/index.js

# The worker has always run from /src, and paths are resolved relative to the
# working directory (e.g. `tmp/`). Keep /src pointing at the worker so
# anything that relies on that path, such as volume mounts, keeps working.
RUN ln -s /opt/communities/worker /src
WORKDIR /src

ENTRYPOINT [ "npm", "start" ]
