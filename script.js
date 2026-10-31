/* =========================================================
   HIGHWAY Driver App — script.js
   ملف مُجمَّع من جزأين: (1) الشاشة الافتتاحية وتسجيل الدخول المشتركة
   (2) منطق تطبيق الكابتن: الاتصال والوردية، الخريطة ومناطق الطلب، العروض، مراحل التوصيل
       ورمز التسليم، الإبلاغ عن مشكلة، الأهداف، الأرباح والتسوية النقدية.
   يعتمد على: hw-config.js, hw-orders.js, hw-map.js, hw-food.js, hw-notify.js, hw-biz.js, hw-demo.js
   ========================================================= */
/* ---------- الشاشة الافتتاحية: رسومات الطعام العائمة ---------- */


function buildSplashIcons() {
    const wrap = document.getElementById('splashIcons');
    const SPL = HWFood.splashSet();   // رسومات الطعام المشتركة (hw-food.js)
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
   Driver App — HIGHWAY Delivery
   الطلبات والعروض، الخريطة ومناطق الطلب، الوردية، رمز التسليم،
   الإبلاغ عن مشكلة، الأهداف والمكافآت، الأرباح والتسوية النقدية.
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
const caps = HWDB.col('captains'), issuesCol = HWDB.col('issues');
let heatOn = false;

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
    if (id === 'screen-jobs' && homeMap) setTimeout(() => homeMap.invalidateSize(), 60);
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
    await caps.ready();                                  // قبل تحميل قائمة الكباتن لا نحكم على الرمز
    const hash = await HW_sha256('HWK|' + phone + '|' + pin);
    await new Promise(r => setTimeout(r, 300)); btn.classList.remove('loading');
    const c = caps.list().filter(x => x.phone === phone && x.pin === hash)[0];
    if (!c) { $('loginPassField').classList.add('invalid'); err.textContent = 'الرقم أو الرمز غير صحيح'; return; }
    if (c.active === false) { err.textContent = 'حسابك موقوف، تواصل مع الدعم'; return; }
    try { localStorage.setItem(KEY, JSON.stringify({ id: c.id, name: c.name, phone: c.phone })); } catch (e) {}
    applyUser({ id: c.id, name: c.name, phone: c.phone }); finishLogin(); render(); setTimeout(() => { ensureMap(); startGps(false); renderMapLayers(true); homeMap && homeMap.invalidateSize(); }, 700);
}
function logout() { if (me) caps.patch(me.id, { online: false }); stopGps(); try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); }

/* ---------- الاتصال والموقع ---------- */
/* حساب محذوف أو موقوف أو تسجيل دخول قديم من نسخة تجريبية: لا يمكن الاتصال، فنخرجه برسالة واضحة */
let acctChecked = false;
function checkAccount() {
    if (!me || !caps.loaded() || acctChecked || !caps.list().length) return;
    const d = caps.get(me.id);
    if (d && d.active !== false && (d.name || d.phone)) return;
    acctChecked = true;
    HWOrders.toast(d && d.active === false ? 'حسابك موقوف، تواصل مع الإدارة' : 'حسابك غير موجود، سجّل الدخول من جديد');
    setTimeout(() => { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); }, 2500);
}
function myDoc() { return me ? caps.get(me.id) || {} : {}; }
function isOnline() { return !!myDoc().online; }
function setOnline(v) {
    if (!v && active()) { HWOrders.toast('أنهِ طلبك الحالي قبل إنهاء الوردية'); return; }
    const start = myDoc().shiftStart;
    caps.patch(me.id, v ? { online: true, lastSeen: Date.now(), shiftStart: Date.now() } : { online: false, shiftStart: 0 }); buzz(15);
    if (v) { HWNotify.unlock(); HWNotify.play('status'); startGps(false); pushLoc(true); } else { HWNotify.stop('offer'); if (start) shiftSheet(start); }
    HWNotify.keepAwake(v); render();
}
let shareLoc = true, myPos = null, myAcc = 0;
try { shareLoc = localStorage.getItem('hwk-share') !== '0'; } catch (e) {}
function toggleGps() { shareLoc = !shareLoc; try { localStorage.setItem('hwk-share', shareLoc ? '1' : '0'); } catch (e) {} if (shareLoc && myPos) pushLoc(true); renderProfile(); }
/* تتبّع موقع الكابتن: يظهر دائمًا على خريطته، ويُرسل للمنسق فقط وهو متصل */
function startGps(manual) {
    if (!navigator.geolocation || gpsWatch != null) return;
    gpsWatch = navigator.geolocation.watchPosition(p => {
        myPos = [p.coords.latitude, p.coords.longitude]; myAcc = p.coords.accuracy || 0;
        updateMeMarker(myPos, myAcc); pushLoc(false);
    }, (e) => { if (e && e.code === 1) { gpsWatch = null; HWOrders.toast('فعّل إذن الموقع ليظهر موقعك على الخريطة'); } else if (manual) HWOrders.toast('تعذر الوصول إلى موقعك'); },
    { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
}
function pushLoc(force) {
    if (!me || !myPos || !shareLoc || !isOnline()) return;
    if (!force && Date.now() - lastGps < 15000) return; lastGps = Date.now();
    caps.patch(me.id, { lat: myPos[0], lng: myPos[1], lastSeen: Date.now() });
}
function stopGps() { if (gpsWatch != null) { navigator.geolocation.clearWatch(gpsWatch); gpsWatch = null; } }
setInterval(() => { if (me && isOnline()) caps.patch(me.id, { lastSeen: Date.now() }); }, 30000);

/* ---------- العروض ---------- */
function mineOrders() { return orders.filter(o => o.captain && o.captain.id === me.id); }
function active() { return mineOrders().filter(o => o.status === 'accepted' || o.status === 'picked').sort((a, b) => a.createdAt - b.createdAt)[0]; }
function offers() {
    if (!me || !isOnline()) return [];
    const now = Date.now(), lim = (CFG.offerSeconds || 45) * 1000, dec = myDoc().declined || [];
    return orders.filter(o => HWOrders.offerable(o)).filter(o => {
        if (o.offerTo === me.id) return now - (o.offerAt || 0) < lim;          /* عرض موجّه لي (حتى لو رفضته في دورة سابقة) */
        if (o.offerTo || !autoMode || dec.indexOf(o.id) >= 0) return false;    /* موجّه لغيري، أو الوضع يدوي، أو رفضته */
        return now - (o.createdAt || 0) > 90000 && (o.offered || []).indexOf(me.id) < 0;   /* احتياط: لم يتصرف أحد فيعرض للجميع */
    });
}
/* الإسناد التلقائي من جهة الكابتن أيضًا: إن لم تكن لوحة المنسقين مفتوحة، يحسب كل تطبيق
   ترتيب الكباتن المتاحين بنفس قاعدة اللوحة (الأقرب للمتجر ثم الأقدم انتظارًا)، ويأخذ العرض إن كان هو الأول */
/* متاح: متصل وظاهر حديثًا، أو مفعّل الإشعارات (تصله العروض والتطبيق مغلق) خلال 12 ساعة */
function capLive(c) { const age = Date.now() - (c.lastSeen || 0), push = !!(CFG.push && CFG.push.server && c.pushOn); return c.active !== false && c.online && (!c.lastSeen || age < 120000 || (push && age < 12 * 3600e3)); }
function selfDispatch() {
    if (!me || !autoMode || !isOnline() || active()) return;
    const now = Date.now(), lim = (CFG.offerSeconds || 45) * 1000, all = caps.list();
    const busy = {}, pend = {};
    orders.forEach(o => {
        if (o.captain && o.captain.id && (o.status === 'accepted' || o.status === 'picked')) busy[o.captain.id] = 1;
        if (o.offerTo && HWOrders.offerable(o) && now - (o.offerAt || 0) < lim + 2000) pend[o.offerTo] = o.id;
    });
    if (pend[me.id]) return;
    const dist = (c, o) => c.lat != null && o.storeLoc ? HWMap.est([c.lat, c.lng], [o.storeLoc.lat, o.storeLoc.lng]) : null;
    orders.filter(o => HWOrders.offerable(o)).sort((a, b) => a.createdAt - b.createdAt).some(o => {
        if (o.offerTo && now - (o.offerAt || 0) < lim + 2000) return false;
        let offered = (o.offered || []).slice(); if (o.offerTo && offered.indexOf(o.offerTo) < 0) offered.push(o.offerTo);
        const free = all.filter(c => capLive(c) && !busy[c.id] && !pend[c.id]);
        if (free.length && free.every(c => offered.indexOf(c.id) >= 0)) {           /* عُرض على الجميع: دورة جديدة (مثل لوحة الإدارة) */
            if (o.declinedAt && now - o.declinedAt < 30000) return false;              /* رُفض للتو: مهلة قصيرة قبل إعادة العرض */
            offered = [];
        }
        const cands = free.filter(c => offered.indexOf(c.id) < 0).sort((a, b) => {
            const da = dist(a, o), db = dist(b, o);
            if (da != null && db != null) return da - db; if (da != null) return -1; if (db != null) return 1; return (a.lastSeen || 0) - (b.lastSeen || 0);
        });
        if (!cands.length || cands[0].id !== me.id) return false;
        const d = dist(cands[0], o);
        HWOrders.update(o.id, { offerTo: me.id, offerAt: now, offered: offered.concat([me.id]), offerName: me.name, offerKm: d == null ? null : Math.round(d * 10) / 10 }, 'offer_sent');
        return true;
    });
}
setInterval(() => { try { selfDispatch(); } catch (e) {} }, 4000);
function saveSeen() { try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)); } catch (e) {} }
async function takeOffer(id) {
    if (active()) { HWOrders.toast('أنهِ طلبك الحالي أولًا'); return; }
    buzz(20);
    const ok = await HWOrders.claim(id, { id: me.id, name: me.name, phone: me.phone });
    if (ok) { HWOrders.toast('✓ الطلب لك، توجه للمتجر'); jobId = id; render(); } else { HWOrders.toast('سبقك كابتن آخر لهذا الطلب'); render(); }
}
function declineOffer(id) { const o = HWOrders.get(id); if (o && o.offerTo === me.id) HWOrders.update(id, { offerTo: null, offerAt: 0, declinedAt: Date.now(), offered: (o.offered || []).concat([me.id]) }); const d = (myDoc().declined || []).concat([id]).slice(-50); caps.patch(me.id, { declined: d }); buzz(); }
function earnOf(o) { const s = HWOrders.settle(o); return s.net; }

function offerCard(o) {
    const s = HWOrders.settle(o), t0 = o.offerTo === me.id ? o.offerAt : seen[o.id], left = Math.max(0, Math.ceil(((CFG.offerSeconds || 45) * 1000 - (Date.now() - t0)) / 1000));
    const pct = Math.max(0, 100 * left / (CFG.offerSeconds || 45));
    const mk = HWOrders.isMarket(o);
    return '<div class="offer" data-id="' + H(o.id) + '"><div class="of-top"><b>' + H(o.storeName || o.from || 'طلب') + '</b><span class="of-earn">+' + money(s.net) + ' د.أ</span></div>' +
        '<div class="of-route">من <b>' + H(o.from || o.storeName || '') + '</b><br>إلى <b>' + H((o.address && (o.address.label || o.address.area)) || o.to || '') + '</b></div>' +
        '<div class="of-meta">' + (mk ? '<span>ادفع للمتجر ' + money(s.items) + ' د.أ</span><span>تحصّل ' + money(s.collected) + ' د.أ</span>' : '<span>توصيل</span>') + '<span>رسوم التوصيل ' + money(s.fee) + '</span>' + (o.distKm ? '<span>' + o.distKm + ' كم</span>' : '') + '<span>' + left + ' ث</span></div>' +
        '<div class="of-act"><button type="button" class="submit-btn" data-take="' + H(o.id) + '"><span class="btn-label">قبول الطلب</span></button><button type="button" class="ghost-btn" data-dec="' + H(o.id) + '">رفض</button></div>' +
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
        (toStore ? (mk ? '<div><span>تدفعه للمتجر نقدًا</span><b>' + money2(s.items) + '</b></div><div><span>حالة المتجر</span><b>' + (o.storeState === 'ready' ? 'جاهز ✓' : 'قيد التحضير') + '</b></div>' : '<div><span>من</span><b>' + H(o.from || '') + '</b></div>')
            : '<div><span>العنوان</span><b>' + H(((o.address && (o.address.label || o.address.area)) || o.to || '') + (o.address && o.address.details ? ' · ' + o.address.details : '')) + '</b></div>' + (mk ? '<div><span>تحصّل من العميل</span><b>' + money2(s.collected) + '</b></div>' : '')) + '</div>' +
        '<div class="act-btns"><a href="' + HWOrders.openNav(navTarget(o)) + '" target="_blank" rel="noopener">🧭 افتح الخريطة</a>' + (phone ? '<a href="tel:' + H(phone) + '">📞 اتصال</a>' : '') + '<button type="button" onclick="openJob(\'' + o.id + '\')">التفاصيل</button><button type="button" class="prob" onclick="openIssue(\'' + o.id + '\')">مشكلة؟</button></div>' +
        (st ? '<button type="button" class="submit-btn" style="margin-top:12px" data-step="' + st.k + '" data-id="' + o.id + '"><span class="btn-label">' + st.t + '</span></button>' : '') + '</div>';
}
function stepAction(k, id) {
    const o = HWOrders.get(id); if (!o) return; buzz(18);
    const s = HWOrders.settle(o);
    if (k === 'arrS') HWOrders.update(id, { arrivedStore: true }, 'arrived_store');
    else if (k === 'arrC') HWOrders.update(id, { arrivedCustomer: true }, 'arrived_customer');
    else if (k === 'pick') {
        if (HWOrders.isMarket(o)) sheet('<div class="sh-head"><div><small>' + H(o.code) + '</small><h3>ادفع للمتجر</h3></div></div><div class="pay-big"><div class="big">' + money(s.items) + ' د.أ</div><p class="mut">ادفع هذا المبلغ نقدًا لـ ' + H(o.storeName) + ' واستلم الطلب' + (o.storeState !== 'ready' ? '<br><b style="color:var(--danger)">تنبيه: المتجر لم يؤكد أن الطلب جاهز</b>' : '') + '</p></div><button type="button" class="submit-btn" onclick="confirmPick(\'' + id + '\')"><span class="btn-label">دفعت واستلمت</span></button>');
        else confirmPick(id);
    } else if (k === 'done') {
        if (HWOrders.isMarket(o)) sheet('<div class="sh-head"><div><small>' + H(o.code) + '</small><h3>حصّل من العميل</h3></div></div><div class="pay-big"><div class="big">' + money(s.collected) + ' د.أ</div><p class="mut">المنتجات ' + money(s.items) + ' + التوصيل ' + money(s.fee) + (s.promo ? ' − كود خصم ' + money(s.promo) : '') + '</p></div>' +
            (o.pin ? '<div class="pin-in"><label for="pinIn">رمز التسليم من العميل</label><input id="pinIn" inputmode="numeric" maxlength="4" autocomplete="off" placeholder="• • • •" dir="ltr"><small class="mut">يظهر الرمز في تطبيق العميل</small></div>' : '') +
            '<button type="button" class="submit-btn" onclick="confirmDone(\'' + id + '\')"><span class="btn-label">استلمت المبلغ وسلّمت الطلب</span></button>' +
            (o.pin ? '<button type="button" class="more-link" style="margin-top:10px" onclick="noPin(\'' + id + '\')">العميل لا يملك الرمز</button>' : ''));
        else confirmDone(id);
    }
}
function confirmPick(id) { closeSheet(); HWOrders.update(id, { status: 'picked', pickedPaid: true }); }
function confirmDone(id, skipPin) {
    const o = HWOrders.get(id); if (!o) return;
    if (o.pin && HWOrders.isMarket(o) && !skipPin) {
        const v = ($('pinIn').value || '').replace(/\D/g, '');
        if (v !== String(o.pin)) { $('pinIn').classList.add('bad'); HWOrders.toast('الرمز غير صحيح، اطلبه من العميل'); buzz(40); return; }
    }
    closeSheet(); HWOrders.update(id, { status: 'delivered', cashCollected: true, pinOk: !skipPin }); HWOrders.toast('✓ تم التسليم، أحسنت!'); jobId = null; if (cur === 'screen-job') goBack();
}
function noPin(id) {                                   // التسليم بدون رمز يُسجَّل كبلاغ لمراجعة الإدارة
    if (!confirm('تأكيد التسليم بدون رمز؟ سيُسجَّل ذلك لمراجعة الإدارة.')) return;
    reportIssue(id, 'تسليم بدون رمز', ''); confirmDone(id, true);
}

/* ---------- الإبلاغ عن مشكلة (تصل للوحة الإدارة) ---------- */
const ISSUES = ['المتجر مغلق أو لا يرد', 'تأخر تحضير الطلب', 'العميل لا يرد', 'العنوان غير صحيح', 'عطل أو حادث في الطريق', 'أخرى'];
function openIssue(id) {
    const o = HWOrders.get(id); if (!o) return;
    sheet('<div class="sh-head"><div><small>' + H(o.code) + '</small><h3>ما المشكلة؟</h3></div></div><div class="iss">' + ISSUES.map((r, i) => '<button type="button" class="chip" data-iss="' + i + '">' + r + '</button>').join('') + '</div>' +
        '<div class="field"><label for="issNote">تفاصيل <span class="opt">(اختياري)</span></label><textarea id="issNote" rows="2"></textarea></div>' +
        '<button type="button" class="submit-btn" onclick="sendIssue(\'' + id + '\')"><span class="btn-label">إرسال للإدارة</span></button>' +
        '<a class="ghost-btn wide" style="margin-top:8px;display:block;text-align:center" href="https://wa.me/962791819432?text=' + encodeURIComponent('كابتن ' + me.name + ' — مشكلة في الطلب ' + o.code) + '" target="_blank" rel="noopener">تواصل مع الدعم عبر واتساب</a>');
}
function sendIssue(id) {
    const on = document.querySelector('.iss .chip.on'); if (!on) { HWOrders.toast('اختر نوع المشكلة'); return; }
    reportIssue(id, ISSUES[+on.dataset.iss], ($('issNote').value || '').trim()); closeSheet(); HWOrders.toast('تم إبلاغ الإدارة، سنتواصل معك'); buzz(20);
}
function reportIssue(id, reason, note) {
    const o = HWOrders.get(id) || {};
    issuesCol.create({ orderId: id, code: o.code || '', storeName: o.storeName || '', captain: { id: me.id, name: me.name, phone: me.phone }, reason, note, at: Date.now(), status: 'open' });
    HWOrders.update(id, { hasIssue: true }, 'issue');
}

/* ---------- الوردية ---------- */
function shiftStats(from) {
    const l = mineOrders().filter(o => o.status === 'delivered' && (o.updatedAt || o.createdAt) >= from);
    return l.reduce((a, o) => { const s = HWOrders.settle(o); a.n++; a.net += s.net; a.col += s.collected; a.due += s.due; a.km += Number(o.distKm) || 0; return a; }, { n: 0, net: 0, col: 0, due: 0, km: 0 });
}
function dur(ms) { const m = Math.max(0, Math.round(ms / 60000)); return (m >= 60 ? Math.floor(m / 60) + ' س ' : '') + (m % 60) + ' د'; }
function shiftSheet(start) {
    const t = shiftStats(start);
    sheet('<div class="sh-head"><div><small>انتهت ورديتك</small><h3>ملخص الوردية</h3></div></div><div class="eg-grid">' +
        '<div class="eg hi"><small>صافي أرباح الوردية</small><b>' + money2(t.net) + '</b></div><div class="eg"><small>المدة</small><b>' + dur(Date.now() - start) + '</b></div>' +
        '<div class="eg"><small>طلبات مسلّمة</small><b>' + t.n + '</b></div><div class="eg"><small>المسافة</small><b>' + t.km.toFixed(1) + ' كم</b></div>' +
        '<div class="eg warn" style="grid-column:1/-1"><small>' + (t.due < 0 ? 'لك عند المنصة (أكواد خصم العملاء)' : 'المستحق للمنصة من هذه الوردية') + '</small><b>' + money2(Math.abs(t.due)) + '</b></div></div>' +
        '<button type="button" class="submit-btn" onclick="closeSheet()"><span class="btn-label">تم</span></button>');
}
function shiftStrip() {
    const d = myDoc(); if (!d.online || !d.shiftStart) return '';
    const t = shiftStats(d.shiftStart);
    return '<div class="shift"><div><small>ورديتك</small><b>' + dur(Date.now() - d.shiftStart) + '</b></div><div><small>طلبات</small><b>' + t.n + '</b></div><div><small>أرباح</small><b>' + money(t.net) + '</b></div></div>';
}
/* ---------- الأهداف والمكافآت (تضعها الإدارة) ---------- */
function targetsBox() {
    const done = mineOrders().filter(o => o.status === 'delivered' && HWOrders.isToday(o.updatedAt || o.createdAt)).length;
    return HWBiz.todayTargets().map(t => { const p = Math.min(100, Math.round(done / t.count * 100)), ok = done >= t.count;
        return '<div class="tgt' + (ok ? ' ok' : '') + '"><div class="tgt-t"><b>' + H(t.title || ('أكمل ' + t.count + ' طلبات اليوم')) + '</b><span>' + (ok ? 'تم ✓ ' : '') + 'مكافأة ' + money(t.bonus) + ' د.أ</span></div><div class="tgt-bar"><i style="width:' + p + '%"></i></div><small>' + Math.min(done, t.count) + ' من ' + t.count + ' طلبات</small></div>'; }).join('');
}
function annBox() { return HWBiz.announcements('drivers').slice(0, 2).map(a => '<div class="ann-k"><b>' + H(a.title) + '</b>' + (a.body ? '<small>' + H(a.body) + '</small>' : '') + '</div>').join(''); }
/* ---------- مناطق الطلب: أين تتركز الطلبات في آخر ٣ ساعات ---------- */
function heatSpots() {
    const since = Date.now() - 3 * 3600e3, cells = {};
    orders.filter(o => o.createdAt > since && o.storeLoc).forEach(o => {
        const k = (Math.round(o.storeLoc.lat * 100) / 100) + ',' + (Math.round(o.storeLoc.lng * 100) / 100);
        cells[k] = (cells[k] || 0) + 1;
    });
    return Object.keys(cells).map(k => { const p = k.split(',').map(Number); return { p, n: cells[k] }; });
}
function toggleHeat() { heatOn = !heatOn; buzz(); mapSig = ''; renderMapLayers(true); $('heatBtn').classList.toggle('on', heatOn); }
function sheet(h) { $('sheetBody').innerHTML = h; $('sheet').classList.add('show'); }
function closeSheet() { $('sheet').classList.remove('show'); }
function openJob(id) { jobId = id; goTo('screen-job'); }

/* خريطة الصفحة الرئيسية: موقعي بالضبط + الطلب الحالي أو العروض القريبة */
let homeMap = null, meMk = null, accMk = null, ordLayer = null, mapSig = '', followMe = true;
function ensureMap() {
    if (homeMap || !window.HWMap) return;
    const d = myDoc(), start = myPos || (d.lat != null ? [d.lat, d.lng] : HWMap.center());
    homeMap = HWMap.create($('actMapEl'), { center: start, zoom: 15 });
    ordLayer = L.layerGroup().addTo(homeMap);
    homeMap.on('dragstart', () => { followMe = false; });
}
function updateMeMarker(pos, acc) {
    if (!homeMap) return;
    if (!meMk) { meMk = L.marker(pos, { icon: HWMap.ICON.me(), interactive: false, zIndexOffset: 800 }).addTo(homeMap); accMk = L.circle(pos, { radius: acc || 0, color: '#25CED1', weight: 1, opacity: .5, fillColor: '#25CED1', fillOpacity: .12, interactive: false }).addTo(homeMap); }
    else { meMk.setLatLng(pos); accMk.setLatLng(pos); accMk.setRadius(acc || 0); }
    if (followMe && !mapSig) homeMap.setView(pos, Math.max(homeMap.getZoom(), 15), { animate: true });
}
function recenter() { if (!homeMap) return; followMe = true; mapSig = ''; renderMapLayers(true); if (myPos) homeMap.setView(myPos, 16, { animate: true }); else startGps(true); buzz(); }
function renderMapLayers(force) {
    ensureMap(); if (!homeMap) return;
    const a = active(), of = a ? [] : offers();
    const sig = (a ? 'a' + a.id + a.status : of.map(o => o.id).join(',')) + (heatOn ? '|h' : '');
    if (!force && sig === mapSig) return; mapSig = sig; ordLayer.clearLayers();
    const pts = myPos ? [myPos] : [];
    if (a && a.address && a.address.lat != null) {
        const sl = a.storeLoc ? [a.storeLoc.lat, a.storeLoc.lng] : HWMap.center(), dl = [a.address.lat, a.address.lng];
        ordLayer.addLayer(HWMap.line(homeMap, a.route || [sl, dl]));
        L.marker(sl, { icon: HWMap.ICON.store(a.storeId || ''), interactive: false }).addTo(ordLayer);
        L.marker(dl, { icon: HWMap.ICON.home(), interactive: false }).addTo(ordLayer);
        pts.push(sl, dl);
    } else of.forEach(o => { if (o.storeLoc) { const p = [o.storeLoc.lat, o.storeLoc.lng]; L.marker(p, { icon: HWMap.ICON.store(o.storeId || ''), interactive: false }).addTo(ordLayer); pts.push(p); } });
    if (heatOn && !a) heatSpots().forEach(h => L.circle(h.p, { radius: 350 + h.n * 90, stroke: false, fillColor: '#E8EF44', fillOpacity: Math.min(.65, .2 + h.n * .1), interactive: false }).addTo(ordLayer));
    if (sig.replace('|h', '') && pts.length > 1) { followMe = false; HWMap.fit(homeMap, pts, [44, 44]); }
    else if (myPos) homeMap.setView(myPos, 15, { animate: false });
    const lbl = $('mapLbl'); if (lbl) lbl.textContent = a ? (a.status === 'picked' ? 'الطريق إلى العميل' : 'الطريق إلى المتجر') : of.length ? of.length + ' طلب بالقرب منك' : (myPos ? 'موقعك الآن' : 'جاري تحديد موقعك…');
}
function renderJobs() {
    const on = isOnline();
    $('onlineCard').className = 'online-card' + (on ? ' on' : '');
    $('onlineCard').innerHTML = '<div class="oc-t"><b>' + (on ? 'أنت متصل' : 'أنت غير متصل') + '</b><small>' + (on ? 'تصلك الطلبات الجديدة مباشرة' : 'اتصل لتستقبل الطلبات') + '</small></div><button type="button" class="sw' + (on ? ' on' : '') + '" onclick="setOnline(' + (!on) + ')" aria-label="تبديل الاتصال"></button>';
    $('netDot').classList.toggle('on', on);
    $('shiftBox').innerHTML = annBox() + shiftStrip() + (on ? targetsBox() : '');
    const a = active(); renderMapLayers(false); $('activeBox').innerHTML = a ? '<h3 class="sec-t">طلبك الحالي</h3>' + activeCard(a) : '';
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
        (mk ? '<h3 class="sec-t">المنتجات</h3><div class="cart-card">' + o.items.map(l => '<div class="cl ro"><div class="cl-txt"><b>' + l.qty + '× ' + H(l.name) + '</b>' + (l.opts && l.opts.length ? '<small>' + H(HWBiz.optsText(l.opts)) + '</small>' : '') + (l.notes ? '<small>' + H(l.notes) + '</small>' : '') + '</div></div>').join('') + (o.notes ? '<p class="mut">ملاحظة: ' + H(o.notes) + '</p>' : '') + '</div>' : '') +
        '<h3 class="sec-t">الحساب</h3><div class="cart-card sum">' + (mk ? '<div><span>تدفع للمتجر</span><b>' + money2(s.items) + '</b></div><div><span>تحصّل من العميل</span><b>' + money2(s.collected) + '</b></div>' : '') + '<div><span>رسوم التوصيل</span><b>' + money2(s.fee) + '</b></div><div><span>عمولة المنصة (' + Math.round((CFG.commissionRate || .1) * 100) + '٪)</span><b>−' + money2(s.commission) + '</b></div><div class="tot"><span>صافي أرباحك</span><b>' + money2(s.net) + '</b></div></div>' +
        '<h3 class="sec-t">السجل</h3><div class="cart-card">' + HWOrders.timeline(o) + '</div>' +
        (o.status === 'accepted' || o.status === 'picked' ? '<button type="button" class="ghost-btn wide" onclick="openIssue(\'' + o.id + '\')">الإبلاغ عن مشكلة في الطلب</button>' : '');
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
        '<div class="eg"><small>طلبات مسلّمة</small><b>' + t.n + '</b></div><div class="eg"><small>رسوم التوصيل</small><b>' + money2(t.fee) + '</b></div>' +
        '<div class="eg"><small>حصّلت من العملاء</small><b>' + money2(t.col) + '</b></div><div class="eg"><small>دفعت للمطاعم</small><b>' + money2(t.items) + '</b></div>' +
        '<div class="eg warn" style="grid-column:1/-1"><small>عمولة المنصة (' + Math.round((CFG.commissionRate || .1) * 100) + '٪ من التوصيل)</small><b>' + money2(t.com) + '</b></div></div>' +
        settleCard() +
        '<h3 class="sec-t">الطلبات</h3><div class="cart-card">' + (list.length ? list.slice().sort((a, b) => b.updatedAt - a.updatedAt).map(o => '<div class="er"><div><b>' + H(o.storeName || o.from || '') + '</b><small>' + H(o.code) + ' · ' + HWOrders.ago(o.updatedAt || o.createdAt) + '</small></div><b>+' + money(earnOf(o)) + '</b></div>').join('') : '<p class="mut">لا توجد طلبات في هذه الفترة</p>') + '</div>';
}
/* التسوية النقدية: ما لم تسلّمه للمنصة بعد (تُسجّلها الإدارة عند الاستلام) */
function settleCard() {
    const open = mineOrders().filter(o => o.status === 'delivered' && !o.settledAt);
    const due = HWBiz.r2(open.reduce((n, o) => n + HWOrders.settle(o).due, 0)), last = mineOrders().filter(o => o.settledAt).sort((a, b) => b.settledAt - a.settledAt)[0];
    return '<div class="settle' + (due > 0 ? ' due' : '') + '"><div><small>التسوية النقدية</small><b>' + (due > 0 ? 'عليك للمنصة ' + money2(due) : due < 0 ? 'لك عند المنصة ' + money2(-due) : 'لا يوجد مستحقات') + '</b>' +
        '<span>' + countTxt(open.length) + ' غير مسوّاة' + (last ? ' · آخر تسوية ' + new Date(last.settledAt).toLocaleDateString('ar-JO') : '') + '</span></div></div>';
}
function countTxt(n) { return n === 1 ? 'طلب واحد' : n === 2 ? 'طلبان' : n + ' طلبات'; }
function renderProfile() {
    $('pfGps').textContent = shareLoc ? 'تعمل وأنت متصل' : 'متوقفة';
    const r = HWBiz.captainRating(me.id, orders);
    $('pfRate').textContent = r.n ? '★ ' + r.avg.toFixed(1) + ' (' + r.n + ')' : 'لا يوجد بعد';
}
function render() {
    if (!me) return;
    if (cur === 'screen-jobs') renderJobs(); else if (cur === 'screen-job') renderJob(); else if (cur === 'screen-earn') renderEarn(); else renderProfile();
    const a = active(), bar = $('liveBar'), show = !!a && cur !== 'screen-jobs';
    bar.classList.toggle('show', show); if (a) { $('lvTitle').textContent = (a.status === 'picked' ? 'في الطريق للعميل' : 'في الطريق للمتجر') + ' · ' + a.code; $('lvSub').textContent = a.storeName || a.from || ''; }
}
function onOrders(l) {
    orders = l; if (!me) return;
    const ids = offers().map(o => o.id).sort().join(',');
    if (prevOffers !== null && ids !== prevOffers) { const old = prevOffers.split(','); if (ids.split(',').some(x => x && old.indexOf(x) < 0)) { HWOrders.toast('طلب جديد متاح'); HWNotify.notify('HIGHWAY · طلب جديد', 'لديك عرض توصيل جديد'); } }
    prevOffers = ids; saveSeen();
    if (ids && !active()) HWNotify.ring('offer', 'offer', 3000); else HWNotify.stop('offer');   /* يرن حتى يقبل الكابتن أو يرفض أو تنتهي المهلة */
    const a = mineOrders().filter(o => o.status === 'cancelled' && !seen['c' + o.id] && Date.now() - o.updatedAt < 6e5)[0];
    if (a) { seen['c' + a.id] = 1; HWOrders.toast('تم إلغاء الطلب ' + a.code); HWNotify.play('alert'); buzz(40); }
    render();
}

document.addEventListener('click', (e) => {
    let el;
    if ((el = e.target.closest('[data-take]'))) { takeOffer(el.dataset.take); return; }
    if ((el = e.target.closest('[data-dec]'))) { declineOffer(el.dataset.dec); return; }
    if ((el = e.target.closest('[data-step]'))) { stepAction(el.dataset.step, el.dataset.id); return; }
    if ((el = e.target.closest('#earnChips .chip'))) { earnRange = el.dataset.r; renderEarn(); return; }
    if ((el = e.target.closest('.iss .chip'))) { document.querySelectorAll('.iss .chip').forEach(c => c.classList.toggle('on', c === el)); buzz(); return; }
});
try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}
window.addEventListener('pageshow', (e) => { window.scrollTo(0, 0); if (e.persisted) location.reload(); });

window.HWNotifyAskPerm = true;
/* عند عودة التطبيق للواجهة: تحديث "آخر ظهور" فورًا ليبقى الكابتن ضمن المتاحين، ثم الإسناد */
document.addEventListener('visibilitychange', () => {
    if (document.hidden || !me || !isOnline()) return;
    caps.patch(me.id, { lastSeen: Date.now() }); HWNotify.keepAwake(true);
    setTimeout(() => { try { selfDispatch(); } catch (e) {} render(); }, 300);
});
document.addEventListener('DOMContentLoaded', () => {
    buildSplashIcons();
    $('demoBanner').style.display = HWDB.mode === 'local' ? '' : 'none';
    HWDemo.seed();
    const saved = readJSON(KEY, null);
    applyUser(saved && saved.id ? saved : null);
    if (saved && saved.id) setTimeout(() => { ensureMap(); startGps(false); renderMapLayers(true); }, 600);
    const splash = $('splash'); let skip = false;
    try { skip = sessionStorage.getItem('hw-skip-splash') === '1'; sessionStorage.removeItem('hw-skip-splash'); } catch (e) {}
    if (!saved) skip = false;
    if (skip) { splash.style.transition = 'none'; splash.classList.add('hide'); }
    introCtl = skip ? null : initIntroVideo();
    $('loginForm').addEventListener('submit', submitLogin);
    $('enterBtn').addEventListener('click', () => { if (me) finishLogin(); else openLogin(); });
    caps.subscribe(() => { if (me) { checkAccount(); render(); } });
    HWBiz.targets.subscribe(() => { if (me) render(); }); HWBiz.announcementsCol.subscribe(() => { if (me) render(); });
    settingsCol.subscribe(l => { const d = l.filter(x => x.id === 'dispatch')[0]; autoMode = !d || d.auto !== false; if (me) render(); });
    HWOrders.subscribe(onOrders);
    HWPush.init('captain', () => me && me.id, { open: () => { if (me) tabGo('screen-jobs'); } });
    showScreen('screen-jobs');
    setInterval(() => {
        if (document.hidden || !me || cur !== 'screen-jobs') return;
        const lim = (CFG.offerSeconds || 45) * 1000, cards = document.querySelectorAll('.offer'), valid = offers();
        if (!valid.length || active()) HWNotify.stop('offer');
        if (valid.length !== cards.length) { render(); return; }
        cards.forEach(c => { const oo = HWOrders.get(c.dataset.id), t = oo && oo.offerTo === me.id ? oo.offerAt : seen[c.dataset.id]; if (!t) return; const left = Math.max(0, Math.ceil((lim - (Date.now() - t)) / 1000)); c.querySelector('.of-bar i').style.width = (100 * left / (CFG.offerSeconds || 45)) + '%'; const m = c.querySelectorAll('.of-meta span'); m[m.length - 1].textContent = left + ' ث'; });
    }, 1000);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeSheet(); if (splash.classList.contains('login-mode') && !splash.classList.contains('hide')) closeLogin(); } });
});
