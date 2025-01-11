# Communities 

A non-profit, cooperative social media platform that aims to build communities
of geography and interests.

## Deploy

Login to ECR:

```
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 843012963492.dkr.ecr.us-east-1.amazonaws.com
```

Build the image:
```
docker build -t web-application:[version] web-application
```

Tag the image with the repository:
```
docker tag web-application:[version] 843012963492.dkr.ecr.us-east-1.amazonaws.com/communities/web-application
```

Push the image:
```
docker push 843012963492.dkr.ecr.us-east-1.amazonaws.com/communities-shared-docker-repository:[version]
```
