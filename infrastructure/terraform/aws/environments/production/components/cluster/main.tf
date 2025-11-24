/******************************************************************************
 * Production Cluster Component
 *
 * This is a component module that only defines the Kubernetes Cluster.  It does
 * not create any of the other infrastructure and depends on a number of other
 * components to have been created first.  
 *
 * Direct Dependencies:
 * - network
 * - database
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

module "cluster" {
  source = "../../../../modules/eks"

  vpc_id = data.terraform_remote_state.network.outputs.vpc_id 
  private_subnet_ids = data.terraform_remote_state.network.outputs.private_subnet_ids
  public_subnet_ids = data.terraform_remote_state.network.outputs.public_subnet_ids

  control_plane_version = "1.33"
  node_group_version = "1.33"

  application = "communities" 
  environment = "production" 
  service = "cluster"
}

