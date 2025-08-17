import { h, render, Fragment } from 'https://unpkg.com/preact@10.19.6/dist/preact.module.js';
import { useEffect, useMemo, useState } from 'https://unpkg.com/preact@10.19.6/dist/preact.module.js/hooks';

/** Sync layer
 * Default: localStorage.
 * To enable realtime sync: fill FIREBASE_CONFIG below and set USE_FIREBASE=true.
 */
const USE_FIREBASE = false; // zet op true na invullen FIREBASE_CONFIG
const FIREBASE_CONFIG = {
  // apiKey: '...',
  // authDomain: '...',
  // projectId: '...',
  // storageBucket: '...',
  // messagingSenderId: '...',
  // appId: '...',
};

let db = null;
async function initFirebaseIfEnabled(){
  if(!USE_FIREBASE) return;
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
  const { getFirestore, doc, getDoc, setDoc, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  const app = initializeApp(FIREBASE_CONFIG);
  db = getFirestore(app);
  return { doc, getDoc, setDoc, onSnapshot };
}

const Storage = {
  async get(key, fallback){
    if(USE_FIREBASE && db){
      const { doc, getDoc, setDoc } = await initFirebaseIfEnabled();
      const ref = doc(db, 'night-notes', key);
      const snap = await getDoc(ref);
      if(snap.exists()) return snap.data().value;
      await setDoc(ref, { value: fallback });
      return fallback;
    }
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  async set(key, val){
    if(USE_FIREBASE && db){
      const { doc, setDoc } = await initFirebaseIfEnabled();
      const ref = doc(db, 'night-notes', key);
      await setDoc(ref, { value: val });
      return;
    }
    localStorage.setItem(key, JSON.stringify(val));
  },
  listen(key, cb){
    if(USE_FIREBASE && db){
      initFirebaseIfEnabled().then(({ doc, onSnapshot })=>{
        const ref = doc(db, 'night-notes', key);
        return onSnapshot(ref, (snap)=>{ if(snap.exists()) cb(snap.data().value); });
      });
      return ()=>{};
    }
    // local fallback: no realtime events
    return ()=>{};
  }
};

async function loadSeed(path) {
  const res = await fetch(path);
  return await res.json();
}

const USERS = [
  { name: "Martijn", password: "123!" },
  { name: "Nuno", password: "123!" },
];

function cls(...xs){ return xs.filter(Boolean).join(' '); }
function formatDate(s){ const d = new Date(s); return d.toLocaleDateString('nl-NL', {year:'numeric', month:'2-digit', day:'2-digit'}); }

function Login({ onLogin }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  function submit(e){
    e.preventDefault();
    const hit = USERS.find(u => u.name.toLowerCase() === name.trim().toLowerCase() && u.password === password);
    if(hit){ onLogin(hit.name); } else { alert('Onjuiste login'); }
  }
  return (
    <div class="card login center">
      <form onSubmit={submit} class="grid" style="min-width:320px; gap:12px;">
        <h2 style="text-align:center;margin:0">Inloggen</h2>
        <input class="input" placeholder="Naam (Martijn/Nuno)" value={name} onInput={e=>setName(e.target.value)} />
        <input class="input" type="password" placeholder="Wachtwoord (123!)" value={password} onInput={e=>setPassword(e.target.value)} />
        <button class="button" type="submit">Login</button>
      </form>
    </div>
  );
}

function Tabs({ current, set }){
  const all = ['Releases','EP Checklist','Streams','Advertentiebeheer'];
  return (
    <div class="tabs">
      {all.map(t => <button class={cls('tab', current===t && 'active')} onClick={()=>set(t)}>{t}</button>)}
    </div>
  );
}

function Releases({ releases, setReleases }){
  const [q, setQ] = useState('');
  const [onlyPending, setOnlyPending] = useState(false);
  const list = useMemo(()=>{
    return (releases||[])
      .filter(r => !q || r.artist?.toLowerCase().includes(q.toLowerCase()))
      .filter(r => !onlyPending || !r.done)
      .sort((a,b)=> new Date(a.date) - new Date(b.date));
  }, [releases, q, onlyPending]);

  function toggleDone(idx){
    const arr = releases.slice();
    arr[idx].done = !arr[idx].done;
    setReleases(arr);
  }

  return (
    <div class="card">
      <div class="row" style="justify-content:space-between; gap:12px; flex-wrap:wrap">
        <div class="row">
          <input class="input" placeholder="Zoek op artiest" value={q} onInput={e=>setQ(e.target.value)} />
          <label class="row"><input type="checkbox" checked={onlyPending} onChange={e=>setOnlyPending(e.target.checked)} style="margin-left:8px" /> Alleen open</label>
        </div>
        <span class="badge">{list.length} releases</span>
      </div>
      <div style="overflow:auto; max-height:60vh; margin-top:8px">
        <table class="table">
          <thead>
            <tr><th>Datum</th><th>Artiest</th><th>Type</th><th>Owner</th><th>Status</th><th>Splits</th><th>Buma/Stemra</th></tr>
          </thead>
          <tbody>
          {list.map((r, i) => (
              <tr>
                <td>{formatDate(r.date)}</td>
                <td>{r.artist}</td>
                <td><span class="badge">{r.type}</span></td>
                <td><span class="badge">{r.owner}</span></td>
                <td>
                  <div class="row">
                    <div class={cls('dot', r.done?'green':'red')}></div>
                    <button class="button ghost" onClick={()=>{ toggleDone(i); }}>{r.done?'Klaar':'Open'}</button>
                  </div>
                </td>
                <td><input type="checkbox" checked={!!r.splits} onChange={e=>{ r.splits = e.target.checked; setReleases(releases.slice()); }}/></td>
                <td><input type="checkbox" checked={!!r.buma} onChange={e=>{ r.buma = e.target.checked; setReleases(releases.slice()); }}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EPChecklist({ user, releases, setReleases }){
  const [artists, setArtists] = useState([]);
  useEffect(()=>{ fetch('./data/artists.json').then(r=>r.json()).then(setArtists); }, []);

  const nextItem = useMemo(()=>{
    const ownership = {};
    for(const a of artists){ ownership[a.name?.toLowerCase()] = (a.owner||'').toLowerCase(); }
    const all = (releases||[])
      .filter(r => !r.done)
      .sort((a,b)=> new Date(a.date)-new Date(b.date));
    for(const r of all){
      const owner = ownership[r.artist?.toLowerCase()] || r.owner?.toLowerCase() || '';
      if(!owner || owner.includes(user.toLowerCase()) || (user.toLowerCase()==='martijn' && r.owner==='ERRY') || (user.toLowerCase()==='nuno' && r.owner==='NUNEAUX')){
        return r;
      }
    }
    return null;
  }, [artists, releases, user]);

  function markReady(){
    if(!nextItem) return;
    if(!nextItem.splits || !nextItem.buma){
      alert('Je moet eerst Splits en Buma/Stemra afvinken.');
      return;
    }
    nextItem.done = true;
    setReleases(releases.slice());
  }

  return (
    <div class="card grid" style="gap:16px">
      <h3 style="margin:0">Jouw volgende EP (op datum)</h3>
      {nextItem ? (
        <div class="grid grid-3">
          <div class="card">
            <div class="row" style="justify-content:space-between">
              <strong>{nextItem.artist}</strong>
              <span class="badge">{formatDate(nextItem.date)}</span>
            </div>
            <div class="row" style="gap:8px;margin-top:8px">
              <label class="row" style="gap:6px"><input type="checkbox" checked={!!nextItem.splits} onChange={e=>{ nextItem.splits=e.target.checked; }}/><span>Splits</span></label>
              <label class="row" style="gap:6px"><input type="checkbox" checked={!!nextItem.buma} onChange={e=>{ nextItem.buma=e.target.checked; }}/><span>Buma/Stemra</span></label>
            </div>
            <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap">
              <a class="button ghost" href="https://distrokid.com/" target="_blank">DistroKid</a>
              <a class="button ghost" href="https://www.amuse.io/" target="_blank">Amuse</a>
              <a class="button ghost" href="https://portal.bumastemra.nl/" target="_blank">Buma/Stemra</a>
              <a class="button ghost" href="#" onclick="alert('Upload je artworks map in de repo / link hier later')">Artworks</a>
            </div>
            <div style="margin-top:10px">
              <button class="button" onClick={markReady}>Markeer als klaar</button>
            </div>
          </div>
        </div>
      ) : <em>Geen open items 🎉</em>}
    </div>
  );
}

function Streams(){
  const [artists, setArtists] = useState([]);
  const [entries, setEntries] = useState([]);
  const [date, setDate] = useState(()=>{
    const d = new Date(); d.setDate(d.getDate()-1);
    return d.toISOString().slice(0,10);
  });
  const [artist, setArtist] = useState('');
  const [count, setCount] = useState('');

  useEffect(()=>{ fetch('./data/artists.json').then(r=>r.json()).then(setArtists); }, []);

  useEffect(()=>{
    (async ()=>{
      const saved = await Storage.get('streams', []);
      setEntries(saved);
      const unlisten = Storage.listen('streams', setEntries);
      return ()=>unlisten && unlisten();
    })();
  }, []);

  async function addEntry(){
    if(!artist || !count) return;
    const next = [...entries, {date, artist, count: Number(count)}];
    setEntries(next);
    await Storage.set('streams', next);
    setCount('');
  }

  useEffect(()=>{
    // draw chart
    const canvas = document.getElementById('chart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width = canvas.clientWidth;
    const h = canvas.height = 240;

    const byDate = new Map();
    for(const e of entries){
      const k = e.date;
      byDate.set(k, (byDate.get(k)||0) + (e.count||0));
    }
    const labels = Array.from([...byDate.keys()]).sort();
    const values = labels.map(k => byDate.get(k));

    ctx.clearRect(0,0,w,h);
    ctx.strokeStyle = '#2a375d';
    ctx.beginPath(); ctx.moveTo(40,10); ctx.lineTo(40,h-30); ctx.lineTo(w-10,h-30); ctx.stroke();

    if(values.length){
      const maxV = Math.max(...values) || 1;
      ctx.strokeStyle = '#6ea8ff';
      ctx.beginPath();
      labels.forEach((lab, i) => {
        const x = 40 + (i*(w-60))/Math.max(labels.length-1,1);
        const y = (h-30) - ((values[i]/maxV)*(h-50));
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      });
      ctx.stroke();
    }
    ctx.fillStyle = '#8fa6d8';
    ctx.font = '12px system-ui';
    labels.forEach((lab, i) => {
      if(i%Math.ceil(labels.length/10)===0){
        const x = 40 + (i*(w-60))/Math.max(labels.length-1,1);
        ctx.fillText(lab.slice(5), x-10, h-12);
      }
    });
  }, [entries]);

  return (
    <div class="grid" style="gap:12px">
      <div class="card grid" style="gap:10px">
        <div class="row" style="gap:8px; flex-wrap:wrap">
          <input class="input" type="date" value={date} onInput={e=>setDate(e.target.value)} />
          <select class="input" value={artist} onInput={e=>setArtist(e.target.value)}>
            <option value="">Kies artiest</option>
            {artists.map(a => <option value={a.name}>{a.name}</option>)}
          </select>
          <input class="input" type="number" min="0" placeholder="Streams (gisteren)" value={count} onInput={e=>setCount(e.target.value)} />
          <button class="button" onClick={addEntry}>Toevoegen</button>
        </div>
        <canvas id="chart" style="width:100%; height:240px"></canvas>
      </div>
      <div class="card" style="overflow:auto; max-height:45vh">
        <table class="table">
          <thead><tr><th>Datum</th><th>Artiest</th><th>Streams</th></tr></thead>
          <tbody>
            {entries.sort((a,b)=> a.date.localeCompare(b.date)).map((e,i)=>(
              <tr><td>{e.date}</td><td>{e.artist}</td><td>{e.count}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Ads(){
  return (
    <div class="card center" style="min-height:30vh">
      <a class="button" href="https://eppplannerpro.netlify.app/" target="_blank">Open Advertentiebeheer</a>
    </div>
  );
}

function App(){
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('Releases');
  const [releases, setReleases] = useState(null);

  useEffect(()=>{
    (async ()=>{
      await initFirebaseIfEnabled();
      const saved = await Storage.get('releases', null);
      if(saved){ setReleases(saved); }
      else {
        const seed = await fetch('./data/releases.json').then(r=>r.json());
        setReleases(seed.releases);
        await Storage.set('releases', seed.releases);
      }
      const unlisten = Storage.listen('releases', setReleases);
      return ()=>unlisten && unlisten();
    })();
  }, []);

  if(!user){ return <Login onLogin={setUser} />; }

  return (
    <Fragment>
      <div class="row" style="justify-content:space-between; margin-bottom:12px">
        <Tabs current={tab} set={setTab} />
        <div class="row" style="gap:8px">
          <span class="badge">Ingelogd: {user}</span>
          <button class="button ghost" onClick={()=>{ setUser(null); }}>Uitloggen</button>
        </div>
      </div>
      {tab==='Releases' && releases && <Releases releases={releases} setReleases={async (val)=>{ setReleases(val); await Storage.set('releases', val); }} />}
      {tab==='EP Checklist' && releases && <EPChecklist user={user} releases={releases} setReleases={async (val)=>{ setReleases(val); await Storage.set('releases', val); }} />}
      {tab==='Streams' && <Streams />}
      {tab==='Advertentiebeheer' && <Ads />}
    </Fragment>
  );
}

render(<App />, document.getElementById('app'));