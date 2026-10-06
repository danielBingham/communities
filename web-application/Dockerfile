FROM node:24.5.0

# Build from the repository root so the image can install the npm workspace
# (one root package-lock.json) and include the internal @communities/*
# packages from source:
#
#   docker build -f web-application/Dockerfile .

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

RUN apt-get update && apt-get install -y zip unzip

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

# Techdebt: webpack (and all its dependencies) are devDependencies, and
# NODE_ENV=production makes npm skip devDependencies, so include them
# explicitly or we can't build. This replaces the old `--production=false`.
RUN npm ci --workspace web-application --include=dev

# Copy only what the web application needs, from least to most likely to
# change, to maximize layer caching. The web application's tests stay out of
# the image; we shouldn't be building it if the tests haven't passed.
COPY packages/shared packages/shared
COPY packages/backend packages/backend
COPY packages/session packages/session
COPY web-application/babel.config.js web-application/babel.config.js
COPY web-application/webpack.config.js web-application/webpack.config.js
COPY web-application/public web-application/public
COPY web-application/server web-application/server
COPY web-application/client web-application/client

WORKDIR /opt/communities/web-application
RUN npm run build

# The web application has always run from /src, and paths are resolved
# relative to the working directory (e.g. `tmp/`, `public/dist`). Keep /src
# pointing at the web application so anything that relies on that path, such
# as volume mounts, keeps working.
RUN ln -s /opt/communities/web-application /src
WORKDIR /src

EXPOSE 8080

ENTRYPOINT [ "npm", "start" ]
