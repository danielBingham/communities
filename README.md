# Communities 

A non-profit, cooperative social media platform that aims to build communities
of geography and interests.

## Deploy

Log in to CodeArtifact:

```
export CODEARTIFACT_AUTH_TOKEN=`aws codeartifact get-authorization-token --domain communities --domain-owner 843012963492 --query authorizationToken --output text`
```

Login to ECR:

```
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 843012963492.dkr.ecr.us-east-1.amazonaws.com
```

### Build the Web Application

Build the image:
```
docker build --secret id=CODEARTIFACT_AUTH_TOKEN -t web-application:[version] web-application 
```

Tag the image with the repository:
```
docker tag web-application:[version] 843012963492.dkr.ecr.us-east-1.amazonaws.com/communities/web-application:[version]
```

Push the image:
```
docker push 843012963492.dkr.ecr.us-east-1.amazonaws.com/communities/web-application:[version]
```

### Build the Worker

Build the image:
```
docker build --secret id=CODEARTIFACT_AUTH_TOKEN -t worker:[version] worker 
```

Tag the image with the repository:
```
docker tag worker:[version] 843012963492.dkr.ecr.us-east-1.amazonaws.com/communities/worker:[version]
```

Push the image:
```
docker push 843012963492.dkr.ecr.us-east-1.amazonaws.com/communities/worker:[version]
```
