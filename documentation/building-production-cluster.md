# Building the Production Cluster

Once you've deployed the Cluster through Terraform, you'll need to do some
Kubernetes work to get it running.

The cluster will need the following services installed:

- Cluster Autoscaler: https://github.com/kubernetes/autoscaler
- CertManager: https://cert-manager.io/
- Metrics: https://github.com/kubernetes-sigs/metrics-server
- AWS Load Balancer Controller: https://kubernetes-sigs.github.io/aws-load-balancer-controller/v2.2/

This documentation records the process used to install them at the time of its
writing.  But you'll want to check the documentation for each service for up to
date install and update instructions.

## Metrics Server

Install Metrics Server using the Helm chart, which can be found here: https://artifacthub.io/packages/helm/metrics-server/metrics-server

```
$ helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/
$ helm upgrade --install metrics-server metrics-server/metrics-server
```

## Cluster Autoscaler

Install `cluster-autoscaler` using the helm chart, which can be found here: https://github.com/kubernetes/autoscaler/blob/master/charts/cluster-autoscaler/README.md

```
$ helm repo add autoscaler https://kubernetes.github.io/autoscaler
$ helm install cluster-autoscaler autoscaler/cluster-autoscaler --set autoDiscovery.clusterName=communities-production-cluster-eks-cluster --set awsRegion=us-east-1 -n kube-system
```

You'll then need to annotate the service account created by cluster-autoscaler
with the IAM role created by the terraform.

Check the outputs from `environments/production/components/cluster` for
`cluster_autoscaler_role_arn =
"arn:aws:iam::843012963492:role/communities-production-cluster-cluster-autoscaler-role"`.

Then annotate the serviceaccount:

```
$ kubectl annotate serviceaccount -n kube-system cluster-autoscaler-aws-cluster-autoscaler eks.amazonaws.com/role-arn=arn:aws:iam::843012963492:role/communities-production-cluster-cluster-autoscaler-role
```

After which you'll need to restart the cluster-autoscaler deployment for it to pick up its permissions:

```
$ kubectl rollout restart deployment -n kube-system cluster-autoscaler-aws-cluster-autoscaler
```

## Cert Manager

Install CertManager using the helm chart, which can be found here: https://cert-manager.io/docs/installation/helm/

```
$ helm repo add jetstack https://charts.jetstack.io --force-update
$ helm install \
  cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.16.2 \
  --set crds.enabled=true
```

## AWS Load Balancer Controller

Install AWS Load Balancer Controller using the helm chart, found here: https://github.com/aws/eks-charts/tree/master/stable/aws-load-balancer-controller

We're going to modify the command to set `serviceAccount.create` to true.
We'll annotate the ServiceAccount with our terraform created role after the
fact and then restart the controller.

```
$ helm repo add eks https://aws.github.io/eks-charts
$ helm install aws-load-balancer-controller eks/aws-load-balancer-controller --set clusterName=communities-production-cluster-eks-cluster -n kube-system --set serviceAccount.create=true --set serviceAccount.name=aws-load-balancer-controller
```

Then annotate the serviceaccount:

```
$ kubectl annotate serviceaccount -n kube-system aws-load-balancer-controller eks.amazonaws.com/role-arn=arn:aws:iam::843012963492:role/communities-production-cluster-load-balancer-controller-role
```
