output "name_servers" {
  value       = aws_route53_zone.domain.name_servers
  description = "A list of name servers associated with the Route53 Hosted Zone."
}

output "cognito_user_pool_id" {
  value       = aws_cognito_user_pool.main.id
  description = "The user pool ID."
}

output "cognito_user_pool_domain" {
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${local.aws_region}.amazoncognito.com"
  description = "The Cognito user pool domain."
}

output "cognito_user_pool_endpoint" {
  value       = aws_cognito_user_pool.main.endpoint
  description = "Endpoint name of the user pool."
}

output "cognito_client_id" {
  value       = aws_cognito_user_pool_client.browser.id
  description = "Client ID of the user pool client."
}

output "cognito_identity_pool_id" {
  value       = aws_cognito_identity_pool.main.id
  description = "The identity pool ID in the format REGION:GUID."
}

output "s3_bucket_inputaudio_arn" {
  value       = aws_s3_bucket.input_audio.arn
  description = "The ARN of the input audio bucket."
}

output "s3_bucket_outputtranscript_arn" {
  value       = aws_s3_bucket.output_transcript.arn
  description = "The ARN of the output transcript bucket."
}
