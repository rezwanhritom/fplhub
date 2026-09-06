-- Source API: GET /api/bootstrap-static/ → phases[]
CREATE TABLE IF NOT EXISTS fpl_hub_monthly_data (
  month_id INT UNSIGNED NOT NULL,
  name VARCHAR(64) NOT NULL,
  season_id VARCHAR(16) NOT NULL DEFAULT '',
  start_gw INT UNSIGNED NULL,
  stop_gw INT UNSIGNED NULL,
  highest_point INT NULL,
  pyfy VARCHAR(16) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (month_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
