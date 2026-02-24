import { useEffect, useRef, useCallback } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
          appearance?: "always" | "execute" | "interaction-only";
        },
      ) => string;
      remove: (id: string) => void;
    };
  }
}

const TURNSTILE_SCRIPT =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

const SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

interface Props {
  onVerify: (token: string) => void;
}

export default function TurnstileWidget({ onVerify }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  const renderWidget = useCallback(() => {
    if (!window.turnstile || !containerRef.current || widgetId.current) return;
    widgetId.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      callback: onVerify,
      theme: "dark",
      size: "normal",
      appearance: "interaction-only",
    });
  }, [onVerify]);

  useEffect(() => {
    // Check if script already loaded
    if (window.turnstile) {
      renderWidget();
      return;
    }

    // Check if script tag already exists
    const existing = document.querySelector(
      `script[src^="https://challenges.cloudflare.com/turnstile"]`,
    );
    if (existing) {
      existing.addEventListener("load", renderWidget);
      return;
    }

    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT;
    script.async = true;
    script.onload = renderWidget;
    document.head.appendChild(script);

    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [renderWidget]);

  return (
    <div className="flex justify-center">
      <div ref={containerRef} />
    </div>
  );
}
