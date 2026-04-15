# Database migrations

## JobRadar (PostgreSQL)

Run in order:

1. `001_job_radar_enums.sql`
2. `002_job_radar_core_tables.sql`
3. `003_job_radar_indexes.sql`
4. `004_job_radar_outbox.sql`
5. `005_job_radar_cleanup_jobs.sql`

The main app stack in this repo uses **MySQL + Drizzle** elsewhere; these files are **PostgreSQL-shaped** reference migrations for JobRadar. Port enums to `VARCHAR`/`CHECK` or lookup tables if you implement JobRadar on MySQL.
