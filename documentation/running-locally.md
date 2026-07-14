# Running Locally

Communities local development environment uses Docker Compose with volume and
entrypoint overrides to allow for hot-reloading during development.

The compose environment currently does *not* build the database image, so you
will need to build and run that image before you can run the
environment.

## Initializing the Database

From the root project directory, build the postgres docker container:

```
$ docker build -t communities-sql database/initialization-scripts
```

## Configuring the Local Environment

The local environment depends on parameters pull from AWS Parameter Store.  You
will need to initialize it with a `.env` file setting the AWS credentials
allowing it to pull the parameters.  You will also need to create all the
required parameters on a path unique to your environment in parameter store.
You can use a path prefixed `/local/<username>` to set your parameters.

**TODO** *This section is currently a stub.  Until this section is completed,
you can examine the parameters on other `/local` paths in order to populate
your environment's parameters.*

## Building the Environment

Before you run the environment, or after changes to `package.json` or
`package-lock.json` (including the version changes made by the release
pipeline), you will need to build the environment.

Before building the environment, you need to retrieve an AWS CodeArtifact
token.

### Authenticating with CodeArtifact

Log in to AWS in your terminal using `aws login`:

```
aws login
```

Retrieve the CodeArtifact token:

```
export CODEARTIFACT_AUTH_TOKEN=`aws codeartifact get-authorization-token --domain communities --domain-owner 843012963492 --query authorizationToken --output text`
```

Log out of AWS in your terminal:

```
aws logout
```

It's a good practice to stay logged out of AWS, except at need, to reduce the
attack surface for NPM supply chain attacks like SHA1-Hulud.

### Building the Environment

To build the whole environment:

```
docker compose build
```

To build individual containers:

```
docker compose build web-application
```

To refresh the environment after a version increment:

```
docker compose build web-application worker
```

## Running the Environment

Once you have your environment initialized and build, you can bring it up using `up`:

```
docker compose up
```

From there, it should automatically reload and recompile with any code changes.
If you make any dependency changes (anything requiring `npm install`) you will
need to rebuild the environment.  That includes changes to any of the
`@communities` package dependencies.  See "Building the Environment".
