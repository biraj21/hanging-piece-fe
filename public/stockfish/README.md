# Stockfish Engine Files

This folder contains all Stockfish 17.1 engine variants used by the app.

**Total Size:** ~164MB (optimized per device automatically)

## Current Configuration

### Desktop (Full Engine - 75MB, Strongest)

- **Multi-threaded** (with CORS): `stockfish-17.1-8e4d048.js` + 6 WASM parts
- **Single-threaded** (no CORS): `stockfish-17.1-single-a496a04.js` + 6 WASM parts

### Mobile (Lite Engine - 7MB, Battery-Friendly)

- **Multi-threaded** (with CORS): `stockfish-17.1-lite-51f59da.js` + 1 WASM file
- **Single-threaded** (no CORS): `stockfish-17.1-lite-single-03e3232.js` + 1 WASM file

## Automatic Selection

The app automatically selects the best engine for each user:

| Device  | CORS Available | Engine Used | Size | Threads   | Strength  |
| ------- | -------------- | ----------- | ---- | --------- | --------- |
| Desktop | ✅ Yes         | Full Multi  | 75MB | All cores | Strongest |
| Desktop | ❌ No          | Full Single | 75MB | 1         | Strongest |
| Mobile  | ✅ Yes         | Lite Multi  | 7MB  | Max 2     | Weaker    |
| Mobile  | ❌ No          | Lite Single | 7MB  | 1         | Weaker    |

## CORS Requirements

**Multi-threaded variants** require these HTTP headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

If these headers are not set, the app automatically falls back to single-threaded variants.

## Maintenance

These files are copied from the `stockfish` npm package during setup. To update:

```bash
# After updating stockfish package, re-copy files:
pnpm install stockfish@latest
cp node_modules/stockfish/src public/stockfish/
```

## Performance Notes

- **Desktop users** get the strongest possible analysis
- **Mobile users** get fast analysis without draining battery
- **All users** benefit from client-side analysis (no server cost)
- **Analysis is cached** so repeated positions are instant
