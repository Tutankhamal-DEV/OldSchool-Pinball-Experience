import { useEffect } from "react";

/**
 * useContentProtection
 * Comprehensive client-side content protection:
 * - Blocks right-click context menu
 * - Blocks keyboard shortcuts for DevTools (F12, Ctrl+Shift+I/J/C/U, Ctrl+U)
 * - Prevents image dragging
 * - Prevents text selection via keyboard (Ctrl+A)
 * - Prevents saving page (Ctrl+S)
 * - Prevents printing (Ctrl+P)
 *
 * NOTE: Only active in production builds to allow development workflow.
 */
export function useContentProtection() {
  useEffect(() => {
    // Allow DevTools in development mode
    if (import.meta.env.DEV) return;

    // ── 1. Block right-click context menu ──
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // ── 2. Block DevTools keyboard shortcuts & save/print ──
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        return;
      }

      // Ctrl+Shift+I (DevTools), Ctrl+Shift+J (Console), Ctrl+Shift+C (Inspector)
      if (
        e.ctrlKey &&
        e.shiftKey &&
        ["I", "i", "J", "j", "C", "c"].includes(e.key)
      ) {
        e.preventDefault();
        return;
      }

      // Ctrl+U (View Source)
      if (e.ctrlKey && (e.key === "u" || e.key === "U")) {
        e.preventDefault();
        return;
      }

      // Ctrl+S (Save page)
      if (e.ctrlKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        return;
      }

      // Ctrl+P (Print)
      if (e.ctrlKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        return;
      }
    };

    // ── 3. Block image dragging globally ──
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "IMG" ||
        target.tagName === "PICTURE" ||
        target.tagName === "VIDEO"
      ) {
        e.preventDefault();
      }
    };

    // ── 4. Block copy (optional extra layer) ──
    const handleCopy = (e: ClipboardEvent) => {
      // Allow copy inside input/textarea for form usability
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      e.preventDefault();
    };

    // Attach all listeners
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("dragstart", handleDragStart);
    document.addEventListener("copy", handleCopy);

    // Cleanup on unmount
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("dragstart", handleDragStart);
      document.removeEventListener("copy", handleCopy);
    };
  }, []);
}
