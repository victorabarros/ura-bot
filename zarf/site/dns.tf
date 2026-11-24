locals {
  # These two names are known at plan time. resource_record_name is not, so it
  # cannot be a for_each key.
  certificate_domains = toset([
    local.domain,
    "www.${local.domain}",
  ])

  acm_validation_records = {
    for name in local.certificate_domains : name => one([
      for option in aws_acm_certificate.site.domain_validation_options : option
      if trimsuffix(option.domain_name, ".") == name
    ])
  }
}

resource "godaddy_dns_record_set" "acm" {
  for_each = local.certificate_domains

  domain = local.domain
  name = trimsuffix(
    trimsuffix(local.acm_validation_records[each.value].resource_record_name, "."),
    ".${local.domain}",
  )
  type = local.acm_validation_records[each.value].resource_record_type
  records = [{
    data = trimsuffix(local.acm_validation_records[each.value].resource_record_value, ".")
    ttl  = 600
  }]
}

resource "godaddy_dns_record_set" "apex" {
  domain = local.domain
  name   = "@"
  type   = "A"
  records = [
    for ip in aws_cloudfront_anycast_ip_list.site.anycast_ips : {
      data = ip
      ttl  = 600
    }
  ]
}

resource "godaddy_dns_record_set" "www" {
  domain = local.domain
  name   = "www"
  type   = "CNAME"
  records = [{
    data = aws_cloudfront_distribution.site.domain_name
    ttl  = 600
  }]
}
