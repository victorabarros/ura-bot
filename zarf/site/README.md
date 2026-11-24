# Static site

Terraform publishes `web/` at <https://uraniumstockbot.com>. The domain stays registered in the Squarespace account that already holds it. This stack does not buy or transfer it, and it does not change the cron-job.org stack in `zarf/infra/`.

Docker runs Terraform on a laptop. Nothing here is installed on the host.

## What is in front of S3

Viewers use HTTPS on CloudFront. CloudFront presents an ACM certificate in `us-east-1` for `uraniumstockbot.com` and `www.uraniumstockbot.com`, and redirects HTTP to HTTPS. IPv6 is on. The price class stays `PriceClass_All`.

The origin is the public S3 website endpoint. The bucket `ura-bot-uraniumstockbot` allows `s3:GetObject` for everyone. CloudFront reads that endpoint over HTTP, which is the only protocol the S3 website endpoint speaks. The account's "Block all public access" setting has to allow this bucket policy.

Squarespace DNS can point the apex at a hostname with an ALIAS record, so this stack does not allocate CloudFront Anycast static IPv4 addresses. The IAM user does not need `cloudfront:CreateAnycastIpList`.

`prevent_destroy` is set on the bucket. `make site-tf-apply` and `scripts/apply.sh` refuse a plan that deletes anything unless `TF_ALLOW_DESTROY=1`. That flag does not override `prevent_destroy`.

## DNS in Squarespace

Terraform does not change DNS. Squarespace documents ALIAS, A, AAAA, and CNAME records in the domain dashboard, and a CNAME cannot use `@`. There is no DNS API on the account that holds this domain: the Squarespace reseller API is a partner API and its record types do not include ALIAS. Do not script the logged-in dashboard.

Add the records under the domain's DNS settings, Custom records. Turn DNSSEC off first. Squarespace refuses the ALIAS record while DNSSEC is on. Delete the Squarespace default records if they already occupy `@` or `www`.

`terraform output squarespace_dns_records` prints the rows. The CloudFront hostname is assigned when the distribution is created. The ACM name and data were assigned when `aws_acm_certificate.site` was created and are already in the state. Do not add a trailing dot.

| Name | Type | Data |
|---|---|---|
| `@` | ALIAS | CloudFront domain name, such as `d111111abcdef8.cloudfront.net` |
| `www` | CNAME | The same CloudFront domain name |
| Host from each ACM option, relative to `uraniumstockbot.com` | CNAME | The ACM validation value, a name ending in `acm-validations.aws` |

An ACM name of `_abc.uraniumstockbot.com` is entered as `_abc`. An ACM name of `_abc.www.uraniumstockbot.com` is entered as `_abc.www`. Apply waits on `aws_acm_certificate_validation.site` until those CNAMEs resolve, and the distribution is created after the certificate is issued. Add the ACM rows before the apply on `main`.

## State

State is the private Cloudflare R2 bucket `ura-bot-tfstate`, object `site/terraform.tfstate`. The cron stack uses a different object in that bucket. State is not in git.

The backend uses a credentials profile named `r2`. The AWS provider uses a profile named `site`. The laptop targets and the CI scripts write those profiles to a temporary file and delete it afterward. They do not put either secret on the Terraform command line, and they do not default a missing secret to an empty string.

## GitHub secrets

Add these in the repository settings. The workflow maps each one to an environment variable of the same name.

| Secret | What it is |
|---|---|
| `SITE_AWS_ACCESS_KEY_ID` | AWS access key that can manage this S3 bucket, CloudFront, and ACM. |
| `SITE_AWS_SECRET_ACCESS_KEY` | Secret key for that AWS user. |
| `R2_ACCESS_KEY_ID` | Existing R2 key. State only. |
| `R2_SECRET_ACCESS_KEY` | Existing R2 secret. State only. |

Do not reuse the R2 key as `SITE_AWS_ACCESS_KEY_ID`. Locally, `AWS_ACCESS_KEY_ID` is still the R2 key used by `make tf-*`.

For local commands, put the values in the gitignored `.env` (see `.env.example`).

## Two runners

Make is the laptop. CI does not call it. GitHub Actions call the shell scripts in `scripts/`. Do not point a workflow at Make, and do not have Make call those scripts. See `AGENTS.md`.

Both use Terraform 1.17.2. `versions.tf` requires that version exactly. The AWS provider is pinned to 6.74.0. The laptop image is the same `hashicorp/terraform:1.17.2` pin as `zarf/infra`. CI installs that version on the Ubuntu runner and does not download it from the scripts. The scripts refuse any other version.

## Laptop

From the repo root:

```sh
make site-tf-fmt
make site-tf-validate
make shellcheck
make site-tf-init
make site-tf-plan
make site-tf-apply
```

`make site-tf-fmt CHECK=1` fails when a file needs formatting. `make site-tf-validate` checks the configuration and does not talk to AWS or R2. `make site-tf-plan` writes `zarf/site/tfplan` (gitignored). `make site-tf-apply` applies that plan.

## CI

`.github/workflows/terraform-site.yml` runs when `zarf/site/`, `web/`, or that workflow changes. Fmt and validate run `scripts/fmt-validate.sh`. A same-repo pull request runs `scripts/plan.sh` and comments the addresses and actions on the pull request. A push to `main`, or a manual run, runs `scripts/apply.sh`. A missing R2 key or site AWS key fails the job.

The page files uploaded to S3 are `web/index.html`, `web/styles.css`, and `web/main.js`.
