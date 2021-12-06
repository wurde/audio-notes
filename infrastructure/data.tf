# https://registry.terraform.io/providers/hashicorp/archive/latest/docs/data-sources/archive_file
# Generates an archive from content, a file, or a directory.
#
# NOTE: If your function depends only on standard libraries,
# or AWS SDK libraries, you don't need to include these
# libraries in your .zip file. These libraries are included
# with the supported Lambda runtime environments.
data "archive_file" "lambda_transcribe" {
  type = "zip"

  source_dir  = "${path.module}/../backend/transcribe"
  output_path = "${path.module}/../backend/transcribe.zip"
}
