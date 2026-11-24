# Cron schedules

Terraform manages the cron-job.org jobs that call the bot. The app does not run its own timer. Docker runs Terraform; nothing here is installed on the host.

State is the private Cloudflare R2 bucket `ura-bot-tfstate`, object `cron-jobs/terraform.tfstate`. That file contains the `Authorization` header, so it is not in git.

## GitHub secrets

| Secret | What it is |
|---|---|
| `R2_ACCESS_KEY_ID` | R2 access key. CI maps it to `AWS_ACCESS_KEY_ID`. |
| `R2_SECRET_ACCESS_KEY` | R2 secret key. CI maps it to `AWS_SECRET_ACCESS_KEY`. |
| `CRON_JOB_API_KEY` | cron-job.org API key from the console Settings page. |
| `API_KEY` | The same value the bot checks in the `Authorization` header. Not `Bearer <token>`. |

`CRON_JOB_API_KEY` and `API_KEY` are added by the owner. Leave IP allowlisting off on the cron-job.org key, or GitHub-hosted runners cannot call the API.

For local commands, put the same values in the gitignored `.env`:

```
CRON_JOB_API_KEY=
API_KEY=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

`R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` work as names too.

## Two runners

Make is the laptop. CI does not call it. GitHub Actions call the shell scripts in `scripts/`. Do not point a workflow at Make, and do not have Make call those scripts, to collapse the two. See `AGENTS.md`.

Both use Terraform 1.17.2. `versions.tf` requires that version exactly. The laptop image is `hashicorp/terraform:1.17.2` pinned by digest `sha256:6e9c1e647c31a960dc9b59e13272f9111d90010c10b717f77ffb324767660475`. CI installs that same version on the Ubuntu runner and does not download it from the scripts. The scripts refuse any other version.

## Laptop

From the repo root:

```sh
make tf-fmt
make tf-validate
make shellcheck
make tf-init
make tf-plan
make tf-apply
```

`make tf-fmt CHECK=1` fails when a file needs formatting. `make tf-validate` checks the configuration and does not talk to R2 or cron-job.org. `make shellcheck` lints `scripts/*.sh` with the `koalaman/shellcheck` image. Shellcheck is not part of the Terraform image. `make tf-plan` writes `zarf/infra/tfplan` (gitignored). `make tf-apply` applies that plan. It stops if the plan would delete a job, unless you run `make tf-apply TF_ALLOW_DESTROY=1`. `TF_ALLOW_DESTROY=1` does not override `prevent_destroy` in `jobs.tf`. Removing a job still means dropping that lifecycle block in a reviewed change.

## CI

Fmt and validate run `scripts/fmt-validate.sh`. A same-repo pull request runs `scripts/plan.sh`. A push to `main`, or a manual run, runs `scripts/apply.sh`. A missing `CRON_JOB_API_KEY`, `API_KEY`, or R2 key fails the job.

The Terraform jobs run on `ubuntu-24.04`. `actions/checkout` checks out the repo, and `hashicorp/setup-terraform` installs 1.17.2. `scripts/plan.sh` writes `plan-summary.txt` at the repo root with `jq`. That file lists addresses and actions only, and the plan job comments it on the pull request.

cron-job.org allows one job create per second and five per minute. Plan and apply run with `-parallelism=1`. A 429 fails the job. Re-run it. The apply does not build a new plan on its own.

## Schedules

All times are America/Sao_Paulo. Weekdays are Monday=1 through Friday=5. An empty hours or days list means every value. Each job is POST, enabled, 120 second timeout, and sends `Authorization` from `API_KEY`. Failure and auto-disable notifications are on. The disabled BrlBot console job is not in this file.

| Key | URL | When |
|---|---|---|
| `urabot_stocks` | `/urabot/stocks` | Weekdays at 11:00, 14:00, and 18:00. |
| `urabot_news` | `/urabot/news` | Weekdays at 07:00, 10:00, 13:00, 15:00, 17:00, and 21:00. |
| `urabot_reply_mentions` | `/urabot/reply-mentions` | Every hour at minute 0. |
| `bitcoinmetrx_price` | `/bitcoinmetrx/price` | Every day at 00:00, 04:00, 08:00, 12:00, 16:00, and 20:00. |

Adding a bot is a new entry in the `jobs` map. Shared request settings (POST, timeout, timezone, notifications) live on the resource, not in each entry. Removing a job needs the `prevent_destroy` lifecycle dropped in a reviewed change, then an apply allowed to destroy.
