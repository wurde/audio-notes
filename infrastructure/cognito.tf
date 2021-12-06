# https://aws.amazon.com/cognito
#
# Cognito has user pools and identity pools. User pools are
# for maintaining users and identity pools are for generating
# temporary AWS credentials using several web identities
# including Cognito user identity.
#
# We create a user pool in Cognito and associated it to an
# identity pool. Identity pool provides credentials to both
# authenticated and unauthenticated users based on associated
# IAM roles and policies. Now any valid user in our Cognito
# user pool can get temporary AWS credentials using the
# associated identity pool and use these temporary
# credentials to directly upload files to S3.

# https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cognito_user_pool
resource "aws_cognito_user_pool" "main" {
  # (Required) Name of the user pool.
  name = "main"

  # (Optional) Multi-Factor Authentication (MFA) configuration.
  mfa_configuration = "OFF"

  admin_create_user_config {
    allow_admin_create_user_only = true
  }

  # Whether username case sensitivity will be applied.
  username_configuration {
    case_sensitive = false
  }

  password_policy {
    # (Optional) Minimum length of the password.
    minimum_length = 6

    # (Optional) Require at least one uppercase letter.
    require_uppercase = true

    # (Optional) Require at least one lowercase letter.
    require_lowercase = true

    # (Optional) Require at least one symbol.
    require_symbols = true

    # (Optional) Require at least one number.
    require_numbers = true

    # (Optional) The number of days a temporary password is valid. If the user
    # does not sign-in during this time, their password will need to be reset
    # by an administrator.
    temporary_password_validity_days = 1
  }

  account_recovery_setting {
    recovery_mechanism {
      name     = "admin_only"
      priority = 1
    }
  }
}

# https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cognito_user_pool_domain
resource "aws_cognito_user_pool_domain" "main" {
  # (Required) The domain string.
  domain       = var.auth_domain
  user_pool_id = aws_cognito_user_pool.main.id
}

# You can customize the Hosted UI experience. You can upload
# a custom logo image to be displayed in the app. You can
# also use cascading style sheets.
#
# https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-app-ui-customization.html
# https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cognito_user_pool_ui_customization
resource "aws_cognito_user_pool_ui_customization" "styles" {
  css = ".background-customizable {background-color: #EEEEE1;}"

  user_pool_id = aws_cognito_user_pool.main.id
}

# https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cognito_user_pool_client
resource "aws_cognito_user_pool_client" "browser" {
  # (Required) Name of the application client.
  name = "browser"

  # (Required) User pool the client belongs to.
  user_pool_id = aws_cognito_user_pool.main.id

  # Should an application secret be generated? Using a client
  # secret with client-side authentication, such as the
  # JavaScript SDK, is not secure and not recommended for a
  # production app client. Client secrets should only be used
  # by applications that have a server-side authentication
  # component so that it can secure the client secret.
  #generate_secret = true
  generate_secret = false

  # (Optional) Whether the client is allowed to follow the
  # Auth protocol when interacting with Cognito user pools.
  allowed_oauth_flows_user_pool_client = true

  # (Optional) List of allowed OAuth flows (code,
  # implicit, and/or client_credentials).
  #
  # An OAuth 2.0 grant type specifies the methods that can
  # be used to issue an access token to a client app.
  # Cognito supports three types of OAuth 2.0 grants:
  # authorization code grants, implicit grants, and client
  # credential grants.
  #
  #   authorization `code` grant - Amazon Cognito issues a
  #   code to the client. The client can redeem this token
  #   at your domain's token endpoint for access, ID, and
  #   refresh tokens. Only authorization code grants can
  #   return refresh tokens.
  #
  #   `implicit` grant - Amazon Cognito issues access and ID
  #   tokens directly to the client. Implicit grants expose
  #   tokens directly to the user. You can't issue refresh
  #   tokens for this grant type.
  #
  #   `client_credentials` grant - Amazon Cognito issues an
  #   access token directly to the client for
  #   machine-to-machine token exchange. You must use a
  #   client secret, and have a custom scope configured,
  #   to use this grant type. You can't use an implict or
  #   authorization code grant type at the same time as a
  #   client credential grant.
  allowed_oauth_flows = ["implicit"]

  # (Optional) List of allowed OAuth scopes (phone, email,
  # openid, profile, and/or aws.cognito.signin.user.admin).
  allowed_oauth_scopes = ["openid", "email", "profile"]

  # (Optional) List of allowed callback URLs for the identity providers.
  # Enter at least one callback URL to redirect the user
  # back to after authentication. This is typically the URL
  # for the app receiving the authorization code issued by
  # Cognito. You may use HTTPS URLs, as well as custom URL
  # schemes.
  #
  # Length of callback URL must be between 1 and 1024
  # characters. Valid characters are letters, marks,
  # numbers, symbols, and punctuations. Cognito requires
  # HTTPS over HTTP except for http://localhost for
  # testing purposes only. App callback URLs such as
  # myapp://example are also supported. Must not contain
  # a fragment.
  callback_urls = var.environment == "production" ? ["https://${var.domain}"] : ["https://${var.domain}", "http://localhost:3000"]

  # Enter at least one sign-out URL. The sign-out URL is
  # a redirect page sent by Cognito when your application
  # signs users out. This is needed only if you want
  # Cognito to direct signed-out users to a page other
  # than the callback URL.
  #logout_urls = [
  #  "http://localhost:3000",
  #]

  # (Optional) List of provider names for the identity
  # providers that are supported on this client. The
  # following are supported: COGNITO, Facebook, Google
  # and LoginWithAmazon.
  supported_identity_providers = ["COGNITO"]
}

# Identity pools are used to store end user identities.
# https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cognito_identity_pool
resource "aws_cognito_identity_pool" "main" {
  # (Required) - The Cognito Identity Pool name.
  identity_pool_name = "main"

  # (Required) - Whether the identity pool supports
  # unauthenticated logins or not.
  allow_unauthenticated_identities = false

  # Configure your Cognito Identity Pool to accept users
  # federated with your Cognito User Pool by supplying the
  # User Pool ID and the App Client ID.
  cognito_identity_providers {
    # The client ID for the Cognito Identity User Pool.
    # For example: 230opj50hs1ll2bcomphn4e41e
    client_id = aws_cognito_user_pool_client.browser.id

    # The provider name for an Cognito Identity User Pool.
    # For example: cognito-idp.us-east-1.amazonaws.com/us-east-1_L7qn4Mn6U
    provider_name = aws_cognito_user_pool.main.endpoint

    # Whether server-side token validation is enabled for
    # the identity provider’s token or not.
    server_side_token_check = false
  }
}

# Provides an AWS Cognito Identity Pool Roles Attachment.
# https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cognito_identity_pool_roles_attachment
resource "aws_cognito_identity_pool_roles_attachment" "main" {
  # (Required) - An identity pool ID in the format REGION:GUID.
  identity_pool_id = aws_cognito_identity_pool.main.id

  roles = {
    "authenticated"   = aws_iam_role.authenticated.arn
    "unauthenticated" = aws_iam_role.unauthenticated.arn
  }
}
