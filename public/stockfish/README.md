# Stockfish Engine Files

This folder contains the Stockfish 18.0.8 single-threaded lite engine used by the app:

- `stockfish-18-lite-single.js`
- `stockfish-18-lite-single.wasm`

These files are copied from the `stockfish` npm package. To update them:

```bash
pnpm install stockfish@latest
cp node_modules/stockfish/bin/stockfish-18-lite-single.js public/stockfish/
cp node_modules/stockfish/bin/stockfish-18-lite-single.wasm public/stockfish/
```
