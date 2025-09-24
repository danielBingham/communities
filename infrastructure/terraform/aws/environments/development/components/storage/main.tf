module "storage" {
  source = "../../../../modules/s3"

  application = "communities" 
  environment = "development" 
  service = "storage" 
}
