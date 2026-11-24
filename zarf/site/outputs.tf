output "site_url" {
  description = "HTTPS URL served by CloudFront."
  value       = "https://${local.domain}"
}

output "cloudfront_domain_name" {
  description = "Target of the www CNAME."
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

output "apex_ipv4" {
  description = "Anycast IPv4 addresses published as the apex A records."
  value       = aws_cloudfront_anycast_ip_list.site.anycast_ips
}
