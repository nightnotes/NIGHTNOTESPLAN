# NIGHTNOTESPLAN — GitHub-only deploy

## Wat jij doet (alleen GitHub)
1) Ga naar je repo → **Add file → Upload files**.
2) Verwijder oude bestanden óf overschrijf ze.
3) Upload de **inhoud** van deze zip (de drie bestanden hieronder) in de **root** van je repo en **Commit**:
   - `index.html`
   - `netlify.toml`
   - `dist/index.html`  ← extra kopie, voor het geval je Netlify publish-dir op `dist` staat

## Netlify
- Netlify is gekoppeld aan GitHub; na je commit komt er automatisch een deploy.
- Als je handmatig wilt forceren: **Deploys → Clear cache and deploy site**.

## Klaar
- Ga naar je site → je ziet het login-scherm (Martijn / 123!, Nuno / 123!)
- Alles (HTML+CSS+JS+data) zit in `index.html` — geen extra bestanden nodig.
