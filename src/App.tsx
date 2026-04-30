import { useEffect, useState, Suspense, lazy, useRef } from "react";
import { useContentProtection } from "./hooks/useContentProtection";
const CRTOverlay = lazy(() => import("./components/effects/CRTOverlay"));
const CookieConsent = lazy(() => import("./components/CookieConsent"));
import Navbar from "./components/Navbar";
import Hero from "./features/Hero";
import TVPage from "./pages/TVPage";

// Ultra-light DOM delivery using lazy dynamic imports for below-the-fold sections
const CanvasBackground = lazy(
  () => import("./components/effects/CanvasBackground"),
);
const Atmosphere = lazy(() => import("./features/Atmosphere"));
const AmericanBar = lazy(() => import("./features/AmericanBar"));
const Contact = lazy(() => import("./features/Contact"));
const Events = lazy(() => import("./features/Events"));
const Footer = lazy(() => import("./components/Footer"));
const Machines = lazy(() => import("./features/Machines"));
const Media = lazy(() => import("./features/Media"));
const Tickets = lazy(() => import("./features/Tickets"));

export default function App() {
  useContentProtection();
  
  // Basic routing for TV page
  const [isTVRoute] = useState(() => {
    return window.location.pathname === "/tv" || window.location.hostname === "tv.oldschool.plus";
  });

  const [activeSection, setActiveSection] = useState("home");
  const activeSectionRef = useRef(activeSection);

  // Preloader handoff is managed by Hero.tsx (adopts image, then hides overlay)

  // Sync ref when state changes
  useEffect(() => {
    activeSectionRef.current = activeSection;
  }, [activeSection]);

  useEffect(() => {
    const visibleRatios: Record<string, number> = {};

    const observer = new IntersectionObserver(
      (entries) => {
        let maxRatio = 0;
        let currentActive = activeSectionRef.current;

        entries.forEach((entry) => {
          // Update the tracked ratio for this element
          visibleRatios[entry.target.id] = entry.intersectionRatio;
        });

        // Find the section that takes up the most space
        for (const [id, ratio] of Object.entries(visibleRatios)) {
          if (ratio > maxRatio) {
            maxRatio = ratio;
            currentActive = id;
          }
        }

        // Only switch if something is reasonably visible (to avoid empty states between sections)
        if (maxRatio > 0.1 && currentActive !== activeSectionRef.current) {
          setActiveSection(currentActive);
        }
      },
      {
        // Creates multiple trigger points for smooth continuous tracking
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
      },
    );

    const observeSections = () => {
      document
        .querySelectorAll("section, header, footer")
        .forEach((section) => {
          if (section.id) observer.observe(section);
        });
    };

    // Initial binding for synchronously rendered structural tags
    observeSections();

    // React.lazy dynamically injects sections asynchronously *after* mount.
    // We use a MutationObserver to hook them securely into the tracker once they spawn.
    const mutationObserver = new MutationObserver(() => {
      observeSections();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [isTVRoute]); // Added dependency to avoid observer setup when not rendering main layout

  if (isTVRoute) {
    return (
      <Suspense fallback={<div className="min-h-svh bg-black" />}>
        <TVPage />
      </Suspense>
    );
  }

  return (
    <div className="relative min-h-svh overflow-x-hidden text-pinball-cream font-sans">
      {/* CRT Scanline Overlay */}
      <CRTOverlay />

      {/* Navigation */}
      <Navbar activeSection={activeSection} />

      {/* Main Content — transparent so fixed layers (shadow/canvas) show through. z-50 keeps content above all fixed layers */}
      <Suspense fallback={null}>
        {/* Background Magic */}
        <CanvasBackground activeSection={activeSection} />

        <main
          id="main-content"
          tabIndex={-1}
          className="relative z-50 w-full flex flex-col items-center"
        >
          <Hero />
          <Atmosphere />
          <AmericanBar />
          <Machines />
          <Media />
          <Events />
          <Tickets />
        </main>

        {/* Consolidated Contact & Footer section so activeSection doesn't bounce at the bottom */}
        <section id="contato" className="relative pb-0 z-50">
          <Contact />

          {/* Pre-footer Logo */}
          <div className="flex justify-center py-12 relative z-[100]">
            <img
              src="/images/logo_oldschool_vector_600p.svg"
              alt="Old School Pinball"
              className="h-24 md:h-32 w-auto object-contain hover:scale-105 transition-transform duration-300 cursor-pointer"
              width={600}
              height={478}
              loading="lazy"
              decoding="async"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            />
          </div>

          {/* Footer */}
          <Footer />
        </section>

      </Suspense>

      <CookieConsent />
    </div>
  );
}
