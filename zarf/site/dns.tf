resource "godaddy_dns_record_set" "acm" {
  for_each = {
    for dvo in aws_acm_certificate.site.domain_validation_options : dvo.resource_record_name => dvo
  }

  domain = local.domain
  name   = trimsuffix(trimsuffix(each.value.resource_record_name, "."), ".${local.domain}")
  type   = each.value.resource_record_type
  records = [{
    data = trimsuffix(each.value.resource_record_value, ".")
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
