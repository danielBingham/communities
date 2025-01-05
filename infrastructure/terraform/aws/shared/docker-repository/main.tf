/******************************************************************************
 * Docker Repository 
 *
 * Defines an ECR Docker repository to store our containers.
 *
 ******************************************************************************/
locals {
  tags = {
    Application = "communities"
    Environment = "shared"
    Service = "docker-repository"
    Layer = "container"
  }
}

resource "aws_ecr_repository" "web_application" {
  name = "communities/web-application"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = false 
  }

  tags = merge(
    local.tags,
    {
      Name = "communities/web-application"
      Resource = "docker-repository.aws_ecr_repository.web_application"
    }
  )
}

resource "aws_ecr_repository" "worker" {
  name = "communities/worker"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = false 
  }

  tags = merge(
    local.tags,
    {
      Name = "communities/worker"
      Resource = "docker-repository.aws_ecr_repository.worker"
    }
  )
}
