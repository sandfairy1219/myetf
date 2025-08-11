# My ETF Treemap PRO (Base = 100, Sector Borders/Labels, Dark)

- Base index = 100 (today), Yahoo Finance historical closes.
- Finviz-style treemap colored by daily % change.
- **Sector borders + labels** (Consumer Defensive -> 2 lines).
- Dark UI, ticker/percent large text.

## Run
```bash
npm install
npm run dev
```
Then open http://localhost:3000

## Configure
Edit `lib/weights.ts` for tickers, sectors, weights.

## API
GET /api/etf => index series + latest % changes.
