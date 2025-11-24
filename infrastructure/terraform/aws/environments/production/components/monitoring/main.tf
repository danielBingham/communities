data "terraform_remote_state" "database" {
  backend = "s3"

  config = {
    bucket = "communities-social-terraform-state"
    key = "production/components/database"
    region = "us-east-1"
    use_lockfile = true
  }
}

data "terraform_remote_state" "cluster" {
  backend = "s3"

  config = {
    bucket = "communities-social-terraform-state"
    key = "production/components/cluster"
    region = "us-east-1"
    use_lockfile = true
  }
}

module "sns" {
  source = "../../../../modules/sns"

  alarm_email = var.alarm_email 

  application = "communities"
  environment = "production"
  service = "monitoring"
}

resource "aws_cloudwatch_metric_alarm" "database_cpu_utilization" {
  alarm_name = "${var.application}-${var.environment}-${var.service}-database-cpu-utilization"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods = 2
  metric_name = "CPUUtilization"
  namespace = "AWS/RDS"
  period = 120
  statistic = "Average"
  threshold = 80
  alarm_description = "Monitors average CPU utilization for the database."

  dimensions = {
    DBInstanceIdentifier = data.terraform_remote_state.database.outputs.cluster_primary_instance_id
  }

  alarm_actions = [ module.sns.sns_alarms_arn ]
}

resource "aws_cloudwatch_metric_alarm" "eks_cpu_utilization" {
  for_each = toset(flatten([for resource in data.terraform_remote_state.cluster.outputs.webapp_node_group_resources : [
      for group in resource.autoscaling_groups : group.name
    ]
  ]))

  alarm_name = "${var.application}-${var.environment}-${var.service}-node-cpu-utilization"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods = 2
  metric_name = "CPUUtilization"
  namespace = "AWS/EC2"
  period = 120
  statistic = "Average"
  threshold = 80
  alarm_description = "Monitors average CPU utilization for the EKS webapp nodegroup."

  dimensions = {
    AutoScalingGroupName = each.key 
  }

  alarm_actions = [ module.sns.sns_alarms_arn ]
}

