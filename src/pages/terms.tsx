import { Link } from "react-router";

import { Logo } from "@/components/Logo";
import { ROUTES } from "@/router/routes";

const LAST_UPDATED = "4 January 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen w-full bg-neutral-800 text-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link to={ROUTES.INDEX} className="inline-block mb-6">
            <Logo />
          </Link>
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-neutral-400 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-6 text-neutral-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Acceptance</h2>
            <p>By using Hanging Piece, you agree to these terms. If you disagree, please do not use the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Service Description</h2>
            <p>
              Hanging Piece provides chess game analysis using Stockfish engine and AI-powered move explanations.
              Analysis runs locally in your browser. We are not responsible for the accuracy of engine evaluations or AI
              explanations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">User Responsibilities</h2>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>You must have permission to access any games you analyze</li>
              <li>You are responsible for maintaining account security</li>
              <li>Do not use the service to violate any laws or third-party rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Limitations</h2>
            <p>
              Hanging Piece is provided "as is" without warranties. We do not guarantee uninterrupted service, accuracy
              of analysis, or compatibility with all devices. Analysis quality depends on your device's capabilities.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Third-Party Services</h2>
            <p>
              Integration with Lichess and Chess.com is subject to their terms of service. We are not responsible for
              their services or any issues arising from third-party integrations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Intellectual Property</h2>
            <p>
              Hanging Piece's code and design are proprietary. Stockfish is open-source software. Game data belongs to
              you or the respective platforms (Lichess/Chess.com).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Termination</h2>
            <p>
              We reserve the right to suspend or terminate access for violations of these terms. You may stop using the
              service at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Changes</h2>
            <p>
              We may modify these terms. Continued use after changes constitutes acceptance. We'll notify users of
              significant updates.
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
