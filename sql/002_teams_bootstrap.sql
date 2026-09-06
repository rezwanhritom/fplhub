-- Source API: GET /api/bootstrap-static/ → teams[]
CREATE TABLE IF NOT EXISTS fpl_hub_team_data (
  team_id INT UNSIGNED NOT NULL COMMENT 'Official FPL team id',
  team_name VARCHAR(100) NOT NULL,
  season_id VARCHAR(16) NOT NULL DEFAULT '',
  short_form VARCHAR(10) NOT NULL DEFAULT '',
  strength INT NOT NULL DEFAULT 0,
  strength_home INT NOT NULL DEFAULT 0,
  strength_away INT NOT NULL DEFAULT 0,
  strength_home_att INT NOT NULL DEFAULT 0,
  strength_away_att INT NOT NULL DEFAULT 0,
  strength_home_def INT NOT NULL DEFAULT 0,
  strength_away_def INT NOT NULL DEFAULT 0,
  pyfy VARCHAR(16) NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (team_id),
  KEY idx_team_name (team_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
