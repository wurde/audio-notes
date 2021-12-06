# Configure the AWS provider
# https://registry.terraform.io/providers/hashicorp/aws
provider "aws" {
  region = local.aws_region
}
