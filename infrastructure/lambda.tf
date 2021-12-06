# https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_function
resource "aws_lambda_function" "transcribe" {
  # (Required) Unique name for the Lambda Function.
  function_name = "transcribe"

  # (Required) Amazon Resource Name (ARN) of the function's
  # execution role. The role provides the function's identity
  # and access to AWS services and resources.
  role = aws_iam_role.lambda_transcribe.arn

  # Description of what the Lambda Function does.
  description = "Transcribe audio files in S3 using AWS Transcribe."

  # Path to the function's deployment package within the
  # local filesystem. Conflicts with image_uri, s3_bucket,
  # s3_key, and s3_object_version.
  filename = data.archive_file.lambda_transcribe.output_path

  # Used to trigger updates.
  source_code_hash = filebase64sha256(data.archive_file.lambda_transcribe.output_path)

  # Function entrypoint in the code.
  handler = "index.main"

  # Identifier of the function's runtime.
  runtime = "nodejs14.x"

  # Amount of time the Lambda Function has to run in
  # seconds. Defaults to 3. 900 seconds (15 minutes).
  timeout = 4

  # Amount of memory in MB the Lambda Function can use
  # at runtime. Defaults to 128. 128 MB to 10,240 MB,
  # in 1-MB increments.
  memory_size = 128

  # Map of environment variables that are accessible
  # from the function code during execution.
  environment {
    variables = {
      "OUTPUT_BUCKET"        = aws_s3_bucket.output_transcript.bucket
      "DATA_ACCESS_ROLE_ARN" = aws_iam_role.authenticated.arn
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_logs,
    aws_cloudwatch_log_group.transcribe,
  ]
}

# Gives an external source (like an EventBridge Rule, SNS,
# or S3) permission to access the Lambda function.
# https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/lambda_permission
resource "aws_lambda_permission" "allow_s3_bucket" {
  statement_id  = "AllowExecutionFromS3Bucket"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.transcribe.arn
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.input_audio.arn
}
