output "cron_jobs" {
  description = "cron-job.org ids for the managed jobs. Header values are not output."
  value = {
    for key, job in cronjoborg_job.bot : key => {
      job_id  = job.job_id
      title   = job.title
      url     = job.url
      enabled = job.enabled
    }
  }
}
