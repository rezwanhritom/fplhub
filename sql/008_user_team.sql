-- User fantasy squad picks (app feature, not FPL API)
CREATE TABLE IF NOT EXISTS user_team (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  player_id INT UNSIGNED NOT NULL,
  position ENUM('GKP','DEF','MID','FOR') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_player (user_id, player_id),
  KEY idx_user_team_user (user_id),
  CONSTRAINT fk_user_team_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_team_player FOREIGN KEY (player_id) REFERENCES fpl_hub_player_data (player_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
