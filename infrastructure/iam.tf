# https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role
resource "aws_iam_role" "authenticated" {
  # (Optional) Name of the role. If omitted, Terraform will
  # assign a random, unique name.
  name = "CognitoAuthenticated"

  # (Required) Policy that grants an entity permission to
  # assume the role.
  #
  # AWS Security Token Service (STS) is used to generate
  # temporary credentials. Calling AssumeRoleWithWebIdentity
  # does not require the use of AWS security credentials.
  # Therefore, you can distribute an application that
  # requests temporary security credentials without
  # including long-term AWS credentials in the application.
  # https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRoleWithWebIdentity.html
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCognito"
        Effect = "Allow"
        Action = "sts:AssumeRoleWithWebIdentity"
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        },
        Condition = {
          StringEquals = {
            "cognito-identity.amazonaws.com:aud" = "${aws_cognito_identity_pool.main.id}"
          },
          "ForAnyValue:StringLike" = {
            "cognito-identity.amazonaws.com:amr" = "authenticated"
          }
        }
      },
      {
        Sid    = "AllowTranscribe"
        Effect = "Allow"
        Action = "sts:AssumeRole"
        Principal = {
          Service = "transcribe.amazonaws.com"
        },
      }
    ]
  })

  # (Optional) Maximum session duration (in seconds).
  max_session_duration = 7200 // 2 hours
}

# Provides an IAM role inline policy.
# https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/iam_role_policy
resource "aws_iam_role_policy" "authenticated_policy" {
  name = "CognitoAuthenticated_Policy"
  role = aws_iam_role.authenticated.id

  # JSON Element Reference
  # https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_elements.html
  #
  # The 'Action' element describes the specific action or
  # actions that will be allowed or denied.
  #
  # The 'Resource' element specifies the object or objects that
  # the statement covers. You specify a resource using an ARN.
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ListObjects"
        Effect = "Allow"
        Action = "s3:ListBucket"
        Resource = [
          "${aws_s3_bucket.input_audio.arn}",
          "${aws_s3_bucket.output_transcript.arn}"
        ]
      },
      {
        Sid    = "ReadWriteDeleteObjects"
        Effect = "Allow"
        Action = "s3:*"
        Resource = [
          "${aws_s3_bucket.input_audio.arn}/*",
          "${aws_s3_bucket.output_transcript.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role" "unauthenticated" {
  name = "CognitoUnauthenticated"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Federated = "cognito-identity.amazonaws.com"
        },
        "Condition" : {
          "StringEquals" : {
            "cognito-identity.amazonaws.com:aud" : "${aws_cognito_identity_pool.main.id}"
          },
          "ForAnyValue:StringLike" : {
            "cognito-identity.amazonaws.com:amr" : "unauthenticated"
          }
        }
      }
    ]
  })

  inline_policy {
    policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyAll",
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*"
    }
  ]
}
EOF
  }
}

resource "aws_iam_role" "lambda_transcribe" {
  name = "LambdaTranscribe"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
EOF
}

resource "aws_iam_policy" "lambda_logging" {
  name        = "lambda_logging"
  path        = "/"
  description = "IAM policy for logging from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*",
      "Effect": "Allow"
    }
  ]
}
EOF
}
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_transcribe.name
  policy_arn = aws_iam_policy.lambda_logging.arn
}

resource "aws_iam_policy" "lambda_transcribe" {
  name        = "lambda_transcribe"
  path        = "/"
  description = "IAM policy for creating a transcription job from a lambda"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "transcribe:StartTranscriptionJob",
      "Resource": "*",
      "Effect": "Allow",
      "Condition": {
        "StringEquals": {
          "transcribe:OutputBucketName": "${aws_s3_bucket.output_transcript.bucket}"
        }
      }
    }
  ]
}
EOF
}
resource "aws_iam_role_policy_attachment" "lambda_transcribe" {
  role       = aws_iam_role.lambda_transcribe.name
  policy_arn = aws_iam_policy.lambda_transcribe.arn
}

# The Lambda execution role should be able to pass the
# IAM role to Amazon Transcribe.
resource "aws_iam_policy" "lambda_passrole" {
  name        = "lambda_passrole"
  path        = "/"
  description = "IAM policy to allow passing an IAM role to Amazon Transcribe."

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": ["iam:GetRole", "iam:PassRole"],
      "Resource": "${aws_iam_role.authenticated.arn}",
      "Effect": "Allow"
    }
  ]
}
EOF
}
resource "aws_iam_role_policy_attachment" "lambda_passrole" {
  role       = aws_iam_role.lambda_transcribe.name
  policy_arn = aws_iam_policy.lambda_passrole.arn
}
