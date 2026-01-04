import { Link } from "react-router";

import { Logo } from "@/components/Logo";
import { ROUTES } from "@/router/routes";

const LAST_UPDATED = "4 January 2026";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen w-full bg-neutral-800 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link to={ROUTES.INDEX} className="inline-block mb-6">
            <Logo />
          </Link>
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-neutral-400 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-6 text-neutral-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Data Collection</h2>
            <p>Hanging Piece collects minimal data necessary to provide chess analysis services. We store:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Your Chess.com and/or Lichess usernames (provided during onboarding)</li>
              <li>
                Analysis results (currently cached locally in your browser; cloud storage may be added in the future)
              </li>
            </ul>
            <p className="mt-2">
              Game data is fetched directly from Lichess and Chess.com public APIs using your stored usernames. We do
              not store your games on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Data Usage</h2>
            <p>
              Your data is used solely to provide chess analysis features. Game analysis runs locally in your browser
              using Stockfish. When you request AI explanations for mistakes or blunders, we send move data (position,
              move played, and best alternatives) to our servers for LLM-powered explanation generation. We do not send
              complete game records.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Third-Party Services</h2>
            <p>We use several third-party services to provide our features:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>
                <strong>Lichess & Chess.com:</strong> We fetch game data using their publicly available APIs. We only
                store your usernames to access this public data. Your use of these platforms is governed by their
                respective privacy policies.
              </li>
              <li>
                <strong>LLM Services:</strong> AI-powered move explanations are generated using third-party large
                language model services. Move data (position, move played, and best alternatives) is sent to these
                services for explanation generation.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Data Storage</h2>
            <p>
              Currently, analysis results are cached locally in your browser. We may introduce cloud storage for
              analysis results in the future to enable cross-device access. You can clear local cached data at any time
              through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Your Rights</h2>
            <p>
              You can disconnect your accounts, delete cached data, or stop using the service at any time. Contact us if
              you have questions about your data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Changes</h2>
            <p>
              We may update this policy. Continued use of the service constitutes acceptance of changes. We'll notify
              users of significant updates.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-700">
          <Link to={ROUTES.DASHBOARD} className="text-emerald-400 hover:text-emerald-300 text-sm">
            ← Back to app
          </Link>
        </div>
      </div>
    </div>
  );
}
