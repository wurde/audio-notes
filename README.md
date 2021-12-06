# Audio Notes

A production-ready audio notes app.

It deploys a static web application capable of
transcribing audio recordings. It achieves this
via state-of-the-art speech recognition technology.
The infrastructure is configured using Terraform
and the primary cloud provider is AWS.

The Frontend is a JAMstack site using NextJS. It's
hosted via S3, cached on CloudFront's POP servers,
and served requests via Route53. Cognito handles
user authentication.

Warning: this project deploys services that incur
charges above the Free Tier. It's also important
to follow cybersecurity best practices during
deployment and administration.

## Prerequisites

This project requires:

- An account with Amazon Web Services. This is the
  primary cloud provider where infrastructure is
  deployed to.

- A domain name for routing requests to. This can be
  a root domain (example.com) or a subdomain
  (myapp.example.com). Where the domain is hosted
  shouldn't matter, but Google Domains is recommended.

## Getting Started

Start by setting the required input variables.

```bash
# Add AWS credentials to your environment.
export AWS_ACCESS_KEY_ID=<your access key>
export AWS_SECRET_ACCESS_KEY=<your secret key>

# Set the domain name for the app.
cat ~/infrastructure/terraform.tfvars
#=> auth_domain = "example-audio-notes"
#=> domain = "myapp.example.com"
#=> environment = "production"
```

Review and install dependencies for both the frontend
and backend applications.

```bash
# Backend dependencies
cd ./backend/transcribe && npm install

# Frontend dependencies
cd ./frontend && npm install
```

Then do an initial deployment of our infrastructure
to AWS. Everything wont be successfully deployed
here, because the Frontend app requires some of the
output variables of this initial deployment.

```bash
cd ./infrastructure
terraform init
terraform plan
terraform apply
# Note the first `apply` will not be sufficient.
# You will need to use the `name_server` output and
# run `apply` again. Log into your Domain Name Server
# to add an NS record. Alternatively you can manually
# login to your AWS account, view the Route53 NS
# record, and update your Domain Name Server. This is
# required to validate domain name ownership. It'll
# look something like this:
# 
#   HOST NAME           TYPE  TTL     DATA
#   myapp.example.com.  NS    1 hour  ns-123.awsdns-11.net.
#                                     ns-3211.awsdns-17.co.uk.
#                                     ns-231.awsdns-31.com.
#                                     ns-11.awsdns-39.org.
terraform output
#=> cognito_client_id = "123abclce728bmhk2f4ghdbs6g"
#=> cognito_identity_pool_id = "us-east-1:123abc-d041-394e-2eb6-faea3d88fc2b"
#=> cognito_user_pool_domain = "https://example-audio-notes.auth.us-east-1.amazoncognito.com"
#=> cognito_user_pool_endpoint = "cognito-idp.us-east-1.amazonaws.com/us-east-1_123abcv05"
#=> cognito_user_pool_id = "us-east-1_123abcv05"
#=> name_servers = tolist([
#=>   "ns-123.awsdns-11.net",
#=>   "ns-3211.awsdns-17.co.uk",
#=>   "ns-231.awsdns-31.com",
#=>   "ns-11.awsdns-39.org",
#=> ])
#=> s3_bucket_inputaudio_arn = "arn:aws:s3:::myapp-example-com-inputaudio"
#=> s3_bucket_outputtranscript_arn = "arn:aws:s3:::myapp-example-com-outputtranscript"

# Add NS record to your DNS host (Google Domains).
# Then run the `apply` again.
terraform plan
terraform apply
```

Set the following Frontend variables pulled from the
previous Terraform output.

```bash
vi ./frontend/.env.local
#=> NEXT_PUBLIC_COGNITO_USER_POOL_DOMAIN=https://example-audio-notes.auth.us-east-1.amazoncognito.com
#=> NEXT_PUBLIC_COGNITO_USER_POOL_ENDPOINT=cognito-idp.us-east-1.amazonaws.com/us-east-1_123abcv05
#=> NEXT_PUBLIC_COGNITO_CLIENT_ID=123abclce728bmhk2f4ghdbs6g
#=> NEXT_PUBLIC_COGNITO_CALLBACK_URL=https://myapp.example.com
#=> NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID='us-east-1:123abc-d041-394e-2eb6-faea3d88fc2b'
#=> 
#=> NEXT_PUBLIC_INPUTAUDIO_BUCKET=myapp-example-com-inputaudio
#=> NEXT_PUBLIC_OUTPUTTRANSCRIPT_BUCKET=myapp-example-com-outputtranscript
```

Now we want to build and export the frontend app.

```bash
cd ./frontend
npm run export
#=> ...
#=> Export successful.
#=> Files written to ./frontend/out
```

Run the final Terraform `apply` command to deploy the
Frontend application.

```bash
cd ./infrastructure
terraform plan
terraform apply
```

## License

This project is __FREE__ to use, reuse, remix, and resell.
This is made possible by the [MIT license](/LICENSE).
