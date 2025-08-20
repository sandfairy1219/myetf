export type Holding = { ticker: string; sector: string; weight: number };

export const HOLDINGS: Holding[] = [
  { ticker: "NVDA", sector: "Technology", weight: 30.1 },
  { ticker: "AVGO", sector: "Technology", weight: 8.9 },
  { ticker: "ORCL", sector: "Technology", weight: 4.3 },

  { ticker: "BRK.B", sector: "Financials", weight: 10.1 },
  { ticker: "HOOD", sector: "Financials", weight: 9.8 },
  { ticker: "JPM",  sector: "Financials", weight: 8.9 },
  { ticker: "COIN", sector: "Financials", weight: 4.0 },
  { ticker: "STT",  sector: "Financials", weight: 2.2 },

  { ticker: "JNJ", sector: "Healthcare", weight: 5.2 },  

  { ticker: "GEV",  sector: "Industrials", weight: 3.2 },
  { ticker: "RKLB", sector: "Industrials", weight: 2.3 },
  { ticker: "UBER", sector: "Industrials", weight: 2.7 },

  { ticker: "PM",   sector: "Consumer Defensive", weight: 8.7 },
];

export const START_DATE = new Date(); // today => base index = 100
