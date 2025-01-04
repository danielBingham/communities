output "repository_arn" {
  value = aws_codeartifact_repository.this.arn
}

output "administrator_account" {
  value = aws_codeartifact_repository.this.administrator_account
}
