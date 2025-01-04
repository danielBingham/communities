/******************************************************************************
 * Docker Repository 
 *
 * Defines an ECR Docker repository to store our containers.
 *
 ******************************************************************************/

module "repository" {
  source = "../../modules/ecr"

  application = "communities" 
  environment = "shared" 
  service = "docker-repository" 
}
