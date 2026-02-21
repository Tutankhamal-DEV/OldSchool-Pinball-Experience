import { useEffect, useState, useRef } from 'react'
import CanvasBackground from './components/effects/CanvasBackground'
import CRTOverlay from './components/effects/CRTOverlay'
import CookieConsent from './components/CookieConsent'
import Navbar from './components/Navbar'
import Hero from './features/Hero'
import Tickets from './features/Tickets'
import Events from './features/Events'
import Machines from './features/Machines'
import Media from './features/Media'
import Atmosphere from './features/Atmosphere'
import AmericanBar from './features/AmericanBar'
import Contact from './features/Contact'
import Footer from './components/Footer'
import Chatbot from './components/Chatbot'

export default function App() {
    const [activeSection, setActiveSection] = useState('home');
    const activeSectionRef = useRef(activeSection);

    // Sync ref when state changes
    useEffect(() => {
        activeSectionRef.current = activeSection;
    }, [activeSection]);

    useEffect(() => {
        const visibleRatios: Record<string, number> = {};

        const observer = new IntersectionObserver((entries) => {
            let maxRatio = 0;
            let currentActive = activeSectionRef.current;

            entries.forEach(entry => {
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
        }, {
            // Creates multiple trigger points for smooth continuous tracking
            threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
        });

        const sections = document.querySelectorAll('section, header, footer');
        sections.forEach(section => {
            if (section.id) observer.observe(section);
        });

        return () => observer.disconnect();
    }, []); // Empty dependency array, observer never recreates

    return (
        <div className="relative min-h-screen overflow-x-hidden text-pinball-cream font-sans">
            {/* Full-viewport Canvas Background — z-index 1-5 */}
            <CanvasBackground activeSection={activeSection} />

            {/* CRT Scanline Overlay */}
            <CRTOverlay />

            {/* Navigation */}
            <Navbar activeSection={activeSection} />

            {/* Main Content — transparent so fixed layers (shadow/canvas) show through. z-50 keeps content above all fixed layers */}
            <main className="relative z-50">
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
                        src="/images/nav_logo_oldschool.avif"
                        alt="Old School Pinball"
                        className="h-24 md:h-32 w-auto object-contain hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    />
                </div>

                {/* Footer */}
                <Footer />
            </section>

            <Chatbot />

            <CookieConsent />
        </div>
    )
}
