# Night Notes – EP Planner (Deploy Handleiding)

## Stap 1 — Upload naar GitHub (root)
Upload de **inhoud** van deze map (niet de zip zelf) naar de **root** van je repo:
- index.html
- main.js
- netlify.toml
- assets/styles.css
- data/releases.json
- data/artists.json

GitHub web UI: **Add file → Upload files** → sleep de mappen **assets/** en **data/** + de bestanden hierboven. Commit.

## Stap 2 — Netlify instellingen
- Site settings → Build & deploy:
  - Branch: `main`
  - Base directory: *(leeg laten)*
  - Build command: *(leeg laten)*
  - Publish directory: `.` (punt)

## Stap 3 — Cache legen en redeployen
Netlify → **Deploys** → **Clear cache and deploy site**.

## Test-URLs (moeten 200 OK geven)
- /main.js
- /data/releases.json
- /data/artists.json

Als één van deze 404 geeft, dan staan de bestanden niet in de root of is de publish directory geen `.`.