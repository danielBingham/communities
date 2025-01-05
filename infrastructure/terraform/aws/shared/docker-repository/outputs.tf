output "web_application_repository_url" {
  value = aws_ecr_repository.web_application.repository_url
}

output "web_application_registry_id" {
  value = aws_ecr_repository.web_application.registry_id
}

output "worker_repository_url" {
  value = aws_ecr_repository.worker.repository_url
}

output "worker_registry_id" {
  value = aws_ecr_repository.worker.registry_id 
}
