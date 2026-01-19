FROM node:24.5.0

WORKDIR /src

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

RUN apt-get update && apt-get install -y ffmpeg

COPY package-lock.json package-lock.json
COPY package.json package.json 
COPY .npmrc .npmrc 

# Techdebt we need a better way to handle this.  The --production=false flag
# is needed because webpack (and all its dependencies) are dev dependencies.
# With `--production=true`, npm will not install dev dependencies.  Which means
# it won't install webpack, which means we can't build.
#
# Setting NODE_ENV=production automatically sets --production=true, so we have
# to override here to ensure the dev dependencies install.
RUN --mount=type=secret,id=CODEARTIFACT_AUTH_TOKEN CODEARTIFACT_AUTH_TOKEN=$(cat /run/secrets/CODEARTIFACT_AUTH_TOKEN) npm ci --production=false 

# Copy only the files and directories we need, one per command, from least
# likely to change to most likely to change.  This maximizes layer caching in
# our rebuilds and minimizes build times.  It also saves space - we don't need
# the tests in the image.  We probably shouldn't be building the production
# image if we haven't already run the tests.
#
# TODO In the future, allow for the construction of development images that
# include the tests, among other things, and can load code on a volume to allow
# development to happen in a docker image.
COPY config config
COPY jobs jobs
COPY index.js index.js

ENTRYPOINT [ "node", "./index.js" ]
