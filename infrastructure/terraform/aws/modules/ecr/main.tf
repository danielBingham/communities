locals {
  tags = {
    Application = "${var.application}"
    Environment = "${var.environment}"
    Service = "${var.service}"
    Layer = "docker-repository"
  }
}

resource "aws_ecr_repository" "this" {
  name = "${var.application}-${var.environment}-${var.service}"
  image_tag_mutability = "IMMUTABLE"

  image_scanning_configuration {
    scan_on_push = false 
  }

  tags = merge(
    local.tags,
    {
      Name = "${var.application}-${var.environment}-${var.service}-database-cluster"
      Resource = "ecr.aws_ecr_repository.this"
    }
  )
}
