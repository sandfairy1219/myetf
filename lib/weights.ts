export type Holding = { ticker: string; sector: string; weight: number };

export const HOLDINGS: Holding[] = [
  { ticker: "NVDA", sector: "Technology", weight: 24.7 },
  { ticker: "PLTR", sector: "Technology", weight: 12.3 },
  { ticker: "AVGO", sector: "Technology", weight: 7.9 },
  { ticker: "GOOGL", sector: "Technology", weight: 4.3 },

  { ticker: "TSLA", sector: "Technology", weight: 9},
  { ticker: "HOOD", sector: "Financials", weight: 9.8 },
  { ticker: "JPM",  sector: "Financials", weight: 8.9 },
  { ticker: "COIN", sector: "Financials", weight: 4.0 },
  { ticker: "STT",  sector: "Financials", weight: 2.2 },

  

  { ticker: "GEV",  sector: "Industrials", weight: 3.2 },
  { ticker: "UBER", sector: "Industrials", weight: 2.7 },
  { ticker: "RKLB", sector: "Industrials", weight: 2.3 },


  { ticker: "KO",   sector: "Consumer Defensive", weight: 8.7 },
];

export const START_DATE = new Date('2025-08-20'); // 일주일 전 => base index = 100
