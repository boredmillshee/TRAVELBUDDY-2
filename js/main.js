/* TravelBuddy demo · todo simulado en el navegador (localStorage). */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
async function hash(t) { // Hash simple, solo para la demo
  try { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
  catch (e) { return btoa(t); }
}

/* ---- Tema ---- */
const themeBtn = $('#themeBtn');
const paintTheme = () => themeBtn.setAttribute('aria-label', document.documentElement.dataset.theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
themeBtn.onclick = () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; try { localStorage.setItem('tb_theme', t); } catch (e) {} paintTheme(); };
paintTheme();

/* ---- Navegación (con animación al entrar en cada página) ---- */
let user = null;
function go(p) {
  $$('[data-page]').forEach(x => { const on = x.dataset.page === p; x.hidden = !on; x.classList.remove('in'); if (on) { void x.offsetWidth; x.classList.add('in'); } });
  $$('.side nav button').forEach(b => b.classList.toggle('on', b.dataset.go === p));
  if (p === 'social' || p === 'perfil') renderSocial(); if (p === 'mapa') renderMapa();
}
$$('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go));

/* ---- Registro / login ---- */
const users = () => store.get('tb_users', {});
const save = () => { const u = users(); u[user.email] = user; store.set('tb_users', u); };
const norm = u => Object.assign({ visited: [], flights: 0, checks: 0, posts: [], steps: [] }, u);
const setErr = (f, n, m) => { const e = $(`[data-for=${n}]`, f); if (e) e.textContent = m || ''; };
$('#tabReg').onclick = () => tab(true); $('#tabLog').onclick = () => tab(false);
function tab(reg) {
  $('#tabReg').setAttribute('aria-selected', reg); $('#tabLog').setAttribute('aria-selected', !reg);
  $('#tabReg').tabIndex = reg ? 0 : -1; $('#tabLog').tabIndex = reg ? -1 : 0; $('#formReg').hidden = !reg; $('#formLog').hidden = reg;
}
$('#formReg').onsubmit = async e => {
  e.preventDefault(); const f = e.target, d = Object.fromEntries(new FormData(f)); let ok = true;
  const chk = (n, bad, m) => { setErr(f, n, bad ? m : ''); if (bad) ok = false; };
  chk('name', !d.name.trim(), 'Escribe tu nombre.');
  chk('email', !/^\S+@\S+\.\S+$/.test(d.email), 'Escribe un correo válido, como nombre@correo.com.');
  chk('pass', d.pass.length < 8, 'La contraseña necesita al menos 8 caracteres.');
  chk('pass2', d.pass !== d.pass2, 'Las contraseñas no coinciden.');
  if (ok && users()[d.email.toLowerCase()]) { setErr(f, 'email', 'Este correo ya tiene cuenta. Inicia sesión.'); ok = false; }
  if (!ok) { const first = $('.err:not(:empty)', f); first && first.previousElementSibling.querySelector('input').focus(); return; }
  const key = d.email.toLowerCase(); user = norm({ name: d.name.trim(), email: key, h: await hash(d.pass), tutorial: false });
  save(); store.set('tb_session', key); showDash();
};
$('#formLog').onsubmit = async e => {
  e.preventDefault(); const f = e.target, d = Object.fromEntries(new FormData(f)), u = users()[d.email.toLowerCase()];
  if (!u || u.h !== await hash(d.pass)) return setErr(f, 'login', 'Correo o contraseña incorrectos. Revisa los datos o regístrate.');
  setErr(f, 'login', ''); store.set('tb_session', u.email); user = norm(u); showDash();
};
$('#logout').onclick = () => { store.set('tb_session', null); user = null; $('#shell').hidden = true; $('#auth').hidden = false; };
function showDash() {
  $('#auth').hidden = true; $('#shell').hidden = false; go('home');
  $('#hola').textContent = `Hola, ${user.name} 👋`; $('#avatar').textContent = user.name.trim().slice(0, 2).toUpperCase();
  $('#perfInfo').textContent = `${user.email}`; $('#perfName').textContent = user.name; $('#avL').textContent = user.name.trim().slice(0, 2).toUpperCase(); if (!user.tutorial) openTut();
}
$$('.check input').forEach(i => i.onchange = () => { user.checks = $$('.check input:checked').length; save(); });

/* ---- Tutorial: ilumina cada opción mientras la explica ---- */
const TUT = [
  ['[data-go=home]', 'home', 'Inicio', 'Tu punto de partida: accesos rápidos a todo lo que ofrece TravelBuddy.'],
  ['[data-go=guia]', 'guia', 'Guía', 'Requisitos y documentación para preparar el viaje, y guías del aeropuerto, el hotel y la ciudad.'],
  ['[data-go=viaje]', 'viaje', 'Mi viaje', 'Escribe tu número de vuelo y verás los datos del vuelo, los detalles de la aeronave, el itinerario con sitios y actividades y el seguimiento para tu familia.'],
  ['[data-go=mapa]', 'mapa', 'Mapa', 'El plano del aeropuerto en 2D y una vista 3D interior: te guía hasta tu puerta y te avisa de la documentación que necesitas en cada trámite.'],
  ['[data-go=social]', 'social', 'Social', 'Consigue logros con barra de progreso, pregunta en el foro y colorea tu mapamundi con cada país visitado.'],
  ['[data-go=perfil]', 'perfil', 'Perfil', 'Tus datos, cerrar sesión y volver a ver este tutorial cuando quieras.'],
  ['#themeBtn', 'home', 'Tema', 'Cambia entre modo claro y oscuro cuando prefieras.']
];
const tut = $('#tut'); let ti = 0;
function openTut() { ti = 0; tut.hidden = false; drawTut(); }
function drawTut() {
  $$('.spot').forEach(x => x.classList.remove('spot'));
  const [sel, pg, t, p] = TUT[ti]; go(pg); const el = $(sel); el.classList.add('spot');
  $('#tutT').textContent = t; $('#tutP').textContent = p; $('#tutProg').textContent = `Paso ${ti + 1} de ${TUT.length}`;
  $('#tutPrev').disabled = !ti; $('#tutNext').textContent = ti === TUT.length - 1 ? 'Empezar' : 'Siguiente';
  const r = el.getBoundingClientRect(), w = tut.offsetWidth;
  if (innerWidth > 860) {
    if (sel === '#themeBtn') { tut.style.left = Math.max(12, r.right - w) + 'px'; tut.style.top = r.bottom + 16 + 'px'; }
    else { tut.style.left = r.right + 20 + 'px'; tut.style.top = Math.max(12, r.top - 10) + 'px'; }
    tut.style.bottom = 'auto';
  } else { tut.style.left = '1rem'; tut.style.top = 'auto'; tut.style.bottom = '1rem'; }
  tut.focus({ preventScroll: true });
}
function endTut() { $$('.spot').forEach(x => x.classList.remove('spot')); tut.hidden = true; if (user) { user.tutorial = true; save(); } go('home'); }
$('#tutNext').onclick = () => ti < TUT.length - 1 ? (ti++, drawTut()) : endTut();
$('#tutPrev').onclick = () => { ti--; drawTut(); };
$('#tutSkip').onclick = endTut; $('#tutAgain').onclick = openTut;
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !tut.hidden) endTut(); });

/* ---- Vuelo, aeronave e itinerario ---- */
const STAGES = ['Facturación', 'Control de seguridad', 'Embarque', 'En vuelo', 'Aterrizaje'];
const FAMILY = ['Ya está en el aeropuerto y facturando.', 'Está pasando el control de seguridad.', 'Está embarcando. Puerta abierta.', 'Está en el aire. Todo en orden.', 'Ha aterrizado sano y salvo.'];
let timer, stage, curCode = 'TB1234', itin = [];
const curF = () => FLIGHTS[curCode];
$('#flightForm').onsubmit = e => {
  e.preventDefault(); const code = $('#flightNo').value.replace(/\s/g, '').toUpperCase(), f = FLIGHTS[code]; clearInterval(timer);
  if (!f) { $('#flightOut').hidden = true; $('#flightErr').textContent = `No encontramos el vuelo "${$('#flightNo').value}". Prueba con ${Object.keys(FLIGHTS).join(' o ')}.`; return; }
  $('#flightErr').textContent = ''; curCode = code; stage = f.stage; $('#flightOut').hidden = false; user.flights++; save();
  $('#ficha').innerHTML = [['Vuelo', code], ['Aerolínea', f.airline], ['Origen', f.from], ['Destino', f.to], ['Salida', f.dep], ['Llegada', f.arr], ['Terminal', f.terminal], ['Puerta', f.gate], ['Avión', f.plane], ['Estado', f.status]].map(([k, v]) => `<div><b>${k}</b>${v}</div>`).join('');
  $('#det').hidden = true; $('#detBtn').setAttribute('aria-expanded', 'false'); itin = []; drawItin(); drawTimeline();
  timer = setInterval(() => { if (stage < STAGES.length - 1) { stage++; drawTimeline(); } else { clearInterval(timer); toggleC(f.country, true); } }, 4000);
};
$('#detBtn').onclick = () => {
  const d = $('#det'), open = d.hidden; d.hidden = !open; $('#detBtn').setAttribute('aria-expanded', open);
  d.innerHTML = curF().pd.map(([k, v]) => `<div><b>${k}</b>${v}</div>`).join('');
};
function drawTimeline() {
  $('#timeline').innerHTML = STAGES.map((s, i) => `<li class="${i < stage ? 'done' : i === stage ? 'now' : ''}">${s}</li>`).join('');
  $('#family').textContent = `Mensaje para tu familia: ${FAMILY[stage]}`;
}
function drawItin() {
  $('#itin').innerHTML = ['Mañana', 'Tarde', 'Noche'].map(b => {
    const l = itin.filter(i => i[0] === b);
    return l.length ? `<div class="itb">${b.toUpperCase()}</div>` + l.map(i => `<div class="it"><span class="tp">${i[2]}</span><b>${esc(i[1])}</b><small>${i[3] ? 'Duración: ' + i[3] + ' · ' : ''}${i[4]}</small></div>`).join('') : '';
  }).join('') || '<p class="muted sm">Aún no hay actividades. Genera un plan con IA o añade las tuyas.</p>';
}
$('#aiBtn').onclick = () => {
  const b = $('#aiBtn'); b.disabled = true; b.textContent = 'Preparando tu plan…';
  setTimeout(() => { itin = [...itin.filter(i => i[2] === 'Tuyo'), ...ITIN[curF().country]]; drawItin(); b.disabled = false; b.textContent = 'Generar con IA (simulado)'; }, 1200);
};
$('#itinForm').onsubmit = e => { e.preventDefault(); const v = $('#itinIn').value.trim(); if (v) { itin.push([$('#itinB').value, v, 'Tuyo', '', 'Añadida por ti.']); drawItin(); } $('#itinIn').value = ''; };

/* ---- Mapa del aeropuerto: 2D y 3D ---- */
const WP = [
  { n: 'Entrada principal', m: 0, sv: ['Información', 'Taxis y metro', 'Cajeros'], doc: 'Ten a mano tu DNI o pasaporte y tu tarjeta de embarque.' },
  { n: 'Facturación', m: 120, sv: ['Mostradores', 'Consigna', 'Atención al cliente'], doc: 'Para facturar necesitas DNI o pasaporte y tu reserva. Revisa el peso máximo de tu maleta.' },
  { n: 'Control de seguridad', m: 260, sv: ['Filtro rápido', 'Asistencia a familias'], doc: 'Prepara tarjeta de embarque y DNI. Líquidos en bolsa transparente (máx. 100 ml) y portátil fuera de la mochila.' },
  { n: 'Zona comercial', m: 420, sv: ['Restaurantes', 'Baños', 'Farmacia', 'Tiendas'], doc: 'Ya has pasado el control. Aquí tienes baños, comida y tiendas antes de embarcar.' },
  { n: 'Puerta {g}', m: 640, sv: ['Asientos con enchufe', 'Fuente de agua'], doc: 'Tu puerta. El embarque empieza unos 40 minutos antes de la salida.' }
];
const ZS = [350, 800, 1250, 1700, 2150], L = 2500;
let wi = 0, yaw = 0, cd = 45 * 60, builtFor = '', cdT;
const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const wn = i => WP[i].n.replace('{g}', curF().gate);
function build3d() {
  /* Pasillo en tramos de 300 px: los planos muy largos que cruzan la cámara se dibujan mal */
  const T = 300, O = 'transform-origin:0 0;', n = (L + 500) / T; let h = '';
  for (let k = 0; k < n; k++) {
    const z = 500 - k * T;
    h += `<div class="fl" style="left:-200px;top:100px;width:400px;height:${T}px;${O}transform:translateZ(${z}px) rotateX(-90deg)"></div>`
      + `<div class="ce" style="left:-200px;top:-120px;width:400px;height:${T}px;${O}transform:translateZ(${z}px) rotateX(-90deg)"></div>`
      + `<div class="wl" style="left:-200px;top:-120px;width:${T}px;height:220px;${O}transform:translateZ(${z}px) rotateY(90deg)"></div>`
      + `<div class="wr" style="left:${200 - T}px;top:-120px;width:${T}px;height:220px;transform-origin:100% 0;transform:translateZ(${z}px) rotateY(-90deg)"></div>`;
  }
  h += `<div class="rt" style="left:-8px;top:99px;width:16px;height:2150px;${O}transform:translateZ(-100px) rotateX(-90deg)"></div>`;
  for (let z = 250; z < 2150; z += 150) h += `<div class="ar" style="left:-22px;top:98px;width:44px;height:44px;${O}transform:translateZ(${-z}px) rotateX(-90deg)"><i></i></div>`;
  h += `<div class="ew" style="left:-200px;top:-120px;width:400px;height:220px;transform:translateZ(-${L}px)">EMBARQUE</div>`;
  h += WP.map((w, i) => `<div class="bd" style="left:-100px;top:-90px;transform:translate3d(-197px,0,${-ZS[i]}px) rotateY(90deg)"><b>${esc(wn(i))}</b>${w.sv.map(esc).join('<br>')}</div>`).join('');
  h += WP.map((w, i) => `<div class="sg" style="left:-120px;top:-100px;width:240px;height:46px;transform:translateZ(-${ZS[i]}px)">${esc(wn(i))}</div>`).join('');
  $('#world').innerHTML = h; builtFor = curCode;
}
function setWp(i, silent) {
  wi = Math.max(0, Math.min(WP.length - 1, i));
  $('#world').style.transform = `translateZ(520px) rotateY(${yaw}deg) translateZ(${ZS[wi] - 230}px)`;
  if (!silent && !user.steps.includes(wi)) { user.steps.push(wi); save(); }
  drawMapa();
}
function drawMapa() {
  const f = curF(), d = WP[4].m - WP[wi].m, t = Math.ceil(d / 80);
  $('#info').innerHTML = `<div><small>Tu puerta</small><b>${f.gate} · ${f.terminal}</b></div><div><small>Embarque en</small><b id="cd">${fmt(cd)}</b></div><div><small>Distancia a tu puerta</small><b>${d} m</b></div><div><small>Andando</small><b>${d ? t + ' min' : '¡Has llegado!'}</b></div>`;
  const nx = WP[wi + 1];
  $('#notes').innerHTML = `<div class="note"><b>📄 Documentación ahora (${esc(wn(wi))}):</b> ${WP[wi].doc}</div>` + (nx ? `<div class="note next"><b>Siguiente: ${esc(wn(wi + 1))}.</b> ${nx.doc}</div>` : '');
  $('#hud').innerHTML = `<b>${esc(wn(wi))}</b> · Servicios: ${WP[wi].sv.join(', ')}. Gira a la izquierda para ver los carteles.`;
  $('#steps').innerHTML = WP.map((w, i) => `<li><button data-i="${i}" ${i === wi ? 'aria-current="step"' : ''}><span>${i + 1}. ${esc(wn(i))}</span><span class="muted">${WP[4].m - w.m} m a la puerta</span></button></li>`).join('');
  drawPlan();
}
const phone = $('.phone');
let zoom = 1, flt = 'Todo', q = '';
const cat = x => /Baños/.test(x) ? 'Baños' : /Restaur/.test(x) ? 'Comida' : /Tiendas|Farmacia/.test(x) ? 'Tiendas' : 'Info';
const CC = { Baños: '#bde3f2', Comida: '#fcd9a8', Tiendas: '#e6cdf2', Info: '#cfe8cd' };
function drawPlan() {
  const Y = i => 470 - i * 104, g = Y(wi), d = WP[4].m - WP[wi].m, t = Math.ceil(d / 80);
  const on = x => (flt === 'Todo' || cat(x) === flt) && (!q || x.toLowerCase().includes(q));
  let h = `<rect x="-200" y="-200" width="800" height="1000" fill="var(--mbg)"/><rect x="36" y="14" width="258" height="494" rx="18" fill="var(--mbld)" stroke="var(--mline)" stroke-width="2"/><rect x="150" y="14" width="30" height="494" fill="var(--mroad)"/>`;
  WP.forEach((w, i) => w.sv.slice(0, 2).forEach((x, k) => { const lit = on(x), xx = k ? 186 : 48; h += `<g data-i="${i}" style="cursor:pointer;opacity:${lit ? 1 : .3}"><rect x="${xx}" y="${Y(i) - 26}" width="96" height="52" rx="8" fill="${CC[cat(x)]}" stroke="${lit && (flt !== 'Todo' || q) ? 'var(--route)' : 'var(--mline)'}" stroke-width="${lit && (flt !== 'Todo' || q) ? 3 : 1}"/><text x="${xx + 48}" y="${Y(i) + 4}" text-anchor="middle" style="font-size:10px;font-weight:600;fill:#2b2b2b">${esc(x.length > 15 ? x.slice(0, 14) + '…' : x)}</text></g>`; }));
  h += `<line x1="165" y1="${Y(0)}" x2="165" y2="${g}" stroke="var(--mline)" stroke-width="5" stroke-dasharray="2 8" stroke-linecap="round"/><line x1="165" y1="${g}" x2="165" y2="${Y(4)}" stroke="#fff" stroke-width="11" stroke-linecap="round"/><line x1="165" y1="${g}" x2="165" y2="${Y(4)}" stroke="var(--route)" stroke-width="7" stroke-linecap="round"/>`;
  WP.forEach((w, i) => { h += `<g data-i="${i}" style="cursor:pointer"><circle cx="165" cy="${Y(i)}" r="6" fill="#fff" stroke="var(--mline)" stroke-width="2"/><text class="mt" x="165" y="${Y(i) - 34}" text-anchor="middle" style="font-size:11px;font-weight:700">${esc(wn(i))}</text></g>`; });
  h += `<g transform="translate(165 ${Y(4) - 6})"><path d="M0 0C-4-8-11-13-11-20A11 11 0 1 1 11-20C11-13 4-8 0 0Z" fill="#ea4335" stroke="#fff" stroke-width="1.5"/><circle cy="-20" r="4" fill="#fff"/></g>`;
  h += `<circle cx="165" cy="${g}" r="9" fill="var(--route)" opacity=".25" style="animation:ping 1.6s ease-out infinite"/><circle cx="165" cy="${g}" r="8" fill="var(--route)" stroke="#fff" stroke-width="3"/>`;
  $('#plan').innerHTML = h;
  const r = $('#plan').getBoundingClientRect(), full = phone.classList.contains('full'), w = 330 / zoom * (full ? 1.6 : 1), hh = r.width ? w * r.height / r.width : 430 / zoom;
  const vx = w >= 330 ? (330 - w) / 2 : Math.max(0, Math.min(330 - w, 165 - w / 2)), vy = hh >= 522 ? (522 - hh) / 2 : Math.max(0, Math.min(522 - hh, g - hh / 2));
  $('#plan').setAttribute('viewBox', `${vx} ${vy} ${w} ${hh}`);
  $('#chips').innerHTML = ['Todo', 'Baños', 'Comida', 'Tiendas', 'Info'].map(c => `<button type="button" aria-pressed="${c === flt}">${c}</button>`).join('');
  $('#sheet').innerHTML = `<div><b>${esc(wn(wi))}</b><span>${d ? d + ' m · ' + t + ' min andando' : 'Has llegado a tu puerta'}</span></div><button class="btn sm" id="go3d" type="button">Ver en 3D</button>`;
}
function renderMapa() {
  if (builtFor !== curCode) { build3d(); wi = 0; }
  setWp(wi, true);
  if (!cdT) cdT = setInterval(() => { cd = Math.max(0, cd - 1); const e = $('#cd'); if (e) e.textContent = fmt(cd); }, 1000);
}
const look = d => { yaw = Math.max(-55, Math.min(55, yaw + d)); setWp(wi, true); };
$('#tf').onclick = () => setWp(wi + 1); $('#tb').onclick = () => setWp(wi - 1);
$('#tl').onclick = () => look(-35); $('#tr').onclick = () => look(35);
$('#steps').onclick = $('#plan').onclick = e => { const b = e.target.closest('[data-i]'); if (b) setWp(+b.dataset.i); };
$('#vp').onkeydown = e => { const k = { ArrowUp: () => setWp(wi + 1), ArrowDown: () => setWp(wi - 1), ArrowLeft: () => look(-35), ArrowRight: () => look(35) }[e.key]; if (k) { e.preventDefault(); k(); } };
let dragX = null; const W3 = $('#world');
$('#vp').onpointerdown = e => { dragX = e.clientX; W3.style.transition = 'none'; };
addEventListener('pointermove', e => { if (dragX === null) return; yaw = Math.max(-55, Math.min(55, yaw - (e.clientX - dragX) * .25)); dragX = e.clientX; W3.style.transform = `translateZ(520px) rotateY(${yaw}deg) translateZ(${ZS[wi] - 230}px)`; });
addEventListener('pointerup', () => { if (dragX !== null) { dragX = null; W3.style.transition = ''; } });
function showView(is2) {
  $('#v2d').hidden = !is2; $('#v3d').hidden = is2;
  [['b2d', is2], ['b3d', !is2]].forEach(([i, on]) => { $('#' + i).setAttribute('aria-pressed', on); $('#' + i).classList.toggle('outline', !on); });
}
$('#b2d').onclick = () => showView(true); $('#b3d').onclick = () => showView(false);
$('#sheet').onclick = e => { if (e.target.closest('#go3d')) showView(false); };
$('#zin').onclick = () => { zoom = Math.min(2.5, zoom + .5); drawPlan(); }; $('#zout').onclick = () => { zoom = Math.max(1, zoom - .5); drawPlan(); };
$('#chips').onclick = e => { const b = e.target.closest('button'); if (b) { flt = b.textContent; drawPlan(); } };
$('#msearch').oninput = e => { q = e.target.value.trim().toLowerCase(); drawPlan(); };
$('#fwd').onclick = () => setWp(wi + 1); $('#cmp').onclick = () => { yaw = 0; setWp(wi, true); };
$$('#fwd,#cmp').forEach(b => b.onpointerdown = e => e.stopPropagation());
function setFull(on, btn) {
  phone.classList.toggle('full', on); document.body.style.overflow = on ? 'hidden' : '';
  $$('.exp').forEach(b => { b.textContent = on ? '✕' : '⤢'; b.setAttribute('aria-label', on ? 'Salir de pantalla completa' : 'Ampliar a pantalla completa'); });
  drawMapa(); (btn || $('.exp')).focus();
}
$$('.exp').forEach(b => b.onclick = () => setFull(!phone.classList.contains('full'), b));
document.addEventListener('keydown', e => { if (e.key === 'Escape' && phone.classList.contains('full')) setFull(false); });

/* ---- Social: logros, foro y mapamundi ---- */
$$('[data-st]').forEach(b => b.onclick = () => { $$('[data-st]').forEach(x => x.setAttribute('aria-selected', x === b)); $$('[data-sp]').forEach(p => p.hidden = p.dataset.sp !== b.dataset.st); });
const ACH = [
  ['✈', 'Primer despegue', 'Sigue 1 vuelo en Mi viaje', () => user.flights, 1],
  ['🧳', 'Viajero frecuente', 'Sigue 3 vuelos', () => user.flights, 3],
  ['🗺️', 'Primer sello', 'Colorea 1 país en tu mapa', () => user.visited.length, 1],
  ['🌍', 'Coleccionista de sellos', 'Colorea 5 países', () => user.visited.length, 5],
  ['🌐', 'Trotamundos', 'Colorea 10 países', () => user.visited.length, 10],
  ['💬', 'Voz de la comunidad', 'Publica 3 preguntas en el foro', () => user.posts.length, 3],
  ['✅', 'Listo para volar', 'Marca los 4 puntos de la guía de viaje', () => user.checks, 4],
  ['🧭', 'Explorador del aeropuerto', 'Visita los 5 puntos del mapa', () => user.steps.length, 5]
];
function renderSocial() {
  const st = ACH.map(a => [a, Math.min(a[3](), a[4])]), done = st.filter(([a, v]) => v >= a[4]).length;
  $('#achSum').textContent = `Has desbloqueado ${done} de ${ACH.length} logros`;
  $('#achBar').innerHTML = `<i style="width:${done / ACH.length * 100}%"></i>`;
  const cards = st.map(([a, v]) => { const ok = v >= a[4], p = v / a[4] * 100; return `<article class="ac ${ok ? 'ok' : 'lock'}"><span class="ic" aria-hidden="true">${ok ? a[0] : '🔒'}</span><h4>${a[1]}</h4><span class="badge">${ok ? 'Desbloqueado' : 'Bloqueado'}</span><p class="muted sm">${a[2]}</p><div class="bar-i" role="progressbar" aria-label="${a[1]}" aria-valuemin="0" aria-valuemax="${a[4]}" aria-valuenow="${v}"><i style="width:${p}%"></i></div><small>${ok ? '¡Conseguido!' : `${v} de ${a[4]} · te ${a[4] - v === 1 ? 'falta 1' : 'faltan ' + (a[4] - v)}`}</small></article>`; }).join('');
  $('#ach').innerHTML = $('#achP').innerHTML = cards;
  const stat = (n, l) => `<div><b>${n}</b>${l}</div>`;
  $('#socStats').innerHTML = $('#perfStats').innerHTML = stat(user.visited.length + '/' + Object.keys(CO).length, 'países visitados') + stat(user.flights, 'vuelos seguidos') + stat(done + '/' + ACH.length, 'logros') + stat(user.posts.length, 'preguntas en el foro');
  $('#myPosts').innerHTML = user.posts.slice(0, 3).map(p => `<div class="it"><b>${esc(p.t)}</b><small>${esc(p.b)}</small></div>`).join('') || '<p class="muted">Aún no has participado. Haz tu primera pregunta en el foro.</p>';
  drawForum(); drawWorld();
}
const FORUM = [
  ['Lucía M.', '¿Con cuánta antelación llego al aeropuerto?', 'Voy a Roma en vuelo corto y es la primera vez que viajo sola.', 'Aeropuerto', 'hace 2 días', [['Carlos R.', 'Yo llego unas 2 horas antes en vuelos europeos y 3 en intercontinentales. Más vale esperar que correr.', 1], ['Marta S.', 'Mira también la hora de cierre de facturación de tu aerolínea: suele ser entre 40 y 60 minutos antes.']]],
  ['Jorge P.', '¿Necesito pasaporte para ir a Reino Unido?', 'Salgo de España en diciembre y solo tengo DNI.', 'Documentación', 'hace 3 días', [['Ana T.', 'Sí, necesitas pasaporte en vigor. Comprueba también en la web oficial del gobierno británico si hace falta autorización electrónica.', 1]]],
  ['Elena V.', 'Mi hija de 12 años viaja sola, ¿cómo la sigo?', 'La aerolínea ofrece acompañamiento y quiero estar tranquila.', 'Familia', 'hace 4 días', [['David L.', 'Contrata el servicio de menor no acompañado de la aerolínea y usa el seguimiento familiar de TravelBuddy para ver cada fase.', 1], ['Sofía G.', 'Avisa a la aerolínea de quién la recoge y deja tu teléfono a mano.']]],
  ['Pablo N.', '¿Qué ver en París en un solo día?', 'Llego a las 12:35 y salgo al día siguiente.', 'Destinos', 'hace 5 días', [['Irene C.', 'Torre Eiffel por la tarde, paseo por el Sena y cena en Le Marais. Montmartre mejor al día siguiente.', 1], ['Hugo F.', 'Reserva las entradas antes de ir, te ahorras mucha cola.']]],
  ['Nerea B.', '¿Puedo llevar un powerbank en cabina?', 'Viajo con Buddy Air y no quiero problemas en el control.', 'Equipaje', 'hace 1 semana', [['Raúl A.', 'En cabina sí, en bodega no. Las baterías de litio suelen tener límite de 100 Wh sin permiso; consulta a tu aerolínea.', 1]]],
  ['Clara D.', '¿Cómo llego del aeropuerto de Lisboa al centro?', 'Aterrizo por la tarde y voy con maleta.', 'Destinos', 'hace 1 semana', [['Tomás R.', 'El metro conecta el aeropuerto con el centro en unos 20 minutos y es lo más cómodo con equipaje.', 1]]]
];
const av = n => n.split(' ').map(x => x[0]).join('');
let fcat = 'Todas';
function drawForum() {
  const tags = ['Todas', ...new Set(FORUM.map(f => f[3]))];
  $('#fchips').innerHTML = tags.map(t => `<button type="button" aria-pressed="${t === fcat}">${t}</button>`).join('');
  const mine = fcat === 'Todas' ? user.posts.map(p => `<article class="post mine"><div class="who"><span class="av">${esc(av(user.name))}</span>${esc(user.name)} · Tu pregunta · ahora</div><h4>${esc(p.t)}</h4><p>${esc(p.b)}</p><small class="muted">Aún sin respuestas.</small></article>`).join('') : '';
  $('#forum').innerHTML = mine + FORUM.filter(f => fcat === 'Todas' || f[3] === fcat).map(([a, t, b, tag, w, r]) => `<article class="post"><div class="who"><span class="av">${av(a)}</span>${a} · ${w} · <b>${tag}</b> · ${r.length} ${r.length === 1 ? 'respuesta' : 'respuestas'}</div><h4>${t}</h4><p>${b}</p><div class="rp">${r.map(([n, x, best]) => `<div><div class="who"><span class="av">${av(n)}</span>${n} ${best ? '<span class="ok2">✓ Mejor respuesta</span>' : ''}</div><p>${x}</p></div>`).join('')}</div></article>`).join('');
}
$('#fchips').onclick = e => { const b = e.target.closest('button'); if (b) { fcat = b.textContent; drawForum(); } };
$('#postForm').onsubmit = e => {
  e.preventDefault(); const t = $('#pT').value.trim(), b = $('#pB').value.trim();
  if (!t || !b) { $('#pErr').textContent = 'Escribe un título y tu pregunta antes de publicar.'; return; }
  $('#pErr').textContent = ''; user.posts.unshift({ t, b }); save(); $('#pT').value = $('#pB').value = ''; renderSocial();
};
/* Mapamundi simplificado: [longitud, latitud]. Se dibuja en blanco y negro y se colorea al visitar. */
const LAND = [
  [[-168,66],[-140,70],[-95,72],[-80,68],[-62,60],[-55,50],[-67,44],[-76,35],[-81,25],[-90,29],[-97,26],[-105,22],[-95,16],[-84,10],[-78,8],[-90,14],[-105,20],[-110,30],[-117,32],[-124,40],[-125,49],[-135,58],[-150,60],[-165,60]],
  [[-78,8],[-60,10],[-50,0],[-35,-6],[-40,-22],[-48,-27],[-58,-38],[-66,-46],[-68,-55],[-74,-50],[-73,-38],[-71,-18],[-81,-6],[-80,0]],
  [[-9,37],[-9,43],[-2,48],[-5,50],[5,53],[10,57],[5,62],[15,69],[30,71],[60,69],[80,73],[110,77],[140,72],[170,69],[180,65],[160,60],[155,50],[140,52],[135,43],[128,38],[122,40],[122,30],[110,20],[105,10],[100,2],[98,15],[90,22],[80,15],[72,20],[66,25],[57,26],[56,24],[59,22],[52,16],[43,13],[35,28],[34,31],[36,36],[27,37],[26,41],[20,40],[14,45],[8,44],[3,43],[-2,37]],
  [[-17,21],[-10,30],[-6,36],[10,37],[20,32],[32,31],[35,28],[43,12],[51,12],[40,-2],[40,-15],[35,-25],[27,-34],[18,-34],[12,-18],[9,-2],[9,4],[-8,4],[-17,14]],
  [[114,-22],[122,-18],[131,-12],[142,-11],[146,-19],[153,-27],[150,-37],[141,-38],[131,-31],[115,-34]],
  [[-55,60],[-45,60],[-20,70],[-20,82],[-60,82],[-70,76]]
];
const CO = {
  'España': [[-9,43],[-2,43.5],[3,42],[0,39],[-2,36.5],[-6,36],[-9,37],[-9,41]],
  'Francia': [[-4.5,48.5],[2,51],[8,49],[7.5,44],[3,42.5],[-1.5,43.5],[-1.5,46]],
  'Portugal': [[-9.5,42],[-7,42],[-7,37],[-9,37]],
  'Italia': [[7,44],[13,46.5],[14,43],[18,40],[16,38],[12,41.5],[9,44]],
  'Alemania': [[6,51],[7,53.5],[14,54],[15,51],[13,48],[8,47.5]],
  'Reino Unido': [[-5,50],[1,51],[2,53],[-2,56],[-3,58],[-6,57],[-3,54]],
  'Marruecos': [[-13,28],[-9,35.8],[-2,35],[-2,32],[-8.5,27.5]],
  'Japón': [[130,31],[135,34],[141,38],[142,44],[140,42],[138,37],[132,34]],
  'México': [[-117,32],[-106,31.5],[-97,26],[-97,20],[-90,21],[-87,21],[-91,17],[-92,14.5],[-105,19],[-110,24],[-114,30]],
  'Canadá': [[-141,69],[-95,72],[-80,68],[-62,60],[-55,50],[-67,45],[-83,46],[-95,49],[-123,49],[-130,55],[-141,60]],
  'Estados Unidos': [[-125,49],[-95,49],[-83,46],[-67,45],[-76,35],[-81,25],[-90,29],[-97,26],[-106,31.5],[-117,32],[-124,40]],
  'Brasil': [[-60,5],[-50,0],[-35,-6],[-40,-22],[-48,-27],[-54,-34],[-58,-30],[-58,-17],[-70,-10],[-73,-5]]
};
const pts = a => a.map(([lo, la]) => `${lo + 180},${90 - la}`).join(' ');
function drawWorld() {
  const svg = LAND.map(p => `<polygon class="land" points="${pts(p)}"/>`).join('') + Object.entries(CO).map(([n, p]) => `<polygon class="c ${user.visited.includes(n) ? 'on' : ''}" data-c="${n}" points="${pts(p)}"><title>${n}</title></polygon>`).join('');
  const btn = Object.keys(CO).map(n => `<button type="button" data-c="${n}" aria-pressed="${user.visited.includes(n)}">${n}</button>`).join('');
  ['world2', 'world3'].forEach(id => $('#' + id).innerHTML = svg); ['myMap', 'myMap2'].forEach(id => $('#' + id).innerHTML = btn);
}
function toggleC(n, only) {
  const i = user.visited.indexOf(n); if (only && i >= 0) return;
  i >= 0 ? user.visited.splice(i, 1) : user.visited.push(n); save(); renderSocial();
}
$('#world2').onclick = $('#world3').onclick = $('#myMap').onclick = $('#myMap2').onclick = e => { const c = e.target.closest('[data-c]'); if (c) toggleC(c.dataset.c); };

/* ---- Arranque: recuperar sesión ---- */
const s = store.get('tb_session', null); if (s && users()[s]) { user = norm(users()[s]); showDash(); }
