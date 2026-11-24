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

## Commands

From the repo root:

```sh
make tf-fmt
make tf-validate
make tf-init
make tf-plan
make tf-apply
```

`make tf-fmt CHECK=1` fails when a file needs formatting. `make tf-validate` checks the configuration and does not talk to R2 or cron-job.org. `make tf-plan` writes `zarf/infra/tfplan` (gitignored). `make tf-apply` applies that plan. It stops if the plan would delete a job, unless you run `make tf-apply TF_ALLOW_DESTROY=1`.

cron-job.org allows one job create per second and five per minute. Plan and apply run with `-parallelism=1`. If a create returns HTTP 429, apply waits and plans again (up to five tries). A saved plan is stale after a partial apply, so the retry builds a new plan. Jobs already in state are left as they are.

`make tf-import ADDR='cronjoborg_job.bot["urabot_stocks"]' ID=12345` is available, but provider 1.1.2 cannot import. This cutover creates new jobs instead.

## Schedules

All times are America/Sao_Paulo. Weekdays are Monday=1 through Friday=5. An empty hours or days list means every value. Each job is POST, enabled, 120 second timeout, and sends `Authorization` from `API_KEY`. Failure and auto-disable notifications are on. The disabled BrlBot console job is not in this file.

| Key | URL | When |
|---|---|---|
| `urabot_stocks` | `/urabot/stocks` | Weekdays at 11:00, 14:00, and 18:00. |
| `urabot_news` | `/urabot/news` | Weekdays at 07:00, 10:00, 13:00, 15:00, 17:00, and 21:00. |
| `urabot_reply_mentions` | `/urabot/reply-mentions` | Every hour at minute 0. |
| `bitcoinmetrx_price` | `/bitcoinmetrx/price` | Every day at 00:00, 04:00, 08:00, 12:00, 16:00, and 20:00. |

Adding a bot is a new entry in the `jobs` map. Removing one needs the `prevent_destroy` lifecycle dropped in a reviewed change, then an apply allowed to destroy.

## Cutover

1. Read `make tf-plan`. The first plan should only add the four jobs. Do not apply a plan that deletes or disables something you still need.
2. `make tf-apply` creates those jobs already enabled. The old console jobs stay enabled too, so both can fire until step 3.
3. In the cron-job.org console, disable each old job that calls the same URL. Do that before the next scheduled minute. Leave the new jobs enabled.
4. After a new job has succeeded once, you can delete the old disabled job from the console. Terraform will not delete it for you.

Merging to `main` runs the same plan and apply in GitHub Actions once the four secrets exist. Until `CRON_JOB_API_KEY` and `API_KEY` are set, that job skips. After you add them, start **Terraform** from the Actions tab (`workflow_dispatch`) or push a commit on `main`.
