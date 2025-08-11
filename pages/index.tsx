import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { binaryTreemap, finvizColor } from "../lib/treemap";
import { HOLDINGS } from "../lib/weights";

type Api = {
  base: number;
  startDate: string;
  index: { date:string; value:number }[];
  latest: Record<string,{ pct:number; close:number }>;
  sectors: Record<string,string>;
  weights: Record<string, number>;
};

export default function Home() {
  const [data, setData] = useState<Api | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/etf`)
      .then(r=>r.json()).then(setData).finally(()=>setLoading(false));
  }, []);

  const level = data?.index.at(-1)?.value ?? 100;
  const prev = data?.index.at(-2)?.value ?? 100;
  const dailyChange = ((level - prev) / prev) * 100;

  const layout = useMemo(() => {
    if (!data) return null;
    const sectorSums: Record<string, number> = {};
    Object.entries(data.weights).forEach(([t, w]) => {
      const s = data.sectors[t];
      sectorSums[s] = (sectorSums[s] || 0) + w;
    });
    const sectorRects = binaryTreemap(
      Object.entries(sectorSums).map(([k,v]) => ({ key:k, value:v })),
      0, 0, 100, 60
    );
    const tiles: { key:string; x:number; y:number; w:number; h:number; sector:string }[] = [];
    for (const sr of sectorRects) {
      const members = Object.entries(data.weights)
        .filter(([t]) => data.sectors[t] === sr.key)
        .map(([t,w]) => ({ key:t, value:w }));
      const rects = binaryTreemap(members, sr.x, sr.y, sr.w, sr.h);
      for (const r of rects) tiles.push({ ...r, sector: sr.key });
    }
    return { sectorRects, tiles };
  }, [data]);

  if (loading) return <div style={{ color: "white", padding: 20 }}>Loading…</div>;
  if (!data || !layout) return <div style={{ color: "white", padding: 20 }}>No data</div>;

  return (
    <div style={{ background: "#0a0a0a", color: "white", minHeight: "100vh", padding: 20 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0 }}>My ETF Index</h1>
      <div style={{ fontSize: 22, opacity: 0.8 }}>Base = 100 @ {data.startDate}</div>
      <div style={{ fontSize: 28, marginTop: 8 }}>
        ${level.toFixed(2)} ({dailyChange >= 0 ? "+" : ""}{dailyChange.toFixed(2)}%)
      </div>

      <div style={{ height: 300, marginTop: 18, background: "#101010", borderRadius: 12, padding: 8 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.index}>
            <XAxis dataKey="date" hide />
            <YAxis domain={["auto", "auto"]} hide />
            <Tooltip contentStyle={{ background: "#181818", border: "1px solid #333", color: "white" }} />
            <Line type="monotone" dataKey="value" stroke="#4caf50" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 20, background: "#101010", borderRadius: 12, padding: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Today’s Heatmap</div>
        <svg viewBox="0 0 100 60" style={{ width: "100%" }}>
          {layout.sectorRects.map((s) => (
            <g key={s.key}>
              <rect x={s.x} y={s.y} width={s.w} height={s.h} fill="none" stroke="black" strokeWidth={1.8} />
              <text x={s.x + 0.6} y={s.y + 3.0} fill="white" fontSize={3.2} fontWeight={800}>
                {s.key === "Consumer Defensive" ? "CONSUMER\nDEFENSIVE" : s.key.toUpperCase()}
              </text>
            </g>
          ))}
          {layout.tiles.map((r) => {
            const pct = data.latest[r.key]?.pct ?? 0;
            return (
              <g key={r.key}>
                <rect
                  x={r.x + 0.25} y={r.y + 0.25} width={r.w - 0.5} height={r.h - 0.5}
                  fill={finvizColor(pct)} stroke="#222" strokeWidth={0.6}
                />
                <text
                  x={r.x + r.w / 2} y={r.y + r.h / 2 - 1.4}
                  textAnchor="middle" fontSize={Math.min(r.w, r.h) / 3.5}
                  fontWeight={800} fill="white"
                >
                  {r.key}
                </text>
                <text
                  x={r.x + r.w / 2} y={r.y + r.h / 2 + 3.2}
                  textAnchor="middle" fontSize={Math.min(r.w, r.h) / 4.5}
                  fill="white"
                >
                  {(pct >= 0 ? "+" : "") + pct.toFixed(2) + "%"}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{ marginTop: 16, fontSize: 14, opacity: 0.8 }}>
        Universe: {HOLDINGS.map(h=>h.ticker).join(", ")}
      </div>
    </div>
  );
}
