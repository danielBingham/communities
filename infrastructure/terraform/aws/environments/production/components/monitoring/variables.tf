variable "alarm_email" {
  description = "The email to send alarms to."
}

variable "aws_config" {
  description = "Path to the AWS config file we want to use."
  default = [ "~/.aws/config" ]
}
variable "aws_credentials" {
  description = "Path to the AWS credentials file we want to use."
  default = [ "~/.aws/credentials" ]
}
variable "aws_profile" {
  description = "AWS profile we want to use."
  default = "terraform"
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
  default = "communities"
}
variable "environment" {
  description = "The name of the environment this module is supporting. eg. production, staging, etc"
  default = "production"
}
variable "service" {
  description = "The name of the service this module is supporting. eg. networking, database, storage, etc" 
  default = "monitoring"
}

