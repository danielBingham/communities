module "storage" {
  source = "../../../../modules/s3"

  domain = "https://localhost:3000/"

  application = "communities" 
  environment = "development" 
  service = "storage" 
}
