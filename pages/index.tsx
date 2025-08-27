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

      <div style={{ marginTop: 20, background: "#101010", borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>포트폴리오 비중 및 변동률 계산</div>
        
        {/* 개별 종목 상세 정보 */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#4caf50" }}>개별 종목 비중 및 수익률</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
            {HOLDINGS.map(holding => {
              const stockData = data.latest[holding.ticker];
              const pct = stockData?.pct ?? 0;
              const normalizedWeight = (holding.weight / HOLDINGS.reduce((sum, h) => sum + h.weight, 0)) * 100;
              const weightedReturn = (normalizedWeight / 100) * pct;
              
              return (
                <div key={holding.ticker} style={{ 
                  background: "#1a1a1a", 
                  padding: "8px 12px", 
                  borderRadius: "6px",
                  border: `1px solid ${pct >= 0 ? "#4caf50" : "#f44336"}20`
                }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{holding.ticker}</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>{holding.sector}</div>
                  <div style={{ fontSize: 13, marginTop: 4 }}>
                    비중: {normalizedWeight.toFixed(1)}%
                  </div>
                  <div style={{ 
                    fontSize: 13, 
                    color: pct >= 0 ? "#4caf50" : "#f44336" 
                  }}>
                    수익률: {pct >= 0 ? "+" : ""}{pct.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: 12, opacity: 0.9 }}>
                    기여도: {weightedReturn >= 0 ? "+" : ""}{weightedReturn.toFixed(3)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 전체 계산 요약 */}
        <div style={{ borderTop: "1px solid #333", paddingTop: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#4caf50" }}>전체 포트폴리오 계산</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
            <div style={{ background: "#1a1a1a", padding: "12px", borderRadius: "8px" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>총 비중</div>
              <div style={{ fontSize: 18, color: "#4caf50" }}>
                {HOLDINGS.reduce((sum, h) => sum + h.weight, 0).toFixed(1)}%
              </div>
            </div>
            
            <div style={{ background: "#1a1a1a", padding: "12px", borderRadius: "8px" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>가중평균 수익률</div>
              <div style={{ 
                fontSize: 18, 
                color: dailyChange >= 0 ? "#4caf50" : "#f44336" 
              }}>
                {dailyChange >= 0 ? "+" : ""}{dailyChange.toFixed(3)}%
              </div>
            </div>
            
            <div style={{ background: "#1a1a1a", padding: "12px", borderRadius: "8px" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>포트폴리오 지수</div>
              <div style={{ fontSize: 18, color: "#4caf50" }}>
                {level.toFixed(4)}
              </div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>
                기준일: {data.startDate} (100.0000)
              </div>
            </div>
          </div>
        </div>
        
        {/* 섹터별 기여도 */}
        <div style={{ borderTop: "1px solid #333", paddingTop: 16, marginTop: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: "#4caf50" }}>섹터별 기여도</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px" }}>
            {Object.entries(
              HOLDINGS.reduce((sectors, holding) => {
                const stockData = data.latest[holding.ticker];
                const pct = stockData?.pct ?? 0;
                const normalizedWeight = (holding.weight / HOLDINGS.reduce((sum, h) => sum + h.weight, 0)) * 100;
                const contribution = (normalizedWeight / 100) * pct;
                
                if (!sectors[holding.sector]) {
                  sectors[holding.sector] = { weight: 0, contribution: 0 };
                }
                sectors[holding.sector].weight += normalizedWeight;
                sectors[holding.sector].contribution += contribution;
                return sectors;
              }, {} as Record<string, { weight: number; contribution: number }>)
            ).map(([sector, data]) => (
              <div key={sector} style={{ 
                background: "#1a1a1a", 
                padding: "10px", 
                borderRadius: "6px",
                border: `1px solid ${data.contribution >= 0 ? "#4caf50" : "#f44336"}20`
              }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{sector}</div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  비중: {data.weight.toFixed(1)}%
                </div>
                <div style={{ 
                  fontSize: 13, 
                  color: data.contribution >= 0 ? "#4caf50" : "#f44336" 
                }}>
                  기여도: {data.contribution >= 0 ? "+" : ""}{data.contribution.toFixed(3)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 14, opacity: 0.8 }}>
        Universe: {HOLDINGS.map(h=>h.ticker).join(", ")}
      </div>
    </div>
  );
}
