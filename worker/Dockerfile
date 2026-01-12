FROM node:24.5.0

WORKDIR /src

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

RUN apt-get update && apt-get install -y ffmpeg

COPY package.json package.json 
COPY .npmrc .npmrc 
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
COPY index.js index.js

ENTRYPOINT [ "node", "./index.js" ]
