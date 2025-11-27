function App() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-neutral-950 flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center w-full max-w-md">
        {/* Logo/Brand */}
        <h1 className="text-4xl sm:text-5xl font-extralight text-white mb-1 tracking-tight">
          chesstard<span className="text-neutral-500">.win</span>
        </h1>

        {/* Tagline */}
        <p className="text-sm text-neutral-400 mt-6 italic">Tell me why...</p>
        <p className="text-xs text-neutral-600 mb-10">ain't nothing but a bad move</p>

        {/* Coming Soon */}
        <div className="inline-block bg-white text-neutral-900 px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-widest mb-12">
          Coming Soon
        </div>

        {/* Feature highlights */}
        <div className="space-y-3">
          <p className="text-neutral-500 text-sm">
            <span className="text-neutral-300">→</span> Lichess & Chess.com sync
          </p>
          <p className="text-neutral-500 text-sm">
            <span className="text-neutral-300">→</span> Stockfish analysis
          </p>
          <p className="text-neutral-500 text-sm">
            <span className="text-neutral-300">→</span> AI explains your blunders
          </p>
          <p className="text-neutral-500 text-sm">
            <span className="text-neutral-300">→</span> Compare with optimal lines
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
