# NIGHTNOTESPLAN — GitHub-only deploy

**Wat jij doet:**
1) Verwijder alle oude files uit je repo (of overschrijf ze).
2) Upload de **inhoud** van deze zip naar de **root** van je repo:
   - `index.html`
   - `netlify.toml`
   - `dist/index.html`  ← fallback als jouw Netlify op `dist` staat
3) Commit. Netlify (connected op GitHub) deployt automatisch.

**Waarom dit werkt:**
- `index.html` bevat ALLES (HTML + CSS + JS + data) → geen extra files nodig.
- We leveren **ook** `dist/index.html`. Dus als jouw Netlify per ongeluk `publish=dist` gebruikt, werkt het óók.

**Na deploy:**
- Homepage toont direct het **login**-scherm (Martijn / 123!, Nuno / 123!).
