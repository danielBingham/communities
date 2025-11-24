/******************************************************************************
 * Production Database Component
 *
 * This is a component module that only defines the database.  It does
 * not create any of the other infrastructure and depends on a number of other
 * components to have been created first. 
 *
 * Dependencies:
 * - network 
 *
 * See the README.md for more information.
 *
 ******************************************************************************/

data "terraform_remote_state" "network" {
  backend = "s3"

  config = {
    bucket = "communities-social-terraform-state"
    key = "production/components/network"
    region = "us-east-1"
    use_lockfile = true
  }
}

module "database" {
  source = "../../../../modules/rds"

  username = var.username
  password = var.password

  # These come from the output of components/network.
  vpc_id = data.terraform_remote_state.network.outputs.vpc_id 
  subnet_ids = data.terraform_remote_state.network.outputs.private_subnet_ids 

  instance_class = "db.t4g.medium"
  engine_version = "16.8"

  application = "communities" 
  environment = "production" 
  service = "database" 
}
