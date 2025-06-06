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

module "cluster" {
  source = "../../../../modules/eks"

  vpc_id = var.vpc_id
  private_subnet_ids = var.private_subnet_ids
  public_subnet_ids = var.public_subnet_ids

  control_plane_version = "1.31"
  node_group_version = "1.31"

  application = "communities" 
  environment = "production" 
  service = "cluster"
}

