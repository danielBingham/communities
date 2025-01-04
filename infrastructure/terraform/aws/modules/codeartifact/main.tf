locals {
  tags = {
    Application = "${var.application}"
    Environment = "${var.environment}"
    Service = "${var.service}"
    Layer = "npm-repository"
  }
}

resource "aws_codeartifact_repository" "this" {
  repository = "${var.application}-${var.environment}-${var.service}"
  domain = var.domain

  description = "Code Artifact repository to act as our private NPM repo."

  dynamic "upstream" {
    for_each = var.upstream_repository_names

    content {
      repository_name = upstream.value
    }
  }

  tags = merge(
    local.tags,
    {
      Resource = "codeartifact.aws_codeartifact_repository.this"
    }
  )

}
