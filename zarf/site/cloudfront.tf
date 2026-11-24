resource "aws_acm_certificate" "site" {
  domain_name               = local.domain
  subject_alternative_names = ["www.${local.domain}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_acm_certificate_validation" "site" {
  certificate_arn         = aws_acm_certificate.site.arn
  validation_record_fqdns = [for record in aws_acm_certificate.site.domain_validation_options : record.resource_record_name]

  depends_on = [godaddy_dns_record_set.acm]
}

# GoDaddy has no apex alias. Three static IPv4 addresses let the apex A
# records point at this distribution. PriceClass_All is required for that
# list, and IPv6 stays off because the list is IPv4-only.
resource "aws_cloudfront_anycast_ip_list" "site" {
  name     = "uraniumstockbot-apex"
  ip_count = 3
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  is_ipv6_enabled     = false
  comment             = local.domain
  price_class         = "PriceClass_All"
  default_root_object = "index.html"
  aliases             = [local.domain, "www.${local.domain}"]
  anycast_ip_list_id  = aws_cloudfront_anycast_ip_list.site.id

  origin {
    domain_name = aws_s3_bucket_website_configuration.site.website_endpoint
    origin_id   = "s3-website"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "s3-website"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    cache_policy_id        = local.cache_policy_id
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.site.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
