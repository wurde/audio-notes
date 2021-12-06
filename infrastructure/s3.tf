# Define S3 resources.
# https://aws.amazon.com/s3

/**
 * Resources for the Frontend.
 */

# https://www.terraform.io/docs/providers/aws/r/s3_bucket.html
resource "aws_s3_bucket" "domain" {
  # The name of the bucket.
  bucket = local.bucket_name

  # The canned ACL to apply. Defaults to "private".
  #   https://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html#canned-acl
  acl = "public-read"

  # Configure your bucket as a static website. It'll be available
  #   at the AWS Region-specific website endpoint of the bucket.
  #   http://bucket-name.s3-website-Region.amazonaws.com
  website {
    index_document = "index.html"
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  # All objects (including locked) are deleted when deleting a bucket.
  force_destroy = true
}

# Create a policy to control access to the S3 bucket.
# https://awspolicygen.s3.amazonaws.com/policygen.html
resource "aws_s3_bucket_policy" "domain_policy" {
  bucket = aws_s3_bucket.domain.id

  policy = <<POLICY
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Action": "s3:GetObject",
            "Principal": "*",
            "Resource": [
                "arn:aws:s3:::${local.bucket_name}/*"
            ]
        }
    ]
}
POLICY
}

resource "aws_s3_bucket_object" "dist" {
  for_each = fileset(local.dist_dir, "**")

  acl    = "public-read"
  bucket = aws_s3_bucket.domain.id
  key    = each.value
  source = "${local.dist_dir}/${each.value}"
  etag   = filemd5("${local.dist_dir}/${each.value}")

  content_type = lookup(local.mime_types, split(".", each.value)[length(split(".", each.value)) - 1])
}

/**
 * Resources for the Backend.
 */

# https://www.terraform.io/docs/providers/aws/r/s3_bucket.html
resource "aws_s3_bucket" "input_audio" {
  bucket = "${local.bucket_name}-inputaudio"
  acl    = "private"

  # Cross-origin resource sharing (CORS) defines a way for
  # client web applications that are loaded in one domain to
  # interact with resources in a different domain. With CORS
  # support, you can build rich client-side web applications
  # with S3 and selectively allow cross-origin access to your
  # S3 resources.
  #
  # https://docs.aws.amazon.com/AmazonS3/latest/userguide/ManageCorsUsing.html
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = var.environment == "production" ? ["https://${var.domain}"] : ["https://${var.domain}", "http://localhost:3000"]
    expose_headers  = ["Content-Length", "Content-Type", "ETag"]
    # Specifies the amount of time in seconds that the
    # browser caches an S3 response to a preflight OPTIONS
    # request for the specified resource. By caching the
    # response, the browser does not have to send preflight
    # requests to S3 if the request will be repeated.
    max_age_seconds = 3000
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  # https://docs.aws.amazon.com/AmazonS3/latest/userguide/mpu-abort-incomplete-mpu-lifecycle-config.html
  # Delete incomplete multipart uploads after 1 day.
  lifecycle_rule {
    id      = "abortmultipartuploads"
    enabled = true

    # Specifies the number of days after initiating a
    # multipart upload when the multipart upload must be
    # completed.
    abort_incomplete_multipart_upload_days = 1
  }

  lifecycle_rule {
    id      = "archive"
    enabled = true

    transition {
      days          = 15
      storage_class = "DEEP_ARCHIVE"
    }
  }

  force_destroy = true
}

resource "aws_s3_bucket_policy" "inputaudio_policy" {
  bucket = aws_s3_bucket.input_audio.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "FederatedReadWrite"
        Effect = "Allow"
        Action = "s3:*"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        },
        Resource = [
          "${aws_s3_bucket.input_audio.arn}/*",
        ]
      }
    ]
  })
}

# Use the Amazon S3 Event Notifications feature to receive
# notifications when certain events happen in your S3 bucket.
#
# https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/s3_bucket_notification
resource "aws_s3_bucket_notification" "bucket_notification" {
  bucket = aws_s3_bucket.input_audio.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.transcribe.arn
    events              = ["s3:ObjectCreated:CompleteMultipartUpload"]
  }

  depends_on = [aws_lambda_permission.allow_s3_bucket]
}

resource "aws_s3_bucket" "output_transcript" {
  bucket = "${local.bucket_name}-outputtranscript"
  acl    = "private"

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = var.environment == "production" ? ["https://${var.domain}"] : ["https://${var.domain}", "http://localhost:3000"]
    expose_headers  = ["Content-Length", "Content-Type", "ETag"]
    max_age_seconds = 3000
  }

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }

  lifecycle_rule {
    id      = "archive"
    enabled = true

    transition {
      days          = 91
      storage_class = "DEEP_ARCHIVE"
    }
  }

  force_destroy = true
}

resource "aws_s3_bucket_policy" "outputtranscript_policy" {
  bucket = aws_s3_bucket.output_transcript.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "FederatedReadWrite"
        Effect = "Allow"
        Action = "s3:*"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        },
        Resource = [
          "${aws_s3_bucket.output_transcript.arn}/*"
        ]
      }
    ]
  })
}
