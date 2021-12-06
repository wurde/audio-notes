# Define locals.
# https://www.terraform.io/docs/configuration/locals.html

locals {
  aws_region  = "us-east-1"
  mime_types  = jsondecode(file("${path.module}/mime.json"))
  bucket_name = replace(var.domain, ".", "-")
  dist_dir    = "${path.module}/../frontend/out"
}
