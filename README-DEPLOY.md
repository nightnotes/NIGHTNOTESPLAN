# NIGHTNOTESPLAN — Repo Pack (1-klik Netlify)

Upload **deze 3 bestanden** naar de root van je GitHub repo:
- `site.zip`
- `unpack.sh`
- `netlify.toml`

En verder niks.

## Netlify
Netlify leest `netlify.toml`:
- Build command: `bash ./unpack.sh` → dit pakt `site.zip` uit naar `dist/`
- Publish directory: `dist/`

Ga daarna naar Netlify → Deploys → **Clear cache and deploy site**.

## Test-URLs
Na deploy moeten deze werken:
- `/main.js`
- `/data/releases.json`
- `/data/artists.json`

Als dit werkt zie je direct de **login**.