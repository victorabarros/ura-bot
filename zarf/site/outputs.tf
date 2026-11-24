output "site_url" {
  description = "HTTPS URL served by CloudFront."
  value       = "https://${local.domain}"
}

output "cloudfront_domain_name" {
  description = "Squarespace ALIAS and www CNAME target."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID."
  value       = aws_cloudfront_distribution.site.id
}

output "bucket_name" {
  description = "Public S3 bucket CloudFront reads."
  value       = aws_s3_bucket.site.bucket
}

output "squarespace_dns_records" {
  description = "Custom records to add for uraniumstockbot.com in Squarespace. DNSSEC must be off before the ALIAS record can be saved."
  value = concat(
    [
      {
        name = "@"
        type = "ALIAS"
        data = aws_cloudfront_distribution.site.domain_name
      },
      {
        name = "www"
        type = "CNAME"
        data = aws_cloudfront_distribution.site.domain_name
      },
    ],
    [
      for option in aws_acm_certificate.site.domain_validation_options : {
        name = trimsuffix(trimsuffix(option.resource_record_name, "."), ".${local.domain}")
        type = option.resource_record_type
        data = trimsuffix(option.resource_record_value, ".")
      }
    ],
  )
}
