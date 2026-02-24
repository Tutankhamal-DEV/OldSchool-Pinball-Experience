import { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import {
  PartyPopper,
  Briefcase,
  Camera,
  Mic,
  MessageCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import ContactFormModal from "../components/ContactFormModal";

const EVENT_TYPES = [
  {
    id: "birthday",
    icon: PartyPopper,
    color: "text-pinball-yellow",
  },
  {
    id: "corporate",
    icon: Briefcase,
    color: "text-pinball-neon-blue",
  },
  {
    id: "podcast",
    icon: Mic,
    color: "text-pinball-neon-green",
  },
  {
    id: "media",
    icon: Camera,
    color: "text-pinball-neon-pink",
  },
];

export default function Events() {
  const { t } = useTranslation();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section id="eventos" ref={ref} className="relative py-24 px-4 z-1">
      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="section-title text-pinball-red">
            {t("events.title")}
          </h2>
          <p className="font-body text-pinball-cream/70 mt-6 max-w-xl mx-auto">
            {t("events.description")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {EVENT_TYPES.map((event, i) => {
            const Icon = event.icon;
            return (
              <motion.div
                key={event.id}
                initial={{
                  opacity: 0,
                  x: i === 0 ? -40 : i === 2 ? 40 : 0,
                  y: i === 1 ? 40 : 0,
                }}
                animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.15, duration: 0.6 }}
                className="glass-panel p-8 text-center hover:scale-105 transition-transform duration-300 group"
              >
                <div
                  className={`inline-flex p-4 rounded-lg border-2 border-current/20 bg-pinball-dark mb-6
                  group-hover:animate-pulse ${event.color}`}
                >
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="font-pixel text-xs text-pinball-cream mb-3">
                  {t(`events.types.${event.id}.title`)}
                </h3>
                <p className="font-body text-sm text-pinball-cream/60">
                  {t(`events.types.${event.id}.description`)}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center mt-12"
        >
          <button onClick={() => setModalOpen(true)} className="btn-retro">
            <MessageCircle className="w-4 h-4" />
            {t("events.btn_reserve")}
          </button>
        </motion.div>
      </div>

      <ContactFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        preselectedReason="events"
      />
    </section>
  );
}
