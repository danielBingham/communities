locals {
  tags = {
    Application = "communities"
    Environment = "shared"
    Service = "npm-repository"
    Layer = "npm-repository"
  }
}

resource "aws_codeartifact_domain" "this" {
  domain = "communities" 
  
  tags = merge(
    local.tags,
    {
      Resource = "npm-repository.aws_codeartifact_domain.this"
    }
  )
}

resource "aws_codeartifact_repository" "npm" {
  repository = "npm-store" 
  domain = aws_codeartifact_domain.this.domain

  description = "Code Artifact repository to act as a mirror of the public NPM repos."

  external_connections {
    external_connection_name = "public:npmjs"
  }

  tags = merge(
    local.tags,
    {
      Resource = "npm-repository.aws_codeartifact_repository.npm"
    }
  )
}

module "repository" {
  source = "../../modules/codeartifact"

  domain = aws_codeartifact_domain.this.domain
  upstream_repository_names = [ aws_codeartifact_repository.npm.repository ]

  application = "communities" 
  environment = "shared" 
  service = "npm-repository" 
}

