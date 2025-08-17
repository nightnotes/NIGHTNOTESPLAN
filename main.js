
(function(){
  const USERS = [
    { name: "Martijn", password: "123!" },
    { name: "Nuno", password: "123!" },
  ];

  const $ = (sel, ctx=document) => ctx.querySelector(sel);
  const $$ = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));
  const fmt = (s) => new Date(s).toLocaleDateString('nl-NL',{year:'numeric',month:'2-digit',day:'2-digit'});

  const Storage = {
    get(key, fallback){ try{ return JSON.parse(localStorage.getItem(key)) ?? fallback }catch{ return fallback } },
    set(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
  };

  const state = {
    user: Storage.get('user', null),
    releases: null,
    artists: [],
    tab: 'Releases',
    streams: Storage.get('streams', []),
  };

  function viewLogin(){
    const wrap = document.createElement('div');
    wrap.className = 'card login center';
    wrap.innerHTML = `
      <form class="grid" style="min-width:320px; gap:12px;">
        <h2 style="text-align:center;margin:0">Inloggen</h2>
        <input class="input" name="name" placeholder="Naam (Martijn/Nuno)" />
        <input class="input" name="pass" type="password" placeholder="Wachtwoord (123!)" />
        <button class="button" type="submit">Login</button>
      </form>`;
    wrap.querySelector('form').addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = e.target.name.value.trim();
      const pass = e.target.pass.value;
      const hit = USERS.find(u=>u.name.toLowerCase()===name.toLowerCase() && u.password===pass);
      if(hit){ state.user = hit.name; Storage.set('user', state.user); render(); }
      else alert('Onjuiste login');
    });
    return wrap;
  }

  function tabs(){
    const div = document.createElement('div');
    div.className = 'tabs';
    ['Releases','EP Checklist','Streams','Advertentiebeheer'].forEach(t=>{
      const b = document.createElement('button');
      b.className = 'tab' + (state.tab===t?' active':'');
      b.textContent = t;
      b.onclick = ()=>{ state.tab = t; renderBody(); };
      div.appendChild(b);
    });
    return div;
  }

  function headerBar(){
    const row = document.createElement('div');
    row.className = 'row';
    row.style.cssText = 'justify-content:space-between; margin-bottom:12px';
    row.appendChild(tabs());
    const right = document.createElement('div');
    right.className = 'row';
    right.style.gap = '8px';
    right.innerHTML = `<span class="badge">Ingelogd: ${state.user}</span>`;
    const out = document.createElement('button');
    out.className = 'button ghost';
    out.textContent = 'Uitloggen';
    out.onclick = ()=>{ state.user=null; Storage.set('user', null); render(); };
    right.appendChild(out);
    row.appendChild(right);
    return row;
  }

  
function releasesView(){
  const card = document.createElement('div');
  card.className = 'card';
  const header = document.createElement('div');
  header.className = 'row';
  header.style.cssText = 'justify-content:space-between; gap:12px; flex-wrap:wrap';

  // LEFT FILTERS
  const left = document.createElement('div'); left.className='row';
  const search = document.createElement('input'); search.className='input'; search.placeholder='Zoek op artiest';

  const only = document.createElement('input'); only.type='checkbox'; only.style.marginLeft='8px';
  const label = document.createElement('label'); label.className='row'; label.textContent=' Alleen open'; label.prepend(only);

  const upcoming = document.createElement('input'); upcoming.type='checkbox'; upcoming.style.marginLeft='8px';
  const l2 = document.createElement('label'); l2.className='row'; l2.textContent=' Alleen aankomend'; l2.prepend(upcoming);

  const ownerSel = document.createElement('select'); ownerSel.className='input';
  ['Alle owners','ERRY','NUNEAUX','ADHD','EXTRA'].forEach(v=>{ const o=document.createElement('option'); o.value=v; o.text=v; ownerSel.appendChild(o); });

  const typeSel = document.createElement('select'); typeSel.className='input';
  ['Alle types','Core','Extra','ADHD Sleep'].forEach(v=>{ const o=document.createElement('option'); o.value=v; o.text=v; typeSel.appendChild(o); });

  const from = document.createElement('input'); from.type='date'; from.className='input';
  const to = document.createElement('input'); to.type='date'; to.className='input';

  left.appendChild(search);
  left.appendChild(label);
  left.appendChild(l2);
  left.appendChild(ownerSel);
  left.appendChild(typeSel);
  left.appendChild(from);
  left.appendChild(to);

  // RIGHT: actions
  const right = document.createElement('div'); right.className='row';
  const count = document.createElement('span'); count.className='badge'; count.textContent='0 releases';
  const exportBtn = document.createElement('button'); exportBtn.className='button ghost'; exportBtn.textContent='Export JSON';
  const importBtn = document.createElement('button'); importBtn.className='button ghost'; importBtn.textContent='Import JSON';
  right.appendChild(exportBtn);
  right.appendChild(importBtn);
  right.appendChild(count);

  header.appendChild(left); header.appendChild(right);
  card.appendChild(header);

  // Add form
  const form = document.createElement('div'); form.className='card'; form.style.margin='12px 0';
  form.innerHTML = `
    <div class="row" style="gap:8px; flex-wrap:wrap">
      <strong>Nieuwe release:</strong>
      <input class="input" type="date" name="date"/>
      <input class="input" placeholder="Artiest" name="artist"/>
      <select class="input" name="type">
        <option>Core</option><option>Extra</option><option>ADHD Sleep</option>
      </select>
      <select class="input" name="owner">
        <option>ERRY</option><option>NUNEAUX</option><option>ADHD</option><option>EXTRA</option>
      </select>
      <button class="button" name="add">Toevoegen</button>
    </div>
  `;
  form.querySelector('[name=add]').onclick = ()=>{
    const date = form.querySelector('[name=date]').value;
    const artist = form.querySelector('[name=artist]').value.trim();
    const type = form.querySelector('[name=type]').value;
    const owner = form.querySelector('[name=owner]').value;
    if(!date || !artist){ alert('Datum en artiest verplicht'); return; }
    state.releases.push({date, artist, spotifyId: null, type, owner, done:false, splits:false, buma:false});
    Storage.set('releases', state.releases); redraw();
    form.querySelector('[name=artist]').value='';
  };
  card.appendChild(form);

  // TABLE
  const scroller = document.createElement('div'); scroller.style.cssText='overflow:auto; max-height:60vh; margin-top:8px';
  const table = document.createElement('table'); table.className='table';
  table.innerHTML = `<thead><tr><th>Datum</th><th>Artiest</th><th>Type</th><th>Owner</th><th>Status</th><th>Splits</th><th>Buma/Stemra</th></tr></thead><tbody></tbody>`;
  const tbody = table.querySelector('tbody');
  scroller.appendChild(table);
  card.appendChild(scroller);

  function weekKey(dateStr){
    const d = new Date(dateStr);
    const onejan = new Date(d.getFullYear(),0,1);
    const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay()+1)/7);
    return `${d.getFullYear()}-W${String(week).padStart(2,'0')}`;
  }

  function insertWeekRow(label){
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="7"><strong>${label}</strong></td>`;
    tr.style.background = '#0b132a'; tr.style.position='sticky'; tr.style.top='36px';
    return tr;
  }

  function redraw(){
    const q = (search.value||'').toLowerCase();
    const today = new Date().toISOString().slice(0,10);
    const list0 = state.releases
      .filter(r=>!q || (r.artist||'').toLowerCase().includes(q))
      .filter(r=>!only.checked || !r.done)
      .filter(r=>!upcoming.checked || r.date >= today)
      .filter(r=> ownerSel.value==='Alle owners' || (r.owner||'')===ownerSel.value )
      .filter(r=> typeSel.value==='Alle types' || (r.type||'')===typeSel.value )
      .filter(r=> !from.value || r.date >= from.value )
      .filter(r=> !to.value || r.date <= to.value )
      .sort((a,b)=> new Date(a.date)-new Date(b.date));

    count.textContent = `${list0.length} releases`;
    tbody.innerHTML = '';

    let currentWeek = null;
    list0.forEach((r, idx)=>{
      const wk = weekKey(r.date);
      if(wk !== currentWeek){
        currentWeek = wk;
        tbody.appendChild(insertWeekRow(currentWeek));
      }
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${fmt(r.date)}</td>
        <td>${r.artist}</td>
        <td><span class="badge">${r.type}</span></td>
        <td><span class="badge">${r.owner||''}</span></td>
        <td>
          <div class="row">
            <div class="dot ${r.done?'green':'red'}"></div>
            <button class="button ghost">${r.done?'Klaar':'Open'}</button>
          </div>
        </td>
        <td><input type="checkbox" ${r.splits?'checked':''}></td>
        <td><input type="checkbox" ${r.buma?'checked':''}></td>
      `;
      const btn = tr.querySelector('button');
      btn.onclick = ()=>{ r.done=!r.done; Storage.set('releases', state.releases); redraw(); };
      const cb1 = tr.querySelectorAll('input')[0]; cb1.onchange = (e)=>{ r.splits=e.target.checked; Storage.set('releases', state.releases); };
      const cb2 = tr.querySelectorAll('input')[1]; cb2.onchange = (e)=>{ r.buma=e.target.checked; Storage.set('releases', state.releases); };
      tbody.appendChild(tr);
    });
  }

  // Export/Import
  exportBtn.onclick = ()=>{
    const blob = new Blob([JSON.stringify(state.releases, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a=document.createElement('a'); a.href=url; a.download='releases.json'; a.click(); URL.revokeObjectURL(url);
  };
  importBtn.onclick = ()=>{
    const inp = document.createElement('input'); inp.type='file'; inp.accept='application/json';
    inp.onchange = async ()=>{
      const file = inp.files[0]; if(!file) return;
      const text = await file.text();
      try{
        const arr = JSON.parse(text);
        if(!Array.isArray(arr)) throw new Error('JSON moet een array van releases zijn');
        state.releases = arr; Storage.set('releases', state.releases); redraw();
      }catch(e){ alert('Import mislukt: '+e.message); }
    };
    inp.click();
  };

  [search, only, upcoming, ownerSel, typeSel, from, to].forEach(el=> el.addEventListener('input', redraw));
  redraw();
  return card;
}
    search.oninput = redraw; only.onchange = redraw;
    redraw();
    return card;
  }

  function epChecklist(){
    const card = document.createElement('div');
    card.className='card grid';
    card.style.gap='16px';
    const h = document.createElement('h3'); h.textContent='Jouw volgende EP (op datum)'; h.style.margin='0';
    card.appendChild(h);

    // ownership map
    const ownership = {}; state.artists.forEach(a=> ownership[(a.name||'').toLowerCase()] = (a.owner||'').toLowerCase());
    const sorted = state.releases.filter(r=>!r.done).sort((a,b)=> new Date(a.date)-new Date(b.date));
    let next = null;
    for(const r of sorted){
      const own = ownership[(r.artist||'').toLowerCase()] || (r.owner||'').toLowerCase();
      if(!own || (state.user.toLowerCase()==='martijn' && (own.includes('erry')||own==='')) || (state.user.toLowerCase()==='nuno' && own.includes('nuneaux'))){
        next = r; break;
      }
    }

    if(!next){ card.appendChild(document.createTextNode('Geen open items 🎉')); return card; }

    const inner = document.createElement('div'); inner.className='grid grid-3';
    const box = document.createElement('div'); box.className='card';
    box.innerHTML = `
      <div class="row" style="justify-content:space-between">
        <strong>${next.artist}</strong>
        <span class="badge">${fmt(next.date)}</span>
      </div>
      <div class="row" style="gap:8px;margin-top:8px">
        <label class="row" style="gap:6px"><input type="checkbox" ${next.splits?'checked':''} class="splits"/> <span>Splits</span></label>
        <label class="row" style="gap:6px"><input type="checkbox" ${next.buma?'checked':''} class="buma"/> <span>Buma/Stemra</span></label>
      </div>
      <div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap">
        <a class="button ghost" href="https://distrokid.com/" target="_blank">DistroKid</a>
        <a class="button ghost" href="https://www.amuse.io/" target="_blank">Amuse</a>
        <a class="button ghost" href="https://portal.bumastemra.nl/" target="_blank">Buma/Stemra</a>
        <a class="button ghost" href="#" onclick="alert('Upload je artworks map in de repo / link hier later')">Artworks</a>
      </div>
      <div style="margin-top:10px">
        <button class="button mark">Markeer als klaar</button>
      </div>
    `;
    box.querySelector('.splits').onchange = (e)=>{ next.splits=e.target.checked; Storage.set('releases', state.releases); };
    box.querySelector('.buma').onchange = (e)=>{ next.buma=e.target.checked; Storage.set('releases', state.releases); };
    box.querySelector('.mark').onclick = ()=>{
      if(!next.splits || !next.buma){ alert('Je moet eerst Splits en Buma/Stemra afvinken.'); return; }
      next.done = true; Storage.set('releases', state.releases); renderBody();
    };
    inner.appendChild(box);
    card.appendChild(inner);
    return card;
  }

  function streamsView(){
    const wrap = document.createElement('div');
    wrap.className='grid'; wrap.style.gap='12px';

    const top = document.createElement('div'); top.className='card grid'; top.style.gap='10px';
    const row = document.createElement('div'); row.className='row'; row.style.cssText='gap:8px; flex-wrap:wrap';
    const date = document.createElement('input'); date.type='date';
    const d = new Date(); d.setDate(d.getDate()-1); date.value = d.toISOString().slice(0,10);
    const select = document.createElement('select'); select.className='input';
    const def = document.createElement('option'); def.value=''; def.text='Kies artiest'; select.appendChild(def);
    state.artists.forEach(a=>{ const o=document.createElement('option'); o.value=a.name; o.text=a.name; select.appendChild(o); });
    const num = document.createElement('input'); num.type='number'; num.min='0'; num.placeholder='Streams (gisteren)'; num.className='input';
    const add = document.createElement('button'); add.className='button'; add.textContent='Toevoegen';
    row.appendChild(date); row.appendChild(select); row.appendChild(num); row.appendChild(add);
    top.appendChild(row);

    const canvas = document.createElement('canvas'); canvas.id='chart'; canvas.style.cssText='width:100%; height:240px'; top.appendChild(canvas);
    wrap.appendChild(top);

    const tableCard = document.createElement('div'); tableCard.className='card'; tableCard.style.cssText='overflow:auto; max-height:45vh';
    const table = document.createElement('table'); table.className='table';
    table.innerHTML = '<thead><tr><th>Datum</th><th>Artiest</th><th>Streams</th></tr></thead><tbody></tbody>';
    const tbody = table.querySelector('tbody');
    tableCard.appendChild(table);
    wrap.appendChild(tableCard);

    function draw(){
      // sort entries
      const entries = state.streams.slice().sort((a,b)=> a.date.localeCompare(b.date));
      tbody.innerHTML='';
      entries.forEach(e=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${e.date}</td><td>${e.artist}</td><td>${e.count}</td>`;
        tbody.appendChild(tr);
      });

      const c = canvas.getContext('2d');
      const w = canvas.width = canvas.clientWidth;
      const h = canvas.height = 240;
      c.clearRect(0,0,w,h);
      c.strokeStyle = '#2a375d';
      c.beginPath(); c.moveTo(40,10); c.lineTo(40,h-30); c.lineTo(w-10,h-30); c.stroke();
      const byDate = new Map();
      entries.forEach(e=> byDate.set(e.date, (byDate.get(e.date)||0)+Number(e.count||0)));
      const labels = Array.from(byDate.keys()).sort();
      const values = labels.map(k=>byDate.get(k));
      if(values.length){
        const maxV = Math.max(...values)||1;
        c.strokeStyle='#6ea8ff'; c.beginPath();
        labels.forEach((lab,i)=>{
          const x = 40 + (i*(w-60))/Math.max(labels.length-1,1);
          const y = (h-30) - ((values[i]/maxV)*(h-50));
          if(i===0) c.moveTo(x,y); else c.lineTo(x,y);
        });
        c.stroke();
        c.fillStyle='#8fa6d8'; c.font='12px system-ui';
        labels.forEach((lab,i)=>{
          if(i%Math.ceil(labels.length/10)===0){
            const x = 40 + (i*(w-60))/Math.max(labels.length-1,1);
            c.fillText(lab.slice(5), x-10, h-12);
          }
        });
      }
    }

    add.onclick = ()=>{
      if(!select.value || !num.value) return;
      state.streams.push({date: date.value, artist: select.value, count: Number(num.value)});
      Storage.set('streams', state.streams); num.value=''; draw();
    };

    draw();
    return wrap;
  }

  function adsView(){
    const card = document.createElement('div');
    card.className='card center'; card.style.minHeight='30vh';
    const a=document.createElement('a'); a.className='button'; a.href='https://eppplannerpro.netlify.app/'; a.target='_blank'; a.textContent='Open Advertentiebeheer';
    card.appendChild(a);
    return card;
  }

  function renderBody(){
    const app = $('#app'); app.innerHTML='';
    app.appendChild(headerBar());
    if(state.tab==='Releases') app.appendChild(releasesView());
    else if(state.tab==='EP Checklist') app.appendChild(epChecklist());
    else if(state.tab==='Streams') app.appendChild(streamsView());
    else if(state.tab==='Advertentiebeheer') app.appendChild(adsView());
  }

  async function bootstrap(){
    // data
    const releasesSaved = Storage.get('releases', null);
    if(releasesSaved){ state.releases = releasesSaved; }
    else {
      const seed = await fetch('./data/releases.json').then(r=>r.json());
      state.releases = seed.releases; Storage.set('releases', state.releases);
    }
    state.artists = await fetch('./data/artists.json').then(r=>r.json());

    if(!state.user){
      $('#app').innerHTML=''; $('#app').appendChild(viewLogin());
    }else{
      renderBody();
    }
  }

  function render(){
    if(!state.user){ $('#app').innerHTML=''; $('#app').appendChild(viewLogin()); return; }
    renderBody();
  }

  // Start
  bootstrap();
})();
