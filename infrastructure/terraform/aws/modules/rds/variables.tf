
/**
 * Structure and configuration variables.  
 *
 * Used to define the structure and configuration of the resources.
 */
variable "instance_class" {
  description = "The instance class to use with the RDS instance."
  default = "db.t4g.medium"
}

variable "engine_version" {
  description = "The version of postgres we want to deply."
  default = "16.6"
}

/**
 * Optional Snapshot identifier to restore from.
 */
variable "snapshot" {
  description = "The name of a snapshot to restore from."
  default = null
}


/**
 * Credential variables.  
 *
 * Used to set the credentials of the resources.
 */
variable "username" {
  description = "The username of the root user of the database."
}

variable "password" {
  description = "The password of the root user of the database." 
  sensitive = true
}


/**
 * Networking resource Ids.
 *
 * These are required to configure the database's connection to the network.
 */
variable "vpc_id" {
  description = "The id of the VPC the database will be launched into.  Must be VPC the subnet_ids belong to."
}

variable "subnet_ids" {
  description = "The ids of the subnets you want the db instance to be associated with. These should be the private subnet."
  type = list(string)
}

/**
 * Naming variables.  
 *
 * These are used to describe what application, environment,
 * and service this piece of infrastructure is supporting.  They are also used
 * to generate appropriate names and tags for resources.
 */
variable "application" {
  description = "The name of the application this module is supporting. eg. peer-review"
}
variable "environment" {
  description = "The name of the environment this module is supporting. eg. production, staging, etc"
}
variable "service" {
  description = "The name of the service this module is supporting. eg. networking, database, storage, etc" 
}

