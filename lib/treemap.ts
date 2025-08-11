export type Rect = { x:number; y:number; w:number; h:number };

/** Binary treemap: balances items to keep tiles square-ish */
export function binaryTreemap(
  items: { key: string; value: number }[],
  x: number, y: number, w: number, h: number
): (Rect & { key: string })[] {
  if (!items.length) return [];
  if (items.length === 1) return [{ x, y, w, h, key: items[0].key }];
  const total = items.reduce((s,i)=>s+i.value,0);
  const sorted = [...items].sort((a,b)=>b.value-a.value);
  const left: typeof items = [], right: typeof items = [];
  let sl=0, sr=0;
  for (const it of sorted) (sl<=sr ? (left.push(it), sl+=it.value) : (right.push(it), sr+=it.value));
  const out: (Rect & { key:string })[] = [];
  if (w >= h) {
    const wl = w * (sl/total);
    out.push(...binaryTreemap(left, x, y, wl, h));
    out.push(...binaryTreemap(right, x+wl, y, w-wl, h));
  } else {
    const ht = h * (sl/total);
    out.push(...binaryTreemap(left, x, y, w, ht));
    out.push(...binaryTreemap(right, x, y+ht, w, h-ht));
  }
  return out;
}

// Finviz-like red→gray→green (min=-5%, max=+5%)
export function finvizColor(pct: number) {
  const clamp = (v:number, a:number, b:number)=>Math.max(a, Math.min(b, v));
  const t = clamp((pct + 5) / 10, 0, 1);
  let r:number,g:number,b:number;
  if (t < 0.5) { // red -> gray
    const u = t / 0.5;
    r = 0.6 + (0.35-0.6)*u; g = 0 + (0.35-0)*u; b = 0 + (0.35-0)*u;
  } else {      // gray -> green
    const u = (t - 0.5) / 0.5;
    r = 0.35 + (0 - 0.35)*u; g = 0.35 + (0.6 - 0.35)*u; b = 0.35 + (0 - 0.35)*u;
  }
  return `rgb(${Math.round(r*255)},${Math.round(g*255)},${Math.round(b*255)})`;
}
