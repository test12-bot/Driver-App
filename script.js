/* ---------- أيقونات الشاشة الافتتاحية (طعام) ---------- */
const FOOD_ICONS = [
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11c0-3.5 3.6-6 8-6s8 2.5 8 6H4Z"/><path d="M3 14.5h18"/><path d="M5 17.5h14v.5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-.5Z"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3C8 3 4.5 4.5 2.5 7L12 21 21.5 7C19.5 4.5 16 3 12 3Z"/><circle cx="10" cy="9" r="1.2"/><circle cx="14" cy="11" r="1.2"/><circle cx="12" cy="15" r="1"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h12v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V8Z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17"/><path d="M8 3v2M11 3v2M14 3v2"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a2 2 0 0 0 2 2v9"/><path d="M10 3v7a2 2 0 0 1-2 2"/><path d="M17 3c-2 1.5-3 4-3 7h3v11"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 11a5 5 0 0 1 10 0"/><path d="M6.5 11h11L12 21 6.5 11Z"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>'
];

function buildSplashIcons() {
    const wrap = document.getElementById('splashIcons');
    const SPL = window.HWFood ? HWFood.splashSet() : FOOD_ICONS;
    for (let i = 0; i < 18; i++) {
        const el = document.createElement('div');
        el.className = 'float-icon';
        const size = 26 + Math.random() * 34;
        el.style.width = el.style.height = size + 'px';
        el.style.left = (Math.random() * 94) + '%';
        el.style.animationDuration = (9 + Math.random() * 9) + 's';
        el.style.animationDelay = (-Math.random() * 14) + 's';
        el.innerHTML = SPL[(i * 7) % SPL.length];
        wrap.appendChild(el);
    }
}

/* ---------- فيديو الشاشة الافتتاحية بخلفية شفافة ----------
   الفيديو بلا قناة شفافية، فيُعرض عبر WebGL مع حذف لونه التركوازي لحظياً ليظهر الإطار الزجاجي من خلفه.
   لضمان عدم اختفاء اللوجو نهائياً: ننتهي دائماً بصورة اللوجو الثابتة (بنفس مقاس آخر إطار) بدل الاعتماد
   على لوحة WebGL، وننتقل إليها فوراً إذا فشل أي شيء (منع التشغيل التلقائي، فقد سياق WebGL، تأخر الفيديو). */
function initIntroVideo() {
    const video = document.getElementById('splashVideo');
    const canvas = document.getElementById('splashCanvas');
    const card = document.getElementById('splashCard');
    if (!video || !canvas || !card) return null;

    let stopped = false;
    const showStatic = () => {                 // يعرض الصورة الثابتة ويوقف الرسم والفيديو
        stopped = true;
        card.classList.add('static-logo');
        video.pause();
    };

    let gl = null;
    try { gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, preserveDrawingBuffer: true }); } catch (e) {}
    if (!gl) { showStatic(); return { stop() {} }; }
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); showStatic(); });

    const compile = (type, src) => {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src); gl.compileShader(sh);
        return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    };
    const vs = compile(gl.VERTEX_SHADER,
        'attribute vec2 p; varying vec2 uv;' +
        'void main(){ uv = vec2(p.x*0.5+0.5, 0.5-p.y*0.5); gl_Position = vec4(p,0.0,1.0); }');
    const fs = compile(gl.FRAGMENT_SHADER,
        'precision mediump float; uniform sampler2D tex; varying vec2 uv;' +
        'const vec3 BG = vec3(33.0,204.0,208.0)/255.0;' +            // لون خلفية الفيديو
        'void main(){' +
        '  vec3 c = texture2D(tex, uv).rgb;' +
        '  float a = clamp((distance(c, BG) - 0.035) / 0.80, 0.0, 1.0);' +
        '  vec3 f = a > 0.001 ? clamp((c - (1.0 - a) * BG) / a, 0.0, 1.0) : vec3(0.0);' +
        '  gl_FragColor = vec4(f * a, a);' +                          // ألوان مضروبة مسبقاً بالشفافية
        '}');
    const prog = gl.createProgram();
    if (!vs || !fs) { showStatic(); return { stop() {} }; }
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { showStatic(); return { stop() {} }; }
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const draw = () => {
        if (video.readyState < 2) return;
        try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video); }
        catch (e) { showStatic(); return; }
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    let finished = false;
    const canvasBlank = () => {                                   // هل الصف الأوسط من اللوحة فارغ؟
        if (gl.isContextLost()) return true;
        const row = new Uint8Array(canvas.width * 4);
        gl.readPixels(0, canvas.height >> 1, canvas.width, 1, gl.RGBA, gl.UNSIGNED_BYTE, row);
        for (let i = 3; i < row.length; i += 4) if (row[i] > 200) return false;
        return true;
    };
    const next = (fn) => (video.requestVideoFrameCallback ? video.requestVideoFrameCallback(fn) : requestAnimationFrame(fn));
    const loop = () => { if (!stopped) { draw(); next(loop); } };

    let began = false;
    const begin = () => { if (!began && !stopped) { began = true; next(loop); } };
    video.addEventListener('playing', begin);
    video.addEventListener('ended', () => { draw(); finished = true; card.classList.add('logo-done'); });   // النهاية: يبقى آخر إطار من الفيديو معروضاً
    // عند العودة للتطبيق: إن فُرغت لوحة الرسم بصمت نعرض الصورة الثابتة (مأخوذة من آخر إطار فلا يتغير شيء)
    document.addEventListener('visibilitychange', () => { if (!document.hidden && finished && !stopped && canvasBlank()) showStatic(); });
    video.addEventListener('error', showStatic);
    if (!video.paused && video.readyState >= 3) begin();       // بدأ التشغيل التلقائي قبل تسجيل المستمعين

    video.muted = true;                                          // مطلوب ليعمل التشغيل التلقائي
    const p = video.play();
    if (p && p.catch) p.catch(showStatic);                       // التشغيل التلقائي ممنوع (مثلاً توفير الطاقة)
    setTimeout(() => { if (!began) showStatic(); }, 2000);       // لم يبدأ الفيديو خلال ثانيتين
    setTimeout(() => { if (!stopped) showStatic(); }, 9000);     // شبكة أمان إن تجمّد الفيديو قبل نهايته

    return { stop() { stopped = true; video.pause(); } };
}


/* الإطار الزجاجي يكبر ليظهر نموذج الدخول، وزر الرجوع يعيد الشاشة الافتتاحية كما كانت */
let introCtl = null;
function setLoginFocusable(on) {
    document.querySelectorAll('#loginPanel input, #loginPanel button, #loginBack').forEach(el => el.tabIndex = on ? 0 : -1);
    document.getElementById('loginPanel').setAttribute('aria-hidden', on ? 'false' : 'true');
}
function openLogin() {
    document.getElementById('splash').classList.add('login-mode');
    setLoginFocusable(true);
    if (window.matchMedia('(hover:hover)').matches) setTimeout(() => document.getElementById('loginUser').focus(), 650);
}
function closeLogin() {
    document.getElementById('splash').classList.remove('login-mode');
    setLoginFocusable(false);
    document.getElementById('loginError').textContent = '';
    ['loginUserField', 'loginPassField'].forEach(id => document.getElementById(id).classList.remove('invalid'));
    document.getElementById('loginPass').value = '';
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
}
function finishLogin() {
    document.getElementById('splash').classList.add('hide');
    if (introCtl) setTimeout(introCtl.stop, 800);
}


/* =========================================================
   تطبيق الكباتن — HIGHWAY Delivery
   ========================================================= */
const CFG = window.HW_CONFIG;
const KEY = 'hwk-user', SEEN_KEY = 'hwk-seen';
const $ = (id) => document.getElementById(id);
const H = HWOrders.esc, money = HWOrders.money;
const ROOTS = ['screen-jobs', 'screen-earn', 'screen-profile'];
const TAB_OF = { 'screen-jobs': 'jobs', 'screen-job': 'jobs', 'screen-earn': 'earn', 'screen-profile': 'profile' };
const settingsCol = HWDB.col('settings'); let autoMode = true, actMap = null;
let me = null, orders = [], stack = ['screen-jobs'], cur = 'screen-jobs', earnRange = 'today', jobId = null, prevOffers = null, gpsWatch = null, lastGps = 0;
let seen = {}; try { seen = JSON.parse(localStorage.getItem(SEEN_KEY)) || {}; } catch (e) {}
const caps = HWDB.col('captains');

function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 8); } catch (e) {} }
function readJSON(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
function normPhone(v) { let d = String(v || '').replace(/\D/g, ''); if (d.startsWith('962')) d = d.slice(3); if (d.startsWith('0')) d = d.slice(1); return /^7\d{8}$/.test(d) ? '0' + d : ''; }
function money2(n) { return money(n) + ' د.أ'; }

/* ---------- التنقل ---------- */
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    $(id).classList.add('active'); cur = id;
    $('headerBack').classList.toggle('show', ROOTS.indexOf(id) < 0);
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === TAB_OF[id]));
    window.scrollTo({ top: 0, behavior: 'auto' }); render();
}
function goTo(id) { if (stack[stack.length - 1] !== id) stack.push(id); showScreen(id); }
function goBack() { if (stack.length > 1) { stack.pop(); showScreen(stack[stack.length - 1]); } }
function tabGo(id) { buzz(); stack = id === 'screen-jobs' ? ['screen-jobs'] : ['screen-jobs', id]; showScreen(id); }

/* ---------- الدخول ---------- */
function applyUser(u) { me = u; document.body.classList.toggle('authed', !!u); $('appShell').inert = !u; if (u) { $('pfName').textContent = u.name; $('pfPhone').textContent = u.phone; $('pfInitial').textContent = u.name.trim().charAt(0); } }
async function submitLogin(ev) {
    ev.preventDefault();
    const err = $('loginError'); err.textContent = '';
    ['loginUserField', 'loginPassField'].forEach(i => $(i).classList.remove('invalid'));
    const phone = normPhone($('loginUser').value), pin = $('loginPass').value.trim();
    if (!phone) { $('loginUserField').classList.add('invalid'); err.textContent = 'أدخل رقم هاتف صحيح (07XXXXXXXX)'; return; }
    if (!pin) { $('loginPassField').classList.add('invalid'); err.textContent = 'أدخل الرمز السري'; return; }
    const btn = $('loginBtn'); btn.classList.add('loading');
    const hash = await HW_sha256('HWK|' + phone + '|' + pin);
    await new Promise(r => setTimeout(r, 300)); btn.classList.remove('loading');
    const c = caps.list().filter(x => x.phone === phone && x.pin === hash)[0];
    if (!c) { $('loginPassField').classList.add('invalid'); err.textContent = 'الرقم أو الرمز غير صحيح'; return; }
    if (c.active === false) { err.textContent = 'حسابك موقوف، تواصل مع المنسق'; return; }
    try { localStorage.setItem(KEY, JSON.stringify({ id: c.id, name: c.name, phone: c.phone })); } catch (e) {}
    applyUser({ id: c.id, name: c.name, phone: c.phone }); finishLogin(); render();
}
function logout() { if (me) caps.patch(me.id, { online: false }); stopGps(); try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); }

/* ---------- الاتصال والموقع ---------- */
function myDoc() { return me ? caps.get(me.id) || {} : {}; }
function isOnline() { return !!myDoc().online; }
function setOnline(v) {
    caps.patch(me.id, { online: v, lastSeen: Date.now() }); buzz(15);
    if (v) { try { HWOrders.beep(); } catch (e) {} startGps(false); } render();
}
function toggleGps() { if (gpsWatch != null) stopGps(); else startGps(true); renderProfile(); }
function startGps(manual) {
    if (!navigator.geolocation || gpsWatch != null) return;
    gpsWatch = navigator.geolocation.watchPosition(p => {
        if (Date.now() - lastGps < 15000) return; lastGps = Date.now();
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude, lastSeen: Date.now() }; updateMeMarker([pos.lat, pos.lng]);
        caps.patch(me.id, pos);
        const a = active(); if (a) HWOrders.update(a.id, { captain: Object.assign({}, a.captain, { lat: pos.lat, lng: pos.lng }) });
    }, () => { gpsWatch = null; if (manual) HWOrders.toast('تعذر الوصول إلى موقعك'); }, { enableHighAccuracy: true, maximumAge: 10000 });
}
function stopGps() { if (gpsWatch != null) { navigator.geolocation.clearWatch(gpsWatch); gpsWatch = null; } }
setInterval(() => { if (me && isOnline()) caps.patch(me.id, { lastSeen: Date.now() }); }, 30000);

/* ---------- العروض ---------- */
function mineOrders() { return orders.filter(o => o.captain && o.captain.id === me.id); }
function active() { return mineOrders().filter(o => o.status === 'accepted' || o.status === 'picked').sort((a, b) => a.createdAt - b.createdAt)[0]; }
function offers() {
    if (!me || !isOnline()) return [];
    const now = Date.now(), lim = (CFG.offerSeconds || 45) * 1000, dec = myDoc().declined || [];
    return orders.filter(o => HWOrders.offerable(o) && dec.indexOf(o.id) < 0).filter(o => {
        if (o.offerTo === me.id) return now - (o.offerAt || 0) < lim;          /* عرض موجّه لي من الإسناد التلقائي */
        if (o.offerTo || !autoMode) return false;                              /* موجّه لغيري، أو الوضع يدوي */
        return now - (o.createdAt || 0) > 150000 && (o.offered || []).indexOf(me.id) < 0;   /* احتياط: لم يتصرف المنسق فيعرض للجميع */
    });
}
function saveSeen() { try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (e) {} }
async function takeOffer(id) {
    if (active()) { HWOrders.toast('أنهِ طلبك الحالي أولًا'); return; }
    buzz(20);
    const ok = await HWOrders.claim(id, { id: me.id, name: me.name, phone: me.phone });
    if (ok) { HWOrders.toast('✓ الطلب لك، توجه للمتجر'); jobId = id; render(); } else { HWOrders.toast('سبقك كابتن آخر لهذا الطلب'); render(); }
}
function declineOffer(id) { const o = HWOrders.get(id); if (o && o.offerTo === me.id) HWOrders.update(id, { offerTo: null, offerAt: 0, offered: (o.offered || []).concat([me.id]) }); const d = (myDoc().declined || []).concat([id]).slice(-50); caps.patch(me.id, { declined: d }); buzz(); }
function earnOf(o) { const s = HWOrders.settle(o); return s.net; }

function offerCard(o) {
    const s = HWOrders.settle(o), t0 = o.offerTo === me.id ? o.offerAt : seen[o.id], left = Math.max(0, Math.ceil(((CFG.offerSeconds || 45) * 1000 - (Date.now() - t0)) / 1000));
    const pct = Math.max(0, 100 * left / (CFG.offerSeconds || 45));
    const mk = HWOrders.isMarket(o);
    return '<div class="offer" data-id="' + H(o.id) + '"><div class="of-top"><b>' + H(o.storeName || o.from || 'طلب') + '</b><span class="of-earn">+' + money(s.net) + ' د.أ</span></div>' +
        '<div class="of-route">من <b>' + H(o.from || o.storeName || '') + '</b><br>إلى <b>' + H((o.address && (o.address.label || o.address.area)) || o.to || '') + '</b></div>' +
        '<div class="of-meta">' + (mk ? '<span>ادفع للمتجر ' + money(s.items) + ' د.أ</span><span>تحصّل ' + money(s.collected) + ' د.أ</span>' : '<span>توصيل</span>') + '<span>أجرة التوصيل ' + money(s.fee) + '</span>' + (o.distKm ? '<span>' + o.distKm + ' كم</span>' : '') + '<span>' + left + ' ث</span></div>' +
        '<div class="of-act"><button type="button" class="submit-btn" data-take="' + H(o.id) + '"><span class="btn-label">قبول الطلب</span></button><button type="button" class="ghost-btn" data-dec="' + H(o.id) + '">تجاهل</button></div>' +
        '<div class="of-bar"><i style="width:' + pct + '%"></i></div></div>';
}

/* ---------- العرض ---------- */
function navTarget(o) {
    if (o.status === 'picked') {
        if (o.address && o.address.lat) return o.address.lat + ',' + o.address.lng;
        return ((o.address && o.address.details) || '') + ' ' + ((o.address && o.address.area) || o.to || '');
    }
    if (o.storeLoc) return o.storeLoc.lat + ',' + o.storeLoc.lng;
    return (o.storeName || o.from || '') + ' ' + (o.storeStart === 'umm_naaj' ? 'أم النعاج' : 'السلط');
}
function nextStep(o) {
    if (o.status === 'accepted') return o.arrivedStore ? { k: 'pick', t: 'استلمت الطلب من المتجر' } : { k: 'arrS', t: 'وصلت للمتجر' };
    if (o.status === 'picked') return o.arrivedCustomer ? { k: 'done', t: 'تم التسليم وتحصيل المبلغ' } : { k: 'arrC', t: 'وصلت للعميل' };
    return null;
}
function activeCard(o) {
    const s = HWOrders.settle(o), st = nextStep(o), mk = HWOrders.isMarket(o), toStore = o.status === 'accepted';
    const phone = toStore ? '' : (o.customer && o.customer.phone) || o.phone || '';
    return '<div class="act-card"><small>' + H(o.code) + ' · ' + (toStore ? 'في الطريق للمتجر' : 'في الطريق للعميل') + '</small>' +
        '<h2>' + (toStore ? H(o.storeName || o.from || '') : H((o.customer && o.customer.name) || o.to || 'العميل')) + '</h2>' +
        '<div class="act-info">' +
        (toStore ? (mk ? '<div><span>تدفع للمتجر كاش</span><b>' + money2(s.items) + '</b></div><div><span>حالة المتجر</span><b>' + (o.storeState === 'ready' ? 'جاهز ✓' : 'قيد التحضير') + '</b></div>' : '<div><span>من</span><b>' + H(o.from || '') + '</b></div>')
            : '<div><span>العنوان</span><b>' + H(((o.address && (o.address.label || o.address.area)) || o.to || '') + (o.address && o.address.details ? ' · ' + o.address.details : '')) + '</b></div>' + (mk ? '<div><span>تحصّل من العميل</span><b>' + money2(s.collected) + '</b></div>' : '')) + '</div>' +
        '<div class="act-btns"><a href="' + HWOrders.openNav(navTarget(o)) + '" target="_blank" rel="noopener">🧭 افتح الخريطة</a>' + (phone ? '<a href="tel:' + H(phone) + '">📞 اتصال</a>' : '') + '<button type="button" onclick="openJob(\'' + o.id + '\')">التفاصيل</button></div>' +
        (st ? '<button type="button" class="submit-btn" style="margin-top:12px" data-step="' + st.k + '" data-id="' + o.id + '"><span class="btn-label">' + st.t + '</span></button>' : '') + '</div>';
}
function stepAction(k, id) {
    const o = HWOrders.get(id); if (!o) return; buzz(18);
    const s = HWOrders.settle(o);
    if (k === 'arrS') HWOrders.update(id, { arrivedStore: true }, 'arrived_store');
    else if (k === 'arrC') HWOrders.update(id, { arrivedCustomer: true }, 'arrived_customer');
    else if (k === 'pick') {
        if (HWOrders.isMarket(o)) sheet('<div class="sh-head"><div><small>' + H(o.code) + '</small><h3>ادفع للمتجر</h3></div></div><div class="pay-big"><div class="big">' + money(s.items) + ' د.أ</div><p class="mut">ادفع هذا المبلغ كاش لـ ' + H(o.storeName) + ' واستلم الطلب' + (o.storeState !== 'ready' ? '<br><b style="color:var(--danger)">تنبيه: المتجر لم يؤكد أن الطلب جاهز</b>' : '') + '</p></div><button type="button" class="submit-btn" onclick="confirmPick(\'' + id + '\')"><span class="btn-label">دفعت واستلمت</span></button>');
        else confirmPick(id);
    } else if (k === 'done') {
        if (HWOrders.isMarket(o)) sheet('<div class="sh-head"><div><small>' + H(o.code) + '</small><h3>حصّل من العميل</h3></div></div><div class="pay-big"><div class="big">' + money(s.collected) + ' د.أ</div><p class="mut">المنتجات ' + money(s.items) + ' + التوصيل ' + money(s.fee) + '</p></div><button type="button" class="submit-btn" onclick="confirmDone(\'' + id + '\')"><span class="btn-label">استلمت المبلغ وسلّمت الطلب</span></button>');
        else confirmDone(id);
    }
}
function confirmPick(id) { closeSheet(); HWOrders.update(id, { status: 'picked', pickedPaid: true }); }
function confirmDone(id) { closeSheet(); HWOrders.update(id, { status: 'delivered', cashCollected: true }); HWOrders.toast('✓ تم التسليم، أحسنت!'); jobId = null; if (cur === 'screen-job') goBack(); }
function sheet(h) { $('sheetBody').innerHTML = h; $('sheet').classList.add('show'); }
function closeSheet() { $('sheet').classList.remove('show'); }
function openJob(id) { jobId = id; goTo('screen-job'); }

function renderActMap(a) {
    const box = $('actMap');
    if (!a || !a.address || a.address.lat == null || !window.HWMap) { box.style.display = 'none'; return; }
    box.style.display = '';
    const sl = a.storeLoc ? [a.storeLoc.lat, a.storeLoc.lng] : HWMap.center(), dl = [a.address.lat, a.address.lng];
    if (!actMap || actMap.id !== a.id) {
        if (actMap) { try { actMap.map.remove(); } catch (e) {} }
        const map = HWMap.create($('actMapEl'), { center: sl, zoom: 14 });
        HWMap.line(map, a.route || [sl, dl]);
        L.marker(sl, { icon: HWMap.ICON.store(a.storeId || ''), interactive: false }).addTo(map);
        L.marker(dl, { icon: HWMap.ICON.home(), interactive: false }).addTo(map);
        actMap = { id: a.id, map, me: null, pts: (a.route || [sl, dl]).concat([sl, dl]) };
        setTimeout(() => { map.invalidateSize(); HWMap.fit(map, actMap.pts, [40, 40]); }, 80);
    }
}
function updateMeMarker(pos) { if (!actMap) return; if (!actMap.me) actMap.me = L.marker(pos, { icon: HWMap.ICON.me(), interactive: false }).addTo(actMap.map); else actMap.me.setLatLng(pos); }
function renderJobs() {
    const on = isOnline();
    $('onlineCard').className = 'online-card' + (on ? ' on' : '');
    $('onlineCard').innerHTML = '<div class="oc-t"><b>' + (on ? 'أنت متصل' : 'أنت غير متصل') + '</b><small>' + (on ? 'تصلك الطلبات الجديدة مباشرة' : 'اتصل لتستقبل الطلبات') + '</small></div><button type="button" class="sw' + (on ? ' on' : '') + '" onclick="setOnline(' + (!on) + ')" aria-label="تبديل الاتصال"></button>';
    $('netDot').classList.toggle('on', on);
    const a = active(); renderActMap(a); $('activeBox').innerHTML = a ? '<h3 class="sec-t">طلبك الحالي</h3>' + activeCard(a) : '';
    const of = on && !a ? offers() : [];
    $('offersBox').innerHTML = !on ? '<div class="empty-orders">اتصل لتبدأ باستقبال الطلبات</div>' : a ? '' : of.length ? '<h3 class="sec-t">طلبات متاحة (' + of.length + ')</h3>' + of.map(offerCard).join('') : '<div class="empty-orders">لا توجد طلبات الآن، نبحث لك…</div>';
    const b = $('tabBadge'); b.textContent = of.length + (a ? 1 : 0); b.classList.toggle('on', of.length + (a ? 1 : 0) > 0);
    $('hdrSub').textContent = on ? 'متصل · ' + me.name.split(' ')[0] : 'غير متصل';
}
function renderJob() {
    const o = HWOrders.get(jobId); if (!o) { $('jobBody').innerHTML = '<div class="empty-orders">الطلب غير موجود</div>'; return; }
    const s = HWOrders.settle(o), st = nextStep(o), mk = HWOrders.isMarket(o);
    $('jobBody').innerHTML = '<div class="page-heading"><h1>' + H(o.code) + '</h1><p>' + H(o.storeName || o.from || '') + ' · ' + HWOrders.label(o) + '</p></div>' +
        (o.status === 'accepted' || o.status === 'picked' ? activeCard(o) : '') +
        (mk ? '<h3 class="sec-t">المنتجات</h3><div class="cart-card">' + o.items.map(l => '<div class="cl ro"><div class="cl-txt"><b>' + l.qty + '× ' + H(l.name) + '</b>' + (l.notes ? '<small>' + H(l.notes) + '</small>' : '') + '</div></div>').join('') + (o.notes ? '<p class="mut">ملاحظة: ' + H(o.notes) + '</p>' : '') + '</div>' : '') +
        '<h3 class="sec-t">الحساب</h3><div class="cart-card sum">' + (mk ? '<div><span>تدفع للمتجر</span><b>' + money2(s.items) + '</b></div><div><span>تحصّل من العميل</span><b>' + money2(s.collected) + '</b></div>' : '') + '<div><span>أجرة التوصيل</span><b>' + money2(s.fee) + '</b></div><div><span>عمولة الشركة (' + Math.round((CFG.commissionRate || .1) * 100) + '٪)</span><b>−' + money2(s.commission) + '</b></div><div class="tot"><span>صافي ربحك</span><b>' + money2(s.net) + '</b></div></div>' +
        '<h3 class="sec-t">السجل</h3><div class="cart-card">' + HWOrders.timeline(o) + '</div>';
}

/* ---------- الأرباح ---------- */
function inRange(ts) {
    const d = new Date(ts), n = new Date();
    if (earnRange === 'today') return HWOrders.isToday(ts);
    if (earnRange === 'week') return n - d < 7 * 864e5;
    return true;
}
function renderEarn() {
    $('earnChips').innerHTML = [['today', 'اليوم'], ['week', '٧ أيام'], ['all', 'الكل']].map(r => '<button type="button" class="chip' + (earnRange === r[0] ? ' on' : '') + '" data-r="' + r[0] + '">' + r[1] + '</button>').join('');
    const list = mineOrders().filter(o => o.status === 'delivered' && inRange(o.updatedAt || o.createdAt));
    const t = list.reduce((a, o) => { const s = HWOrders.settle(o); a.n++; a.col += s.collected; a.items += s.items; a.fee += s.fee; a.com += s.commission; a.net += s.net; return a; }, { n: 0, col: 0, items: 0, fee: 0, com: 0, net: 0 });
    $('earnBody').innerHTML = '<div class="eg-grid"><div class="eg hi"><small>صافي أرباحك</small><b>' + money2(t.net) + '</b></div>' +
        '<div class="eg"><small>طلبات مسلّمة</small><b>' + t.n + '</b></div><div class="eg"><small>أجور التوصيل</small><b>' + money2(t.fee) + '</b></div>' +
        '<div class="eg"><small>حصّلت من العملاء</small><b>' + money2(t.col) + '</b></div><div class="eg"><small>دفعت للمطاعم</small><b>' + money2(t.items) + '</b></div>' +
        '<div class="eg warn" style="grid-column:1/-1"><small>المستحق للشركة (عمولة ' + Math.round((CFG.commissionRate || .1) * 100) + '٪ من التوصيل)</small><b>' + money2(t.com) + '</b></div></div>' +
        '<h3 class="sec-t">الطلبات</h3><div class="cart-card">' + (list.length ? list.slice().sort((a, b) => b.updatedAt - a.updatedAt).map(o => '<div class="er"><div><b>' + H(o.storeName || o.from || '') + '</b><small>' + H(o.code) + ' · ' + HWOrders.ago(o.updatedAt || o.createdAt) + '</small></div><b>+' + money(earnOf(o)) + '</b></div>').join('') : '<p class="mut">لا توجد طلبات في هذه الفترة</p>') + '</div>';
}
function renderProfile() { $('pfGps').textContent = gpsWatch != null ? 'تعمل' : 'متوقفة'; }
function render() {
    if (!me) return;
    if (cur === 'screen-jobs') renderJobs(); else if (cur === 'screen-job') renderJob(); else if (cur === 'screen-earn') renderEarn(); else renderProfile();
    const a = active(), bar = $('liveBar'), show = !!a && cur !== 'screen-jobs';
    bar.classList.toggle('show', show); if (a) { $('lvTitle').textContent = (a.status === 'picked' ? 'في الطريق للعميل' : 'في الطريق للمتجر') + ' · ' + a.code; $('lvSub').textContent = a.storeName || a.from || ''; }
}
function onOrders(l) {
    orders = l; if (!me) return;
    const ids = offers().map(o => o.id).sort().join(',');
    if (prevOffers !== null && ids !== prevOffers) { const old = prevOffers.split(','); if (ids.split(',').some(x => x && old.indexOf(x) < 0)) { try { HWOrders.beep(); } catch (e) {} HWOrders.toast('طلب جديد متاح'); } }
    prevOffers = ids; saveSeen();
    const a = mineOrders().filter(o => o.status === 'cancelled' && !seen['c' + o.id] && Date.now() - o.updatedAt < 6e5)[0];
    if (a) { seen['c' + a.id] = 1; HWOrders.toast('تم إلغاء الطلب ' + a.code); buzz(40); }
    render();
}

document.addEventListener('click', (e) => {
    let el;
    if ((el = e.target.closest('[data-take]'))) { takeOffer(el.dataset.take); return; }
    if ((el = e.target.closest('[data-dec]'))) { declineOffer(el.dataset.dec); return; }
    if ((el = e.target.closest('[data-step]'))) { stepAction(el.dataset.step, el.dataset.id); return; }
    if ((el = e.target.closest('#earnChips .chip'))) { earnRange = el.dataset.r; renderEarn(); return; }
});
try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
window.addEventListener('pageshow', (e) => { window.scrollTo(0, 0); if (e.persisted) location.reload(); });

document.addEventListener('DOMContentLoaded', () => {
    buildSplashIcons();
    $('demoBanner').style.display = HWDB.mode === 'local' ? '' : 'none';
    HWDemo.seed();
    const saved = readJSON(KEY, null);
    applyUser(saved && saved.id ? saved : null);
    if (saved && saved.id) setTimeout(() => { if (isOnline()) startGps(false); }, 1500);
    const splash = $('splash'); let skip = false;
    try { skip = sessionStorage.getItem('hw-skip-splash') === '1'; sessionStorage.removeItem('hw-skip-splash'); } catch (e) {}
    if (!saved) skip = false;
    if (skip) { splash.style.transition = 'none'; splash.classList.add('hide'); }
    introCtl = skip ? null : initIntroVideo();
    $('loginForm').addEventListener('submit', submitLogin);
    $('enterBtn').addEventListener('click', () => { if (me) finishLogin(); else openLogin(); });
    caps.subscribe(() => { if (me) render(); });
    settingsCol.subscribe(l => { const d = l.filter(x => x.id === 'dispatch')[0]; autoMode = !d || d.auto !== false; if (me) render(); });
    HWOrders.subscribe(onOrders);
    showScreen('screen-jobs');
    setInterval(() => {
        if (document.hidden || !me || cur !== 'screen-jobs') return;
        const lim = (CFG.offerSeconds || 45) * 1000, cards = document.querySelectorAll('.offer'), valid = offers();
        if (valid.length !== cards.length) { render(); return; }
        cards.forEach(c => { const oo = HWOrders.get(c.dataset.id), t = oo && oo.offerTo === me.id ? oo.offerAt : seen[c.dataset.id]; if (!t) return; const left = Math.max(0, Math.ceil((lim - (Date.now() - t)) / 1000)); c.querySelector('.of-bar i').style.width = (100 * left / (CFG.offerSeconds || 45)) + '%'; const m = c.querySelectorAll('.of-meta span'); m[m.length - 1].textContent = left + ' ث'; });
    }, 1000);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeSheet(); if (splash.classList.contains('login-mode') && !splash.classList.contains('hide')) closeLogin(); } });
});
