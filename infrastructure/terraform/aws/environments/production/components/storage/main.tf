module "storage" {
  source = "../../../../modules/s3"

  application = "communities" 
  environment = "production" 
  service = "storage" 
}
