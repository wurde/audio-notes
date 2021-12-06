# Define Amazon Certificate Manager resources.
# http://aws.amazon.com/acm

# https://www.terraform.io/docs/providers/aws/r/acm_certificate.html
resource "aws_acm_certificate" "ssl" {
  # A domain name for which the certificate should be issued
  domain_name = var.domain

  # Additional names that are supported by this certificate.
  subject_alternative_names = var.alias_domains

  # Which method to use for validation. DNS or EMAIL are valid.
  validation_method = "DNS"
}

# https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/acm_certificate_validation
resource "aws_acm_certificate_validation" "cert" {
  certificate_arn         = aws_acm_certificate.ssl.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]

  timeouts {
    # Default timeout is 45 minutes.
    # Shorten the time to speed up iteration of the `apply` commands.
    create = "4m"
  }
}
