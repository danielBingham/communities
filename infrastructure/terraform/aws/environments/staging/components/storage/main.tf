module "s3" {
  source = "../../../../modules/s3"

  application = "communities" 
  environment = "staging" 
  service = "storage" 
}
