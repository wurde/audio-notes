variable "auth_domain" {
  type        = string
  description = "Configure the domain for your Hosted UI and OAuth 2.0 endpoints."
}

variable "domain" {
  type        = string
  description = "The primary domain name that serves the frontend application."
}

variable "alias_domains" {
  type        = list(string)
  description = "The other alias domain names (www.example.com)."
  default     = []
}

variable "environment" {
  type        = string
  description = "The environment. Defaults to 'production'."
  default     = "production"
}
