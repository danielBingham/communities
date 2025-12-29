
data "terraform_remote_state" "network" {
  backend = "s3"

  config = {
    bucket = "communities-social-terraform-state"
    key = "production/components/network"
    region = "us-east-1"
    use_lockfile = true
  }
}

module "bastion" {
  count = length(data.terraform_remote_state.network.outputs.public_subnet_ids)
  
  source = "../../../../modules/bastion"

  vpc_id = data.terraform_remote_state.network.outputs.vpc_id 
  subnet_id = data.terraform_remote_state.network.outputs.public_subnet_ids[count.index]
  public_key_path = var.public_key_path

  application = "communities" 
  environment = "production" 
  service = "network" 
}

