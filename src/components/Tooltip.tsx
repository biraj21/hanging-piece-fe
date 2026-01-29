import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  term: string;
  definition: string;
  children: React.ReactNode;
  highlightStyle?: "underline" | "wavy" | "background";
}

export const Tooltip: React.FC<TooltipProps> = ({ term, definition, children, highlightStyle = "background" }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [placement, setPlacement] = useState<"top" | "bottom" | "left" | "right">("top");
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showTooltip && triggerRef.current && tooltipRef.current) {
      calculatePosition();
    }
  }, [showTooltip]);

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const gap = 8; // Gap between trigger and tooltip

    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let newPlacement: "top" | "bottom" | "left" | "right" = "top";
    let top = 0;
    let left = 0;

    // Try top first
    const topSpace = triggerRect.top;
    const bottomSpace = viewport.height - triggerRect.bottom;
    const leftSpace = triggerRect.left;
    const rightSpace = viewport.width - triggerRect.right;

    // Determine vertical placement
    if (topSpace >= tooltipRect.height + gap) {
      // Enough space on top
      newPlacement = "top";
      top = triggerRect.top - tooltipRect.height - gap;
    } else if (bottomSpace >= tooltipRect.height + gap) {
      // Not enough space on top, use bottom
      newPlacement = "bottom";
      top = triggerRect.bottom + gap;
    } else if (leftSpace >= tooltipRect.width + gap) {
      // Not enough vertical space, try left
      newPlacement = "left";
      left = triggerRect.left - tooltipRect.width - gap;
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
    } else if (rightSpace >= tooltipRect.width + gap) {
      // Not enough space left, try right
      newPlacement = "right";
      left = triggerRect.right + gap;
      top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
    } else {
      // Default to bottom if nothing fits well
      newPlacement = "bottom";
      top = triggerRect.bottom + gap;
    }

    // Calculate horizontal position for top/bottom placements
    if (newPlacement === "top" || newPlacement === "bottom") {
      // Center horizontally by default
      left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;

      // Adjust if tooltip would overflow left
      if (left < gap) {
        left = gap;
      }
      // Adjust if tooltip would overflow right
      if (left + tooltipRect.width > viewport.width - gap) {
        left = viewport.width - tooltipRect.width - gap;
      }
    }

    // Adjust vertical position for left/right placements
    if (newPlacement === "left" || newPlacement === "right") {
      // Adjust if tooltip would overflow top
      if (top < gap) {
        top = gap;
      }
      // Adjust if tooltip would overflow bottom
      if (top + tooltipRect.height > viewport.height - gap) {
        top = viewport.height - tooltipRect.height - gap;
      }
    }

    setPlacement(newPlacement);
    setPosition({ top, left });
  };

  const getHighlightClass = (): string => {
    switch (highlightStyle) {
      case "underline":
        return "underline decoration-emerald-500 decoration-solid decoration-2 cursor-help";
      case "wavy":
        return "underline decoration-emerald-500 decoration-wavy cursor-help";
      case "background":
        return "bg-white/90 font-semibold text-black px-1 py-0.5 leading-none rounded cursor-help shadow-[0_3px_0_0_theme(colors.emerald.600)]";
      default:
        return "bg-white/90 font-semibold text-black px-1 py-0.5 leading-none rounded cursor-help";
    }
  };

  const getArrowStyles = () => {
    const arrowSize = 6;
    const baseStyles = "absolute w-0 h-0";

    switch (placement) {
      case "top":
        return {
          container: "absolute top-full left-1/2 transform -translate-x-1/2 -mt-1",
          arrow: `${baseStyles} border-l-[${arrowSize}px] border-r-[${arrowSize}px] border-t-[${arrowSize}px] border-transparent border-t-neutral-600/50`,
        };
      case "bottom":
        return {
          container: "absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-1",
          arrow: `${baseStyles} border-l-[${arrowSize}px] border-r-[${arrowSize}px] border-b-[${arrowSize}px] border-transparent border-b-neutral-600/50`,
        };
      case "left":
        return {
          container: "absolute left-full top-1/2 transform -translate-y-1/2 -ml-1",
          arrow: `${baseStyles} border-t-[${arrowSize}px] border-b-[${arrowSize}px] border-l-[${arrowSize}px] border-transparent border-l-neutral-600/50`,
        };
      case "right":
        return {
          container: "absolute right-full top-1/2 transform -translate-y-1/2 -mr-1",
          arrow: `${baseStyles} border-t-[${arrowSize}px] border-b-[${arrowSize}px] border-r-[${arrowSize}px] border-transparent border-r-neutral-600/50`,
        };
    }
  };

  const arrowStyles = getArrowStyles();

  const tooltipContent = (
    <div
      ref={tooltipRef}
      className="fixed z-9999"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        pointerEvents: "none",
      }}
    >
      <div className="bg-neutral-900 border border-neutral-600/50 rounded-lg shadow-lg p-3 w-max max-w-xs">
        <div className="text-emerald-400 font-semibold text-sm mb-1">{term}</div>
        <div className="text-white text-xs leading-relaxed">{definition}</div>
      </div>
      <div className={arrowStyles.container}>
        <div className={arrowStyles.arrow} />
      </div>
    </div>
  );

  return (
    <>
      <span
        ref={triggerRef}
        className={`relative inline-block ${getHighlightClass()}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {children}
      </span>
      {showTooltip && typeof document !== "undefined" && createPortal(tooltipContent, document.body)}
    </>
  );
};
