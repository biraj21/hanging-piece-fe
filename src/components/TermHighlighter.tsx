import {
  CHESS_GLOSSARY,
  ChessTerm,
  VARIATION_TO_BASE_TERM,
} from "@/constants/chess-glossary";
import React, { Component } from "react";

import { Tooltip } from "./Tooltip";

const CHESS_GLOSSARY_OBJ = CHESS_GLOSSARY as Record<string, string>;

export interface TermHighlighterProps {
  text: string;
  className?: string;
  matchedTerms: Set<ChessTerm>; // Now uses ChessTerm enum
}

export class TermHighlighter extends Component<TermHighlighterProps> {
  private processText(text: string): React.ReactNode[] {
    const { matchedTerms } = this.props;
    const nodes: React.ReactNode[] = [];
    let currentIndex = 0;

    // Sort terms by length (longer first) to handle compound terms
    const sortedTerms = Object.keys(CHESS_GLOSSARY).sort(
      (a, b) => b.length - a.length,
    );

    while (currentIndex < text.length) {
      let bestMatch: {
        term: string;
        baseTerm: ChessTerm;
        index: number;
        length: number;
      } | null = null;

      // Find earliest matching term in remaining text
      for (const term of sortedTerms) {
        // Get the base term enum for this variation
        const baseTerm = VARIATION_TO_BASE_TERM[term.toLowerCase()];
        if (!baseTerm) continue;

        // Skip if the base term was already matched (this handles all variations)
        if (matchedTerms.has(baseTerm)) continue;

        const remainingText = text.slice(currentIndex);
        const lowerText = remainingText.toLowerCase();
        const lowerTerm = term.toLowerCase();

        // Escape special regex characters
        const escapedTerm = lowerTerm
          .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          .replace(/[-/]/g, "[-/]?");
        const pattern = `\\b${escapedTerm}\\b`;
        const regex = new RegExp(pattern, "i");
        const match = lowerText.match(regex);

        if (match && match.index !== undefined) {
          const absoluteIndex = currentIndex + match.index;

          // Keep earliest match (or longest if at same position)
          if (
            !bestMatch ||
            absoluteIndex < bestMatch.index ||
            (absoluteIndex === bestMatch.index &&
              match[0].length > bestMatch.length)
          ) {
            bestMatch = {
              term,
              baseTerm,
              index: absoluteIndex,
              length: match[0].length,
            };
          }
        }
      }

      if (bestMatch) {
        // Add text before match
        if (bestMatch.index > currentIndex) {
          nodes.push(text.slice(currentIndex, bestMatch.index));
        }

        // Add highlighted term
        const matchedText = text.slice(
          bestMatch.index,
          bestMatch.index + bestMatch.length,
        );
        nodes.push(
          <Tooltip
            key={bestMatch.index}
            term={bestMatch.term}
            definition={CHESS_GLOSSARY_OBJ[bestMatch.term]}
            highlightStyle="underline"
          >
            <>{matchedText}</>
          </Tooltip>,
        );

        // Mark the BASE TERM ENUM as matched
        matchedTerms.add(bestMatch.baseTerm);
        currentIndex = bestMatch.index + bestMatch.length;
      } else {
        // No more matches - add remaining text
        nodes.push(text.slice(currentIndex));
        break;
      }
    }

    return nodes;
  }

  render(): React.ReactNode {
    const { text, className = "" } = this.props;

    if (!text) return null;

    // Process paragraphs separately
    const paragraphs = text.split("\n").filter((p) => p.trim());

    if (paragraphs.length === 1) {
      return <span className={className}>{this.processText(text)}</span>;
    }

    return (
      <div className={className}>
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="mb-2 last:mb-0">
            {this.processText(paragraph)}
          </p>
        ))}
      </div>
    );
  }
}
