# Communities Backend

## Building an Deploying

Log in to CodeArtifact:

```
export CODEARTIFACT_AUTH_TOKEN=`aws codeartifact get-authorization-token --domain communities --domain-owner 843012963492 --query authorizationToken --output text`
```

Run NPM version:

```
npm version [version]
```

Run NPM publish:

```
npm publish
```
