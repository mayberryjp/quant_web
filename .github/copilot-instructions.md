# Copilot Instructions

## Build & Run

```bash
npm run dev      # Start Vite dev server (proxies API calls)
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
```

No test framework or linter is configured.

## Architecture

This is a **Vue 3 + Vite** SPA frontend for a quantitative trading system ("Algo Farm"). It is a read-only dashboard—no auth, no state management library, no backend code lives here.

### Backend Services (consumed via API proxy)

| Prefix | Target | Purpose |
|--------|--------|---------|
| `/api/quant_symbols` | `quant_symbols.quant.mayberry.farm:8089` | Symbol universe, sync status |
| `/api/quant_daily_bars` | `quant_daily_bars.quant.mayberry.farm:8090` | Daily OHLCV bars, ingest/backfill status |
| `/api/quant_positions` | `quant_positions.quant.mayberry.farm:8015` | Position tracking, portfolios, ledger |
| `/api/quant_signals` | `quant_signals.quant.mayberry.farm:8016` | Signal cache, watchlist |

In development, Vite's proxy handles these rewrites (`vite.config.js`). In production, `nginx.conf` does the same via `proxy_pass`.

### Route → View → Component structure

- `/` → `Dashboard.vue` → `DashboardHeader`, `Positions`, `WatchList`
- `/positions` → `RealPositions.vue` → `PortfolioSelector`, `RealPositionsList`, `LedgerImportForm`, `LedgerHistory`
- `/health` → `Health.vue` (fetches all backend health/ready/sync endpoints)

### Deployment

Multi-stage Docker build (clone from GitHub → `npm ci` → `npm run build` → nginx:alpine). Published as `mayberry4477/quant_web:latest`, deployed via `docker-compose.yml` on port 8080.

## Conventions

- **Vue Composition API only** — all components use `<script setup>` with no Options API.
- **No component library** — all UI is custom CSS with CSS variables defined in `src/style.css`.
- **Dark theme by default** — design tokens: `--bg-primary`, `--bg-card`, `--green`, `--red`, `--yellow`, `--blue` (with `-bg` variants for tinted backgrounds).
- **Scoped styles** — every component uses `<style scoped>`. Shared tokens live in `:root` in `style.css`.
- **Financial data coloring** — positive values get class `positive` (green), negative get `negative` (red). Use the pattern: `:class="value >= 0 ? 'positive' : 'negative'"`.
- **Monospace for numbers** — numeric table cells use class `mono` (maps to `'SF Mono', 'Cascadia Code', 'Consolas', monospace` with `tabular-nums`).
- **Card pattern** — sections are wrapped in `.card` with `.card-header` containing an `h2` and optional `.badge`.
- **No external state management** — component-local `ref()`/`reactive()` only. Data fetching uses raw `fetch()` with `AbortController` timeouts.
