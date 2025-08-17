# Night Notes – EP Planner (Sync Ready)

**Login:** Martijn / `123!` — Nuno / `123!`

## Wat zit erin?
- Releases (ERRY + NUNEAUX + Muted Mind/Swooshy/Motionless/Loomy + ADHD) **samengevoegd** in één lijst
- EP Checklist: Splits + Buma/Stemra verplicht vóór "Klaar"
- Streams: handmatige tracker met grafiek
- Advertentiebeheer: link-knop

## Data
- `data/releases.json` bevat alle releases van **24-08-2025 t/m 31-12-2026**
- ADHD: om de dag vanaf 25-08-2025
- Extra blokken: ma/di — afwisselend week Muted Mind/Swooshy ↔ week Motionless/Loomy
- Core (dagelijks): ERRY en NUNEAUX artiesten uit je CSV, om-en-om per dag

## Realtime sync (optioneel, super simpel)
1. Maak een Firebase project → Firestore Database (in test mode)  
2. Vul `FIREBASE_CONFIG` in `app.js` (bovenaan)  
3. Zet `USE_FIREBASE = true`  
Daarna staan alle wijzigingen realtime in Firestore (document keys: `releases`, `streams`).

## Gebruik
Open `index.html` in je browser (of upload naar Netlify).