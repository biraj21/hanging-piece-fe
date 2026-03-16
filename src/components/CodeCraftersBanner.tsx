import { ArrowUpRightIcon, Code2Icon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";

export interface CodeCraftersChallenge {
  title: string;
  description: string;
  ctaLabel: string;
}

export const CODECRAFTERS_INVITE_URL = "https://app.codecrafters.io/join?via=biraj21";

export const CODECRAFTERS_CHALLENGES: CodeCraftersChallenge[] = [
  {
    title: "Build your own DNS server",
    description: "Learn about the DNS protocol, DNS record types and how name resolution works end to end.",
    ctaLabel: "Resume",
  },
  {
    title: "Build your own Claude Code",
    description: "Learn about LLM APIs, tool calling, agent loops and how coding agents are stitched together.",
    ctaLabel: "Start Again",
  },
  {
    title: "Build your own Git",
    description: "Learn about git objects, plumbing commands and how version control works under the hood.",
    ctaLabel: "Resume",
  },
  {
    title: "Build your own Shell",
    description: "Learn about parsing shell commands, process execution and the mechanics behind terminals.",
    ctaLabel: "Resume",
  },
  {
    title: "Build your own Docker",
    description: "Learn about kernel namespaces, chroot, registries and the core ideas behind containers.",
    ctaLabel: "Resume",
  },
  {
    title: "Build your own Redis",
    description: "Learn about TCP servers, the Redis protocol and how in-memory systems serve requests fast.",
    ctaLabel: "Resume",
  },
  {
    title: "Build your own HTTP server",
    description: "Learn about TCP servers, the HTTP protocol and the foundations most web apps sit on.",
    ctaLabel: "Resume",
  },
  {
    title: "Build your own grep",
    description: "Learn about regex syntax, character classes, quantifiers and pattern matching internals.",
    ctaLabel: "Start",
  },
  {
    title: "Build your own Interpreter",
    description: "Learn about tokenization, ASTs and tree-walk interpreters by building one yourself.",
    ctaLabel: "Start",
  },
  {
    title: "Build your own BitTorrent",
    description: "Learn about .torrent files, peer protocols and how decentralized file transfer works.",
    ctaLabel: "Start",
  },
  {
    title: "Build your own Kafka",
    description: "Learn about TCP servers, the Kafka wire protocol and the basics of event streaming systems.",
    ctaLabel: "Start",
  },
  {
    title: "Build your own SQLite",
    description: "Learn about SQL syntax, SQLite's file format, B-trees and how databases store data.",
    ctaLabel: "Start",
  },
];

const getRandomChallenge = () => CODECRAFTERS_CHALLENGES[Math.floor(Math.random() * CODECRAFTERS_CHALLENGES.length)];
const CLOSE_KEY = "codecrafters-banner-last-closed-at";
const TEN_MINUTES_MS = 10 * 60 * 1000;

const getInitialVisibility = (closable: boolean) => {
  if (!closable || typeof window === "undefined") {
    return true;
  }

  const lastClosedAtRaw = sessionStorage.getItem(CLOSE_KEY);
  if (!lastClosedAtRaw) {
    return true;
  }

  const lastClosedAt = Number(lastClosedAtRaw);
  if (!Number.isFinite(lastClosedAt) || Date.now() - lastClosedAt > TEN_MINUTES_MS) {
    sessionStorage.removeItem(CLOSE_KEY);
    return true;
  }

  return false;
};

interface CodeCraftersBannerProps {
  variant?: "feature" | "compact";
  closable?: boolean;
}

export function CodeCraftersBanner({ variant = "feature", closable = false }: CodeCraftersBannerProps) {
  const [challenge] = useState(getRandomChallenge);
  const [isVisible, setIsVisible] = useState(() => getInitialVisibility(closable));
  const isCompact = variant === "compact";

  useEffect(() => {
    if (!closable || isVisible) {
      return;
    }

    const lastClosedAtRaw = sessionStorage.getItem(CLOSE_KEY);
    if (!lastClosedAtRaw) {
      return;
    }

    const lastClosedAt = Number(lastClosedAtRaw);
    if (!Number.isFinite(lastClosedAt)) {
      sessionStorage.removeItem(CLOSE_KEY);
      return;
    }

    const remainingMs = TEN_MINUTES_MS - (Date.now() - lastClosedAt);
    if (remainingMs <= 0) {
      sessionStorage.removeItem(CLOSE_KEY);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      sessionStorage.removeItem(CLOSE_KEY);
      setIsVisible(true);
    }, remainingMs);

    return () => window.clearTimeout(timeoutId);
  }, [closable, isVisible]);

  const handleClose = () => {
    sessionStorage.setItem(CLOSE_KEY, String(Date.now()));
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <section
      className={`overflow-hidden border border-neutral-600/50 bg-neutral-900/60 ${
        isCompact ? "rounded-lg p-4" : "rounded-lg p-5 sm:p-6"
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/15 px-2.5 py-1 text-[11px] font-medium text-emerald-400">
            <Code2Icon className="h-3.5 w-3.5" />
            CodeCrafters
          </span>
          <span className="rounded-full bg-neutral-800/80 px-2 py-1 text-[10px] font-medium tracking-[0.12em] text-neutral-400">
            Sponsored
          </span>
        </div>

        {closable && (
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close CodeCrafters banner"
            className="rounded-md p-1.5 text-neutral-500 transition hover:bg-neutral-800 hover:text-neutral-300"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <div
        className={
          isCompact
            ? "flex flex-col gap-2.5 sm:gap-3 lg:flex-row lg:items-center lg:justify-between"
            : "flex flex-col gap-4"
        }
      >
        <div className={isCompact ? "max-w-3xl" : "max-w-2xl"}>
          <h2
            className={
              isCompact
                ? "truncate text-sm font-semibold text-white sm:text-lg sm:whitespace-normal"
                : "text-lg sm:text-xl font-semibold text-white"
            }
          >
            {challenge.title}
          </h2>
          <p
            className={`mt-2 text-neutral-300 ${isCompact ? "text-xs leading-relaxed sm:text-sm" : "text-sm sm:text-base leading-relaxed"}`}
          >
            {isCompact ? "Build real systems and sharpen your engineering instincts." : challenge.description}
          </p>
          {/* {!isCompact && (
            <p className="mt-3 text-sm text-neutral-400 leading-relaxed">
              If you enjoy learning why a chess move works, this is the same kind of practice for software engineering:
              build the real system, understand the constraints, and improve by doing.
            </p>
          )} */}
        </div>

        <div className={isCompact ? "pt-0.5" : "pt-1"}>
          <a
            href={CODECRAFTERS_INVITE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[inset_0_-1px_0_rgba(0,0,0,0.25)] transition-colors duration-200 hover:bg-emerald-500 active:bg-emerald-700"
          >
            {challenge.ctaLabel} challenge
            <ArrowUpRightIcon className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
