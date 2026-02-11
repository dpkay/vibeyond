import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import type { Hint } from "../logic/hints";

interface HintOverlayProps {
  hint: Hint;
  onDismiss: () => void;
}

export function HintOverlay({ hint, onDismiss }: HintOverlayProps) {
  // Auto-dismiss after 4 seconds
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  // Render mnemonic with parenthesized words dimmed
  const parts = hint.mnemonic.split(/(\([^)]+\))/);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onDismiss}
        style={{ cursor: "pointer" }}
      >
        {/* Dark backdrop */}
        <div
          className="absolute inset-0"
          style={{ background: "rgba(10, 10, 30, 0.75)" }}
        />

        {/* Content */}
        <motion.div
          className="relative flex flex-col items-center gap-3 px-8 py-6"
          initial={{ scale: 0.8, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          {/* Label */}
          <span
            className="text-sm tracking-widest uppercase"
            style={{ color: "rgba(255,255,255,0.5)" }}
          >
            {hint.label}
          </span>

          {/* Mnemonic */}
          <p
            className="text-center font-medium"
            style={{ fontSize: "1.75rem", lineHeight: 1.4 }}
          >
            {parts.map((part, i) =>
              part.startsWith("(") ? (
                <span key={i} style={{ color: "rgba(255,255,255,0.35)" }}>
                  {part}
                </span>
              ) : (
                <span key={i} style={{ color: "white" }}>
                  {part}
                </span>
              ),
            )}
          </p>

          {/* Accidental note */}
          {hint.accidentalNote && (
            <span
              className="text-base"
              style={{ color: "rgba(251,191,36,0.8)" }}
            >
              {hint.accidentalNote}
            </span>
          )}

          {/* Dismiss hint */}
          <span
            className="text-xs mt-2"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            tap anywhere to dismiss
          </span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
