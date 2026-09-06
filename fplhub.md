# FPL Hub — project map

Complete reference for features, data flow, and which files own what.

---

## 1. Product overview

FPL Hub is a local Fantasy Premier League companion:

1. A **Node fetcher** pulls official FPL APIs on a schedule.
2. Data is stored in **Aiven MySQL**.
3. A **PHP backend** serves JSON to the browser.
4. An **HTML/CSS/JS frontend** provides the UI.

Core user journeys:

| Journey | Entry | Notes |
|---------|-------|-------|
| Browse season | `frontend/homepage.html` | Matchday + table from DB |
| Register / login | `signup.html` / `login.html` | Password or Google |
| Build squad | `dash.html` | 15 slots → `user_team` |
| Analyse | stats / pvsp / tvst / best* | All read MySQL |

---

## 2. Architecture

```
fantasy.premierleague.com/api
        │
        ▼
 fetcher/ (Node)
   apis/*  →  jobs/*  →  Aiven MySQL
        │
        ▼
 backend/*.php  (PDO + sessions)
        │
        ▼
 frontend/*  (fetch JSON, render UI)
```

### Sync cadence (`fetcher/scheduler.js`)

| Condition | Interval |
|-----------|----------|
| Matchday (fixtures today / live window) | Every **1 minute** |
| Non-matchday | **Once per day** (poll every minute, sync if ≥24h since last) |

---

## 3. Official FPL APIs used

| API | Client file | Writes |
|-----|-------------|--------|
| `GET /bootstrap-static/` | `fetcher/apis/bootstrapStatic.js` | teams, players, gameweeks, phases |
| `GET /fixtures/` | `fetcher/apis/fixtures.js` | fixture rows (home + away perspectives) |
| `GET /event/{id}/live/` | `fetcher/apis/eventLive.js` | `fpl_hub_player_live` |

Orchestrator: `fetcher/syncAll.js`  
Scheduler: `fetcher/scheduler.js`  
Migrate: `fetcher/migrate.js` (runs `sql/*.sql` in order)

### Job writers

| File | Table |
|------|-------|
| `fetcher/jobs/syncTeams.js` | `fpl_hub_team_data` |
| `fetcher/jobs/syncPlayers.js` | `fpl_hub_player_data` |
| `fetcher/jobs/syncGameweeks.js` | `fpl_hub_gw_data` |
| `fetcher/jobs/syncPhases.js` | `fpl_hub_monthly_data` |
| `fetcher/jobs/syncFixtures.js` | `fpl_hub_fixture_data` |
| `fetcher/jobs/syncLive.js` | `fpl_hub_player_live` |

Shared helpers: `fetcher/lib/db.js`, `fetcher/lib/helpers.js`, `fetcher/lib/matchday.js`

---

## 4. SQL migrations (`sql/`)

| File | Purpose |
|------|---------|
| `001_users.sql` | App accounts |
| `002_teams_bootstrap.sql` | Clubs from bootstrap |
| `003_players_bootstrap.sql` | Players / season stats |
| `004_gameweeks_bootstrap.sql` | Events / deadlines / chips |
| `005_phases_bootstrap.sql` | Monthly phases |
| `006_fixtures_api.sql` | Fixtures API rows |
| `007_player_live_api.sql` | Live GW player stats |
| `008_user_team.sql` | User squad picks |
| `009_sync_meta.sql` | Fetcher metadata |

---

## 5. Backend PHP map (`backend/`)

### Config / infra

| File | Role |
|------|------|
| `env.php` | Load `backend/.env` |
| `dbconnect.php` | PDO + SSL to Aiven |
| `config.js` *(frontend)* | Base API/front URLs |
| `sync_status.php` | Meta + row counts JSON |
| `test_db.php` | Connectivity smoke test |
| `composer.json` | `google/apiclient` for OAuth |

### Auth

| File | Role |
|------|------|
| `signup.php` | Create password user |
| `login.php` | Session login |
| `logout.php` | Destroy session → login page |
| `check_username.php` | `taken` / `available` |
| `session.php` | Guard helper |
| `google_config.php` | OAuth client from env |
| `google_login.php` | Redirect to Google |
| `google_callback.php` | OAuth callback → dash or google signup |
| `google_signup.php` | Set username + fantasy team after Google |

### Feature APIs

| File | Used by | Data |
|------|---------|------|
| `dash.php` | Dashboard | `get_team`, `get_players` |
| `save_team.php` | Dashboard | Upsert `user_team` |
| `stats.php` | Stats page | Filtered player rows |
| `pvsp.php` | Player vs player | Player list + stats |
| `tvst.php` | Team vs team | Teams + strength/results |
| `bestplayer.php` | Best player tool | Players + upcoming FDR/strength |
| `bestteam.php` | Best team tool | Teams + upcoming fixtures |
| `teams_list.php` | Stats filter | All clubs |
| `fetch_matchweek.php` | Homepage | Current GW fixtures from DB |
| `fetch_pl_table.php` | Homepage | Standings derived from finished fixtures |

---

## 6. Frontend map (`frontend/`)

### Shared UI

| File | Role |
|------|------|
| `theme.css` | Design tokens, header, tables, buttons |
| `app.css` | Tool-page helpers (compare cards, filters) |
| `auth.css` | Login / signup panels |
| `config.js` | `FPLHUB.api` / `FPLHUB.front` helpers |

### Pages

| Page | JS | CSS | Responsibility |
|------|----|-----|----------------|
| `homepage.html` | `homepage.js` | `homepage.css` | Public landing, matchday, table, tool previews |
| `login.html` | `login.js` | `auth.css` | Password + Google entry |
| `signup.html` | `signup.js` | `auth.css` | Registration + password rules |
| `google_signup.html` | `google_signup.js` | `google_signup.css` | Post-OAuth profile finish |
| `dash.html` | `dash.js` | `dash.css` | Pitch squad builder |
| `stats.html` | `stats.js` | `stats.css` | Player statistics table |
| `pvsp.html` | `pvsp.js` | `pvsp.css` | Multi-player compare |
| `tvst.html` | `tvst.js` | `tvst.css` | Multi-team compare |
| `bestplayer.html` | `bestplayer.js` | `bestplayer.css` | Rank players by fixtures/stat |
| `bestteam.html` | `bestteam.js` | `bestteam.css` | Rank teams by fixtures |
| `aboutus.html` etc. | — | `theme` + `app` | Static legal/about content |

Root `index.html` redirects to `frontend/homepage.html`.

---

## 7. Feature → files cheat sheet

| Feature | Frontend | Backend | DB tables |
|---------|----------|---------|-----------|
| Matchday strip | `homepage.js` | `fetch_matchweek.php` | `fpl_hub_fixture_data`, `fpl_hub_gw_data` |
| League table | `homepage.js` | `fetch_pl_table.php` | fixtures + teams |
| Sign up / login | `signup.js` / `login.js` | `signup.php` / `login.php` | `users` |
| Google auth | `google_*` | `google_*.php` | `users` |
| Squad pick/save | `dash.js` | `dash.php`, `save_team.php` | `user_team`, `fpl_hub_player_data` |
| Stats | `stats.js` | `stats.php`, `teams_list.php` | players, teams |
| PvP | `pvsp.js` | `pvsp.php` | players |
| TvT | `tvst.js` | `tvst.php` | teams, fixtures |
| Best player/team | `best*.js` | `best*.php` | players, teams, fixtures |
| Live points store | fetcher live job | — | `fpl_hub_player_live` |

---

## 8. Environment variables (`backend/.env`)

| Key | Purpose |
|-----|---------|
| `DB_HOST` `DB_PORT` `DB_NAME` `DB_USER` `DB_PASS` | Aiven MySQL |
| `DB_SSL_CA` | Path to `certs/ca.pem` |
| `GOOGLE_CLIENT_ID` / `SECRET` / `REDIRECT_URI` | Login OAuth |

Never commit `.env`, `credentials.json`, `token.json`, or `*.pem`.

---

## 9. Local ops commands

```powershell
# Schema
cd fetcher; npm run migrate

# One-off sync
npm run sync

# Continuous scheduler
npm start

# Apache site
http://localhost/fpl_hub/
http://localhost/fpl_hub/backend/sync_status.php
```

---

## 10. Demo users (seeded for docs)

| Username | Password | Team |
|----------|----------|------|
| `demo_manager` | `Demo@1234` | Pitchside XI |
| `test_captain` | `Test@1234` | Night Watch FC |
| `scout_analyst` | `Scout@1234` | Green Notebook |

---

## 11. Design notes

- Daylight “Saturday briefing” theme: turf green, condensed athletic type (Barlow Condensed + Figtree)
- Homepage uses full-bleed photography for the hero
- Navigation only lists shipped features (no dead predictor links)

---

## 12. Docs assets

| Path | Contents |
|------|----------|
| `README.md` | Setup, screenshots, demo users |
| `fplhub.md` | This file |
| `assets/*.png` | UI captures for README |
| `FPL HUB ER.drawio` / `SCHEMA.drawio` | Original ER sketches (historical) |
