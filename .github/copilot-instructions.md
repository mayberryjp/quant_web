# Copilot Instructions

## Build & Run

```bash
npm run dev      # Start Vite dev server (proxies API calls)
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
```

No test framework or linter is configured.

## Architecture

This is a **Vue 3 + Vite + Vuetify 3** SPA frontend for a quantitative trading system ("Algo Farm"). It is a read-only dashboard—no auth, no state management library, no backend code lives here.

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
- `/health` → `Health.vue` → `HealthCard` (fetches all backend health/ready/sync endpoints)

### Deployment

Multi-stage Docker build (clone from GitHub → `npm ci` → `npm run build` → nginx:alpine). Published as `mayberry4477/quant_web:latest`, deployed via `docker-compose.yml` on port 8080.

## Conventions

- **Vue Composition API only** — all components use `<script setup>` with no Options API.
- **Vuetify 3 with strict component bindings** — build UI from Vuetify components (`v-app`, `v-app-bar`, `v-card`, `v-data-table`, `v-btn`, `v-text-field`, `v-select`, `v-dialog`, `v-tabs`/`v-window`, `v-alert`, `v-chip`). Prefer Vuetify's prop-based API (`color`, `variant`, `density`, `elevation`, `rounded`) and layout helpers (`v-container`/`v-row`/`v-col`, spacing/`ga-*` utilities) over hand-written CSS. Avoid `<style scoped>` blocks unless a token can't be expressed through Vuetify.
- **Theme lives in `src/plugins/vuetify.js`** — the custom dark theme `algoFarmDark` defines `background`, `surface`, `surface-variant`, `primary`, `success`, `error`, `warning`, `info`. Global component defaults (outlined/compact fields, flat cards, etc.) are set via `defaults`. Reference colors through Vuetify props/utility classes (`color="primary"`, `text-success`), not raw hex.
- **Financial data coloring** — use Vuetify text-color classes: positive → `text-success`, negative → `text-error`. Pattern: `:class="value >= 0 ? 'text-success' : 'text-error'"`. Warnings use `text-warning`.
- **Monospace for numbers** — numeric cells use the global `mono` class (defined in `src/style.css`; maps to `'SF Mono', 'Cascadia Code', 'Consolas', monospace` with `tabular-nums`). This plus a base reset are the only custom CSS.
- **Tables** — use `v-data-table` with a `headers` array and `#item.<key>` slots for custom cell rendering; totals rows go in the `#body.append` slot.
- **Cards** — sections are wrapped in `v-card` with a `v-card-title` (title text + optional `v-chip` badge + `v-spacer` + icon `v-btn`) followed by `v-divider`.
- **No external state management** — component-local `ref()`/`reactive()` only. Data fetching uses raw `fetch()` with `AbortController` timeouts, and the `src/api/positions.js` helper for the positions service.
