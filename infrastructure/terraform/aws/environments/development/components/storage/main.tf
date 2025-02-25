module "storage" {
  source = "../../../../modules/s3"

  application = "communities" 
  environment = "development" 
  service = "storage" 
}

module "alan_local" {
  source = "../../../../modules/s3"

  application = "communities" 
  environment = "alan-local" 
  service = "storage" 
}
