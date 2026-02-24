import { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { MapPin, Clock, MessageCircle, Mail, Phone } from "lucide-react";
import { useTranslation } from "react-i18next";
import ContactFormModal from "../components/ContactFormModal";

const CONTACT_INFO = [
  {
    id: "address",
    icon: MapPin,
    href: "https://www.google.com/maps/place/Old+School+Pinball+Club/@-23.5672491,-46.6203847,15z/data=!4m2!3m1!1s0x0:0x8190719ee0467c2a",
  },
  {
    id: "whatsapp",
    icon: Phone,
    href: null, // now opens contact modal
  },
  {
    id: "email",
    icon: Mail,
    href: "mailto:oldschoolpinballsite@gmail.com",
  },
  {
    id: "hours",
    icon: Clock,
    href: null,
  },
];

export default function Contact() {
  const { t } = useTranslation();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section ref={ref} className="relative py-24 px-4 z-1">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="section-title text-pinball-red">
            {t("contact.title")}
          </h2>
          <p className="font-body text-pinball-cream/70 mt-6 max-w-xl mx-auto">
            {t("contact.description")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact info cards */}
          <div className="space-y-4">
            {CONTACT_INFO.map((info, i) => {
              const Icon = info.icon;
              const Tag = info.href ? "a" : "div";
              return (
                <motion.div
                  key={info.id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                >
                  <Tag
                    {...(info.href
                      ? {
                          href: info.href,
                          target: "_blank",
                          rel: "noopener noreferrer",
                        }
                      : info.id === "whatsapp"
                        ? {
                            onClick: () => setModalOpen(true),
                            role: "button" as const,
                          }
                        : {})}
                    className={`glass-panel p-5 flex items-center gap-4 group
                      ${info.href || info.id === "whatsapp" ? "hover:border-pinball-red/50 cursor-pointer" : ""}
                      transition-all duration-300`}
                  >
                    <div
                      className="p-3 rounded-lg bg-pinball-red/10 text-pinball-red
                      group-hover:bg-pinball-red/20 transition-colors duration-300"
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-pixel text-[10px] text-pinball-cream/50 mb-1">
                        {t(`contact.info.${info.id}_label`)}
                      </p>
                      <p
                        className={`font-body text-xs sm:text-sm text-pinball-cream/80
                        group-hover:text-pinball-cream transition-colors duration-300${info.id === "email" ? " break-all" : ""}`}
                      >
                        {/* Some values like phone or email are fine remaining hardcoded if they don't change by language, but we stored texts for some. */}
                        {info.id === "whatsapp"
                          ? "+55 (11) 91562-0127"
                          : info.id === "email"
                            ? "oldschoolpinballsite@gmail.com"
                            : t(`contact.info.${info.id}_value`)}
                      </p>
                    </div>
                  </Tag>
                </motion.div>
              );
            })}
          </div>

          {/* Map embed */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="glass-panel h-[350px] lg:h-auto transition-all duration-300 hover:border-pinball-neon-red hover:shadow-[0_0_15px_rgba(255,42,42,0.3)] cursor-crosshair"
          >
            <div className="w-full h-full overflow-hidden rounded-lg">
              <iframe
                title="Old School Pinball — Localização"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3657.1234!2d-46.6234!3d-23.5689!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sR.+Teodureto+Souto%2C+292a+-+Cambuci%2C+S%C3%A3o+Paulo+-+SP!5e0!3m2!1spt-BR!2sbr!4v1"
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{
                  filter:
                    "invert(0.9) hue-rotate(180deg) saturate(0.3) brightness(0.7)",
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center mt-12"
        >
          <button
            onClick={() => setModalOpen(true)}
            className="btn-retro animate-neon-pulse"
          >
            <MessageCircle className="w-4 h-4" />
            {t("contact.btn_contact")}
          </button>
        </motion.div>
      </div>

      <ContactFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
