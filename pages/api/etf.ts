import type { NextApiRequest, NextApiResponse } from "next";
import yahooFinance from "yahoo-finance2";
import { HOLDINGS, START_DATE } from "../../lib/weights";

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const day = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const startParam = (req.query.start as string) || ymd(START_DATE);
    const startDate = new Date(startParam);
    const rangeStart = new Date(startDate); rangeStart.setDate(rangeStart.getDate() - 10);
    const today = new Date();

    const universe = HOLDINGS.map(h => h.ticker);
    type Row = { date: string; close: number };
    const series: Record<string, Row[]> = {};

    await Promise.all(universe.map(async (t) => {
      try {
        const rows = await yahooFinance.historical(t, { period1: rangeStart, period2: today, interval: "1d" });
        series[t] = rows.filter(r=>r.close!=null).map(r => ({ date: ymd(new Date(r.date)), close: r.close! }));
      } catch (error) {
        console.error(`Error fetching data for ${t}:`, error);
        // 에러가 발생한 티커는 빈 배열로 설정
        series[t] = [];
      }
    }));

    // base price on/after startDate
    const base: Record<string, number> = {};
    for (const t of universe) {
      const s = series[t];
      const first = s.find(r => new Date(r.date) >= startDate) || s.at(-1);
      base[t] = first?.close ?? 1;
    }

    const byDate: Record<string, Record<string, number>> = {};
    for (const t of universe) {
      for (const r of series[t]) {
        if (new Date(r.date) < startDate) continue;
        (byDate[r.date] ||= {})[t] = r.close;
      }
    }
    const dates = Object.keys(byDate).sort();

    const wSum = HOLDINGS.reduce((s,h)=>s+h.weight,0);
    const weights: Record<string, number> = Object.fromEntries(HOLDINGS.map(h => [h.ticker, h.weight / wSum]));

    const indexSeries = dates
      .filter(d => universe.every(t => byDate[d][t] != null))
      .map(d => {
        const level = 100 * universe.reduce((acc,t)=> acc + weights[t]*(byDate[d][t]/base[t]), 0);
        return { date: d, value: Number(level.toFixed(4)) };
      });

    // latest % change (close vs previous close)
    const latest: Record<string,{ pct:number; close:number }> = {};
    for (const t of universe) {
      const s = series[t];
      const a = s.at(-1); const b = s.at(-2);
      if (a && b) {
        const pct = ((a.close - b.close)/b.close)*100;
        latest[t] = { pct: Number(pct.toFixed(3)), close: a.close };
      } else if (a) {
        latest[t] = { pct: 0, close: a.close };
      }
    }

    const sectors: Record<string,string> = Object.fromEntries(HOLDINGS.map(h=>[h.ticker, h.sector]));
    const rawWeights: Record<string, number> = Object.fromEntries(HOLDINGS.map(h=>[h.ticker, h.weight]));

    res.status(200).json({
      base: 100,
      startDate: ymd(startDate),
      index: indexSeries,
      latest,
      sectors,
      weights: rawWeights
    });
  } catch (e:any) {
    console.error(e);
    res.status(500).json({ error: e?.message || "failed" });
  }
}
