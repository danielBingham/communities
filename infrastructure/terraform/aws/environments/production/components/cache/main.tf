/********************************************************************
 * Production Cache Component
 *
 * This is a component module that only defines the Redis cache.  It does not
 * create any of the other infrastructure and depends on a number of other
 * components to have been created first. 
 *
 * Dependencies:
 * - network
 *
 * See the README.md for more information.
 *
 * ******************************************************************/

data "terraform_remote_state" "network" {
  backend = "s3"

  config = {
    bucket = "communities-social-terraform-state"
    key = "production/components/network"
    region = "us-east-1"
    use_lockfile = true
  }
}


module "elasticache" {
  source = "../../../../modules/elasticache"

  # These come from the output of components/network.
  vpc_id = data.terraform_remote_state.network.outputs.vpc_id 
  subnet_ids = data.terraform_remote_state.network.outputs.private_subnet_ids 

  engine_version = "7.0"
  parameter_group_name = "default.redis7"

  application = "communities" 
  environment = "production" 
  service = "cache" 
}
