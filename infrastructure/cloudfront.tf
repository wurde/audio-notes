# Define CloudFront resources.
# https://www.terraform.io/docs/providers/aws/r/cloudfront_distribution.html

locals {
  s3_domain_id = "s3-domain-origin"
}

resource "aws_cloudfront_origin_access_identity" "default" {}

# https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudfront_distribution
# This can take several minutes to create.
resource "aws_cloudfront_distribution" "cdn" {
  # Enable the distribution.
  enabled = true

  # The price class for this distribution. (PriceClass_All, PriceClass_200, PriceClass_100)
  price_class = "PriceClass_All"

  # An origin for this distribution (multiple allowed).
  origin {
    # The DNS domain name of your origin.
    domain_name = aws_s3_bucket.domain.bucket_regional_domain_name

    # A unique identifier for the origin.
    origin_id = local.s3_domain_id

    s3_origin_config {
      # https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html
      origin_access_identity = aws_cloudfront_origin_access_identity.default.cloudfront_access_identity_path
    }
  }

  # Extra CNAMEs for this distribution. Whitelisting Route 53 alias records.
  aliases = concat([var.domain], var.alias_domains)

  # The default cache behavior for this distribution (maximum one).
  default_cache_behavior {
    # Which HTTP methods CloudFront processes and forwards to your origin.
    allowed_methods = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]

    # Which HTTP methods CloudFront caches responses from your origin.
    cached_methods = ["GET", "HEAD"]

    # The value of ID for the origin that you want CloudFront to route requests
    #   to when a request matches the path pattern either for a cache behavior or for the
    #   default cache behavior.
    target_origin_id = local.s3_domain_id

    # The minimum amount of time that you want objects to stay in CloudFront
    #   caches before CloudFront queries your origin to see whether the object has been
    #   updated. Defaults to 1 year.
    min_ttl = 31536000

    # The default amount of time (in seconds) that an object is in a CloudFront
    #   cache before CloudFront forwards another request in the absence of an Cache-Control
    #   max-age or Expires header. Defaults to 10 years.
    default_ttl = 315360000

    # The maximum amount of time (in seconds) that an object is in a CloudFront
    #   cache before CloudFront forwards another request to your origin to determine whether
    #   the object has been updated. Defaults to 100 years.
    max_ttl = 3153600000

    # Whether you want CloudFront to automatically compress content for web
    #   requests that include Accept-Encoding: gzip in the request header (default: false).
    compress = true

    # Use this element to specify the protocol that users can use to access files.
    #   One of allow-all, https-only, or redirect-to-https.
    viewer_protocol_policy = "redirect-to-https"

    # The forwarded values configuration that specifies how CloudFront handles
    #   query strings, cookies and headers (maximum one). It's recommended to configure
    #   CloudFront to cache based on parameters that have the smallest combination of possible
    #   values to reduce the number of requests that CloudFront must forward to the origin.
    forwarded_values {
      # Indicates whether you want CloudFront to forward query strings to the
      #   origin that is associated with this cache behavior.
      query_string = false

      # The forwarded values cookies that specifies how CloudFront handles cookies.
      cookies {
        forward = "none"
      }
    }
  }

  # Restrictions for this distribution.
  restrictions {
    geo_restriction {
      # The method to restrict distribution of your content. (blacklist | whitelist)
      restriction_type = "blacklist"

      # List of ISO 3166-1-alpha-2 codes.
      # https://www.iso.org/iso-3166-country-codes.html
      locations = ["IR", "KP"]
    }
  }

  # The SSL configuration for this distribution (maximum one).
  viewer_certificate {
    # The ARN of the AWS Certificate Manager certificate that you wish to use with this distribution.
    acm_certificate_arn = aws_acm_certificate.ssl.arn

    # The minimum version of the SSL protocol that you want CloudFront to use for HTTPS connections.
    minimum_protocol_version = "TLSv1"

    # Specifies how you want CloudFront to serve HTTPS requests.
    ssl_support_method = "sni-only"
  }

  # The object to return when an user requests the root URL.
  default_root_object = "index.html"

  # Whether the IPv6 is enabled for the distribution.
  is_ipv6_enabled = true

  depends_on = [aws_acm_certificate.ssl]
}
