/* Распознавание еды для приложения.
   — Штрихкод: камера → код (BarcodeDetector или ZXing) → Open Food Facts (бесплатно, без ключа).
   — Фото еды, этикетка и текст «Вручную»: функция food-ai на Supabase (Gemini). Работает,
     только если в config.js задан адрес сервера и приложение открыто в Telegram.
   Данные Open Food Facts распространяются по лицензии ODbL: https://world.openfoodfacts.org */
(function () {
  'use strict';
  const OFF = 'https://world.openfoodfacts.org/api/v2/product/';
  const OFF_FIELDS = 'code,product_name,product_name_ru,generic_name_ru,brands,quantity,serving_quantity,product_quantity,nutriments';
  let zxing = null;

  function cfg() { return window.GYM_CONFIG || {}; }
  function tg() { return window.Telegram && window.Telegram.WebApp; }
  function aiReady() { const t = tg(); return !!(cfg().API_BASE && t && t.initData); }

  /* ---------- штрихкод ---------- */
  const scriptBase = document.currentScript ? document.currentScript.src : location.href;
  function loadZxing() {
    if (window.ZXing) return Promise.resolve(window.ZXing);
    if (zxing) return zxing;
    zxing = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = new URL('vendor/zxing.min.js', scriptBase).href;
      s.onload = () => resolve(window.ZXing);
      s.onerror = () => { zxing = null; reject(new Error('zxing')); };
      document.head.appendChild(s);
    });
    return zxing;
  }

  async function bitmapFrom(source) {
    // source: File/Blob или dataURL. Большие фото уменьшаем до 1600 px — штрихкод так читается надёжнее и быстрее.
    const blob = typeof source === 'string' ? await (await fetch(source)).blob() : source;
    const bmp = await createImageBitmap(blob);
    const k = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return c;
  }

  async function decodeBarcode(source) {
    const canvas = await bitmapFrom(source);
    if ('BarcodeDetector' in window) {
      try {
        const det = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
        const found = await det.detect(canvas);
        if (found && found[0] && found[0].rawValue) return found[0].rawValue;
      } catch (e) { /* нет поддержки форматов — ZXing ниже */ }
    }
    const Z = await loadZxing();
    const hints = new Map();
    hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E, Z.BarcodeFormat.CODE_128]);
    hints.set(Z.DecodeHintType.TRY_HARDER, true);
    const reader = new Z.MultiFormatReader();
    reader.setHints(hints);
    const tryCanvas = (cv) => {
      const lum = new Z.HTMLCanvasElementLuminanceSource(cv);
      for (const Binarizer of [Z.HybridBinarizer, Z.GlobalHistogramBinarizer]) {
        try { return reader.decode(new Z.BinaryBitmap(new Binarizer(lum))).getText(); } catch (e) { /* дальше */ }
      }
      return null;
    };
    let text = tryCanvas(canvas);
    if (!text) { // штрихкод может быть повёрнут — пробуем на 90°
      const r = document.createElement('canvas'); r.width = canvas.height; r.height = canvas.width;
      const x = r.getContext('2d'); x.translate(r.width / 2, r.height / 2); x.rotate(Math.PI / 2); x.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
      text = tryCanvas(r);
    }
    return text;
  }

  function num(v) { const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : null; }

  async function lookupBarcode(code) {
    const clean = String(code || '').replace(/\D/g, '');
    if (clean.length < 8) return null;
    const r = await fetch(OFF + clean + '.json?fields=' + OFF_FIELDS, { headers: { Accept: 'application/json' } });
    if (r.status === 404) return null;
    if (!r.ok) throw new Error('off_' + r.status);
    const data = await r.json();
    const p = data && data.status === 1 ? data.product : null;
    if (!p) return null;
    const n = p.nutriments || {};
    let kcal = num(n['energy-kcal_100g']);
    if (kcal == null && num(n['energy_100g']) != null) kcal = Math.round(num(n['energy_100g']) / 4.184); // кДж → ккал
    if (kcal == null) return null; // без калорийности такой продукт бесполезен в дневнике
    const title = String(p.product_name_ru || p.product_name || p.generic_name_ru || '').trim();
    const brand = p.brands ? String(p.brands).split(',')[0].trim() : '';
    const withBrand = brand && !title.toLowerCase().includes(brand.toLowerCase()) ? [title, brand].filter(Boolean).join(', ') : title || brand;
    const name = withBrand || 'Продукт ' + clean;
    const serving = num(p.serving_quantity) || 100;
    const per = { k: kcal, p: num(n.proteins_100g) || 0, c: num(n.carbohydrates_100g) || 0, f: num(n.fat_100g) || 0 };
    const extra = { fib: num(n.fiber_100g), sug: num(n.sugars_100g), salt: num(n.salt_100g) };
    const g = Math.max(1, Math.min(1000, Math.round(serving)));
    const m = g / 100;
    const item = { n: name.slice(0, 80), g, k: Math.round(per.k * m), p: Math.round(per.p * m), c: Math.round(per.c * m), f: Math.round(per.f * m) };
    Object.keys(extra).forEach((key) => { if (extra[key] != null) item[key] = Math.round(extra[key] * m * 10) / 10; });
    return { code: clean, item, source: 'Open Food Facts' };
  }

  /* ---------- ИИ (Gemini через Supabase) ---------- */
  async function ai(body) {
    if (!aiReady()) throw new Error('no_ai');
    const r = await fetch(cfg().API_BASE.replace(/\/$/, '') + '/food-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Telegram-Init-Data': tg().initData },
      body: JSON.stringify(body)
    });
    const res = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(res.error || 'ai_' + r.status); e.code = res.error; throw e; }
    return { dish: res.dish || null, items: (res.items || []).map(clampItem).filter(Boolean) };
  }
  function clampItem(it) {
    if (!it || !it.name) return null;
    const g = Math.max(1, Math.min(2000, Math.round(Number(it.grams) || 100)));
    const v = (x, max) => Math.max(0, Math.min(max, Math.round(Number(x) || 0)));
    return { n: String(it.name).slice(0, 80), g, k: v(it.kcal, 5000), p: v(it.protein, 500), c: v(it.carbs, 800), f: v(it.fat, 500) };
  }
  function recognizePhoto(mode, dataUrl) { return ai({ mode: mode === 'label' ? 'label' : 'food', image: dataUrl }); }
  function parseText(text) { return ai({ mode: 'text', text: String(text || '').slice(0, 600) }); }

  window.GymFood = Object.freeze({ aiReady, decodeBarcode, lookupBarcode, recognizePhoto, parseText });
})();
