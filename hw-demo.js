/* =========================================================
   HIGHWAY — بيانات تجريبية (hw-demo.js)
   تعمل في الوضع التجريبي فقط (dbUrl فارغ) ولا تُنشأ أبدًا في الوضع الحقيقي.
   القوائم والأسعار والعروض والأكواد هنا أمثلة وهمية للتجربة.
   ========================================================= */
(function (g) {
  'use strict';
  function it(id, name, desc, price, extra) { return Object.assign({ id: id, name: name, desc: desc, price: price, on: true }, extra || {}); }
  function grp(id, name, min, max, choices) { return { id: id, name: name, min: min, max: max, choices: choices.map(function (c, i) { return { id: id + i, name: c[0], price: c[1] }; }) }; }
  /* خيارات جاهزة للأمثلة */
  var SIZE = grp('size', 'الحجم', 1, 1, [['عادي', 0], ['كبير', 0.75]]);
  var BURGER_X = grp('bx', 'إضافات', 0, 3, [['جبنة إضافية', 0.35], ['بيض', 0.4], ['هالبينو', 0.25]]);
  var COMBO = grp('combo', 'اجعلها وجبة', 0, 1, [['مع بطاطا ومشروب', 1.5]]);
  var SHAW_X = grp('sx', 'إضافات', 0, 2, [['ثومية إضافية', 0.15], ['بطاطا داخل الساندويش', 0.25]]);
  var COFFEE = grp('cs', 'السكر', 1, 1, [['سادة', 0], ['وسط', 0], ['حلو', 0]]);
  var MENUS = {
    nafeeseh: [['شرقية', [it('a1', 'كنافة بالجبنة', 'طازجة وساخنة', 3.0, { options: [grp('kw', 'الوزن', 1, 1, [['ربع كيلو', 0], ['نصف كيلو', 2.75]])] }), it('a2', 'بقلاوة', 'علبة صغيرة', 4.5), it('a3', 'قطايف', 'بالقشطة والمكسرات', 2.5)]], ['مشروبات', [it('b1', 'قهوة عربية', '', 1.0), it('b2', 'عصير طبيعي', 'حسب الموسم', 2.0)]]],
    hamada: [['الوجبات', [it('a1', 'وجبة مشاوي', 'مع الأرز والسلطة', 6.5, { prepMin: 30 }), it('a2', 'نصف دجاجة مشوية', 'مع بطاطا', 5.0, { prepMin: 25 }), it('a3', 'مقبلات مشكلة', 'حمص ومتبل وتبولة', 3.5)]], ['مشروبات', [it('b1', 'لبن', '', 0.75), it('b2', 'مشروب غازي', '', 0.6)]]],
    bullgurz: [['برغر', [it('a1', 'برغر كلاسيك', 'لحم بقري وجبنة', 3.75, { options: [BURGER_X, COMBO] }), it('a2', 'برغر دجاج', 'مقرمش مع صوص خاص', 3.5, { options: [BURGER_X, COMBO] }), it('a3', 'برغر مزدوج', 'قطعتان لحم', 5.0, { options: [BURGER_X, COMBO] })]], ['جانبية', [it('b1', 'بطاطا مقلية', '', 1.5, { options: [SIZE] }), it('b2', 'حلقات بصل', '', 1.75)]]],
    abuahmad: [['المناسف', [it('a1', 'منسف لحم (فرد)', 'مع اللبن والأرز', 6.0, { prepMin: 35 }), it('a2', 'منسف دجاج (فرد)', 'مع اللبن والأرز', 4.5, { prepMin: 30 }), it('a3', 'ربع منسف عائلي', 'يكفي ٢ إلى ٣', 12.0, { prepMin: 40 })]], ['إضافات', [it('b1', 'لبن جميد إضافي', '', 1.0), it('b2', 'سلطة', '', 1.0)]]],
    reef: [['الشاورما', [it('a1', 'شاورما دجاج', 'ساندويش عادي', 1.75, { options: [grp('sz', 'الحجم', 1, 1, [['عادي', 0], ['سوبر', 0.75], ['دبل', 1.25]]), SHAW_X] }), it('a2', 'شاورما لحم', 'ساندويش عادي', 2.25, { options: [SHAW_X] }), it('a3', 'وجبة شاورما', 'مع بطاطا ومشروب', 3.5)]], ['إضافات', [it('b1', 'بطاطا', '', 1.25), it('b2', 'مخلل', '', 0.5)]]],
    abusaleh: [['قهوة', [it('a1', 'قهوة تركية', '', 1.25, { options: [COFFEE] }), it('a2', 'نسكافيه', '', 1.5, { options: [SIZE] }), it('a3', 'شاي', 'إبريق صغير', 1.0)]], ['سناكس', [it('b1', 'كعكة', '', 1.5), it('b2', 'ساندويش جبنة', '', 1.75)]]],
    gulf: [['الأطباق', [it('a1', 'برياني دجاج', '', 4.5), it('a2', 'كبسة لحم', '', 5.5), it('a3', 'سمك مشوي', 'مع الأرز', 7.0, { prepMin: 30 })]], ['مشروبات', [it('b1', 'عصير ليمون بالنعناع', '', 1.75)]]],
    julnar: [['معجنات', [it('a1', 'فطيرة جبنة', '', 1.0), it('a2', 'فطيرة زعتر', '', 0.75), it('a3', 'مناقيش مشكلة', 'علبة ٤ قطع', 3.0)]], ['مشروبات', [it('b1', 'شاي', '', 0.75), it('b2', 'عصير', '', 1.25)]]]
  };
  var VERSION = '3';   // ارفعه لإعادة إنشاء البيانات التجريبية عند تغيّرها
  function seed() {
    if (g.HWDB.mode !== 'local') return;
    var fresh = localStorage.getItem('hw-demo-v') !== VERSION;
    var menus = g.HWDB.col('menus'), caps = g.HWDB.col('captains'), offers = g.HWDB.col('offers'), promos = g.HWDB.col('promos');
    [menus, caps, offers, promos].forEach(function (c) { c.subscribe(function () {})(); });
    Object.keys(MENUS).forEach(function (sid) {          // القوائم التجريبية فقط تُحدَّث، وما عدّله المتجر يبقى
      var cur = menus.get(sid);
      if (!cur || (fresh && cur.demo)) menus.replace(sid, { demo: true, cats: MENUS[sid].map(function (c, i) { return { id: 'c' + i, name: c[0], items: c[1] }; }) });
    });
    if (!offers.list().length && fresh) {
      offers.create({ id: 'of-nafeeseh', storeId: 'nafeeseh', title: 'خصم 15% على الحلويات', sub: 'للطلبات فوق 5 د.أ', percent: 15, minOrder: 5, active: true, demo: true });
      offers.create({ id: 'of-bullgurz', storeId: 'bullgurz', title: 'خصم 10% على البرغر', sub: 'للطلبات فوق 8 د.أ', percent: 10, minOrder: 8, active: true, demo: true });
    }
    if (!promos.get('HIGHWAY10')) promos.create({ id: 'HIGHWAY10', title: 'خصم 10% لأول طلب', type: 'percent', value: 10, max: 2, minOrder: 0, firstOrder: true, perUser: 1, active: true, demo: true });
    if (!promos.get('WELCOME')) promos.create({ id: 'WELCOME', title: 'دينار خصم', type: 'amount', value: 1, minOrder: 5, perUser: 1, active: true, demo: true });
    if (!caps.list().length) {
      [['k1', 'كابتن تجريبي ١', '0790000001'], ['k2', 'كابتن تجريبي ٢', '0790000002']].forEach(function (c) {
        caps.create({ id: c[0], name: c[1], phone: c[2], pin: g.HW_sha256('HWK|' + c[2] + '|1234'), active: true, online: false, demo: true });
      });
    }
    try { localStorage.setItem('hw-demo-v', VERSION); } catch (e) {}
  }
  g.HWDemo = { seed: seed, MENUS: MENUS };
})(window);
