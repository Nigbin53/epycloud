/* LatticeLoader — из React Bits (reactbits.dev/micro/lattice-loader), вариант JS-CSS.
   Copyright (c) 2026 David Haz — MIT + Commons Clause (https://github.com/DavidHDev/react-bits).
   Перенос React-компонента на обычный JS: LatticeLoader.html(opts) отдаёт ту же разметку,
   секундомер тикает сам у всех лоадеров в состоянии working (data-ll-start = Date.now() старта). */
(() => {
'use strict';
const PATTERNS = {
  arrow: { 3: { cells: [1, 2, 3, 0, 1, 2, 1, 2, 3], loop: 7.2, scale: 1 } },
  dots: { 3: { cells: [0, 1, 2, 0, 1, 2, 0, 1, 2], loop: 3, scale: 2.4 } },
  ripple: { 3: { cells: [2, 1, 2, 1, 0, 1, 2, 1, 2], loop: 4.8, scale: 1.5 } },
  spiral: { 3: { cells: [0, 1, 2, 7, 8, 3, 6, 5, 4], loop: 9, scale: 1.2, lit: 0.35 } },
  orbit: {
    3: { cells: [0, 1, 2, 7, null, 3, 6, 5, 4], loop: 8, scale: 1.2 },
    4: { cells: [0, 1, 2, 3, 11, null, null, 4, 10, null, null, 5, 9, 8, 7, 6], loop: 6, scale: 1.2, lit: 0.45 }
  },
  snake: {
    3: { cells: [0, 1, 2, 5, 4, 3, 6, 7, 8], loop: 9, scale: 1, lit: 0.35 },
    4: { cells: [0, 1, 2, 3, 7, 6, 5, 4, 8, 9, 10, 11, 15, 14, 13, 12], loop: 16, scale: 1, lit: 0.25 }
  },
  sweep: { 4: { cells: [0, 1, 2, 3, 1, 2, 3, 4, 2, 3, 4, 5, 3, 4, 5, 6], loop: 5, scale: 1, lit: 0.45 } },
  spin: { 4: { cells: [0, 0, 1, 1, 0, 0, 1, 1, 3, 3, 2, 2, 3, 3, 2, 2], loop: 4, scale: 1.6, lit: 0.35 } },
  rain: { 4: { cells: [0, 2, 1, 3, 1, 3, 2, 4, 2, 4, 3, 5, 3, 5, 4, 6], loop: 4, scale: 1.2, lit: 0.35 } },
  pulse: { 4: { cells: [2, 1, 1, 2, 1, 0, 0, 1, 1, 0, 0, 1, 2, 1, 1, 2], loop: 2.4, scale: 2.5, lit: 0.45 } }
};
const DEFAULT_PATTERN = { 3: 'orbit', 4: 'sweep' };
const MARKS = {
  3: { done: [2, 3, 5, 7], error: [0, 2, 4, 6, 8] },
  4: { done: [7, 8, 10, 13], error: [0, 3, 5, 6, 9, 10, 12, 15] }
};
const resolvePattern = (pattern, grid) => {
  if (typeof pattern === 'string') {
    const named = PATTERNS[pattern];
    return (named && named[grid]) || PATTERNS[DEFAULT_PATTERN[grid]][grid];
  }
  const cells = Array.from({ length: grid * grid }, (_, i) => pattern.cells[i] ?? null);
  const max = Math.max(0, ...cells.filter(v => v != null));
  return { cells, loop: pattern.loop ?? max + 4.2, scale: pattern.scale ?? 1, lit: pattern.lit ?? 0.62 };
};
// секунды по-русски: «2,3 с», «1 мин 4,0 с»
const fmt = ds => (ds < 600 ? `${(ds / 10).toFixed(1).replace('.', ',')} с` : `${Math.floor(ds / 600)} мин ${((ds % 600) / 10).toFixed(1).replace('.', ',')} с`);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function html(o) {
  o = Object.assign({
    label: 'Thinking', doneLabel: 'Done in', errorLabel: 'Failed after', status: 'working',
    pattern: 'orbit', grid: 3, shape: 'round', color: 'currentColor', doneColor: '#22c55e', errorColor: '#ef4444',
    cellSize: 6, gap: 2, fontSize: 14, step: 90, idleOpacity: 0.15, glow: false, glowColor: '', showTimer: true,
    start: Date.now(), end: null, className: ''
  }, o || {});
  const n = o.grid === 4 ? 4 : 3, pat = resolvePattern(o.pattern, n), marks = MARKS[n];
  const d = o.step * pat.scale, cycle = Math.round(pat.loop * d), status = o.status;
  const mark = status === 'error' ? 'error' : 'done';
  const ds = Math.max(0, Math.floor(((o.end != null ? o.end : Date.now()) - o.start) / 100));
  const style = `--ll-n:${n};--ll-cell:${o.cellSize}px;--ll-gap:${o.gap}px;--ll-font:${o.fontSize}px;--ll-color:${o.color};`
    + `--ll-mark:${status === 'error' ? o.errorColor : o.doneColor};--ll-idle:${o.idleOpacity};--ll-glow:${o.glowColor || o.color};`
    + `--ll-mark-glow:${o.glowColor || (status === 'error' ? o.errorColor : o.doneColor)};--ll-cycle:${cycle}ms`;
  const run = pat.cells.map(u => `<span class="lattice-loader__cell"${u == null ? ' data-hole=""' : ''}${pat.lit && pat.lit !== 0.62 ? ` data-lit="${Math.round(pat.lit * 100)}"` : ''}${u == null ? '' : ` style="animation-delay:${Math.round(u * d)}ms"`}></span>`).join('');
  const mk = pat.cells.map((_, i) => `<span class="lattice-loader__cell"${marks[mark].includes(i) ? ' data-on=""' : ''}></span>`).join('');
  const sr = status === 'working' ? `${o.label}, идёт` : `${status === 'done' ? o.doneLabel : o.errorLabel}${o.showTimer ? ' ' + fmt(ds) : ''}`;
  return `<span class="lattice-loader${o.className ? ' ' + o.className : ''}" data-status="${status}" data-shape="${o.shape}"${o.glow ? ' data-glow=""' : ''} data-ll-start="${o.start}" style="${style}">`
    + `<span class="lattice-loader__grid" aria-hidden="true"><span class="lattice-loader__layer lattice-loader__run">${run}</span><span class="lattice-loader__layer lattice-loader__mark">${mk}</span></span>`
    + `<span class="lattice-loader__label" aria-hidden="true"><span class="lattice-loader__text"${status === 'working' ? ' data-active=""' : ''}>${esc(o.label)}</span><span class="lattice-loader__text"${status === 'done' ? ' data-active=""' : ''}>${esc(o.doneLabel)}</span><span class="lattice-loader__text"${status === 'error' ? ' data-active=""' : ''}>${esc(o.errorLabel)}</span></span>`
    + (o.showTimer ? `<span class="lattice-loader__timer" aria-hidden="true">${fmt(ds)}</span>` : '')
    + `<span class="lattice-loader__sr">${esc(sr)}</span></span>`;
}
// один общий тикер: обновляет секундомер у всех работающих лоадеров
setInterval(() => {
  document.querySelectorAll('.lattice-loader[data-status="working"][data-ll-start]').forEach(el => {
    const t = el.querySelector('.lattice-loader__timer');if (!t) return;
    const v = fmt(Math.max(0, Math.floor((Date.now() - +el.dataset.llStart) / 100)));
    if (t.textContent !== v) t.textContent = v;
  });
}, 100);
window.LatticeLoader = { html, fmt };
})();
