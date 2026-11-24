# Static site

Terraform publishes `web/` at <https://uraniumstockbot.com>. The domain stays registered at GoDaddy. This stack does not buy or transfer it, and it does not change the cron-job.org stack in `zarf/infra/`.

Docker runs Terraform on a laptop. Nothing here is installed on the host.

## What is in front of S3

Viewers use HTTPS on CloudFront. CloudFront presents an ACM certificate in `us-east-1` for `uraniumstockbot.com` and `www.uraniumstockbot.com`, and redirects HTTP to HTTPS.

The origin is the public S3 website endpoint. The bucket `ura-bot-uraniumstockbot` allows `s3:GetObject` for everyone. CloudFront reads that endpoint over HTTP, which is the only protocol the S3 website endpoint speaks. The account's "Block all public access" setting has to allow this bucket policy.

GoDaddy has no alias record, and a CNAME is not valid at the zone apex. CloudFront allocates three Anycast static IPv4 addresses (`ip_count = 3`) and the apex A records point at them. `www` is a CNAME to the distribution. ACM validation CNAMEs are written in the same GoDaddy zone. The distribution uses price class `PriceClass_All` and leaves IPv6 off, which is what an IPv4-only Anycast list requires.

AWS bills those IPv4 addresses by the hour. Check the current CloudFront price before the first apply. Some older pages still quote a flat monthly fee for Anycast lists. Creating the list can also fail until Anycast static IPs are enabled on the account.

`prevent_destroy` is set on the bucket. `make site-tf-apply` and `scripts/apply.sh` refuse a plan that deletes anything unless `TF_ALLOW_DESTROY=1`. That flag does not override `prevent_destroy`.

## State

State is the private Cloudflare R2 bucket `ura-bot-tfstate`, object `site/terraform.tfstate`. The cron stack uses a different object in that bucket. State is not in git.

The backend uses a credentials profile named `r2`. The AWS provider uses a profile named `site`. The laptop targets and the CI scripts write those profiles to a temporary file and delete it afterward. They do not put either secret on the Terraform command line, and they do not default a missing secret to an empty string.

## GitHub secrets

Add these in the repository settings. The workflow maps each one to an environment variable of the same name.

| Secret | What it is |
|---|---|
| `SITE_AWS_ACCESS_KEY_ID` | AWS access key that can manage this S3 bucket, CloudFront, ACM, and the Anycast IP list. |
| `SITE_AWS_SECRET_ACCESS_KEY` | Secret key for that AWS user. |
| `GODADDY_API_KEY` | Production GoDaddy API key with DNS access for `uraniumstockbot.com`. |
| `GODADDY_API_SECRET` | GoDaddy API secret. |
| `R2_ACCESS_KEY_ID` | Existing R2 key. State only. |
| `R2_SECRET_ACCESS_KEY` | Existing R2 secret. State only. |

Do not reuse the R2 key as `SITE_AWS_ACCESS_KEY_ID`. Locally, `AWS_ACCESS_KEY_ID` is still the R2 key used by `make tf-*`.

For local commands, put the values in the gitignored `.env` (see `.env.example`).

## Two runners

Make is the laptop. CI does not call it. GitHub Actions call the shell scripts in `scripts/`. Do not point a workflow at Make, and do not have Make call those scripts. See `AGENTS.md`.

Both use Terraform 1.17.2. `versions.tf` requires that version exactly. The AWS provider is pinned to 6.74.0 and the GoDaddy provider to `alikor/godaddy` 0.3.3. The laptop image is the same `hashicorp/terraform:1.17.2` pin as `zarf/infra`. CI installs that version on the Ubuntu runner and does not download it from the scripts. The scripts refuse any other version.

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

`make site-tf-fmt CHECK=1` fails when a file needs formatting. `make site-tf-validate` checks the configuration and does not talk to AWS, GoDaddy, or R2. `make site-tf-plan` writes `zarf/site/tfplan` (gitignored). `make site-tf-apply` applies that plan.

## CI

`.github/workflows/terraform-site.yml` runs when `zarf/site/`, `web/`, or that workflow changes. Fmt and validate run `scripts/fmt-validate.sh`. A same-repo pull request runs `scripts/plan.sh` and comments the addresses and actions on the pull request. A push to `main`, or a manual run, runs `scripts/apply.sh`. A missing R2 key, site AWS key, or GoDaddy key fails the job.

The page files uploaded to S3 are `web/index.html`, `web/styles.css`, and `web/main.js`.
