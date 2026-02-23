import { useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { MapPin, Star, ShoppingCart, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import TicketFormModal from "../components/TicketFormModal";

const PLANS = [
  {
    id: "online",
    highlight: true,
    icon: Star,
    mapLink: false,
  },
  {
    id: "kids",
    highlight: false,
    icon: Zap,
    mapLink: false,
  },
  {
    id: "door",
    highlight: false,
    icon: MapPin,
    mapLink: true,
    href: "https://www.google.com/maps/place/Old+School+Pinball+Club/@-23.5672491,-46.6203847,15z/data=!4m2!3m1!1s0x0:0x8190719ee0467c2a",
  },
];

export default function Tickets() {
  const { t } = useTranslation();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPlan, setModalPlan] = useState("online");

  const openModal = (planId: string) => {
    setModalPlan(planId);
    setModalOpen(true);
  };

  return (
    <section id="ingressos" ref={ref} className="relative py-24 px-4 z-1">
      <div className="max-w-6xl mx-auto">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="section-title text-pinball-yellow">
            {t("tickets.title")}
          </h2>
          <p className="font-body text-pinball-cream/70 mt-6 max-w-xl mx-auto">
            {t("tickets.description")}
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {PLANS.map((plan, i) => {
            const Icon = plan.icon;

            const isSaturday = new Date().getDay() === 6;
            const prices = {
              online: { price: "R$ 90", original: "R$ 100" },
              door: { price: "R$ 100", original: null },
              kids: { price: `R$ ${isSaturday ? 63 : 90}`, original: "R$ 100" },
            };
            const planPrices = prices[plan.id as keyof typeof prices];

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 + i * 0.15, duration: 0.6 }}
                className="relative hover:scale-105 transition-transform duration-300 h-full flex flex-col"
              >
                <div
                  className={`flex-1 relative glass-panel p-8 text-center flex flex-col
                  ${plan.highlight ? "animated-red-border ring-2 ring-pinball-yellow/30" : ""}`}
                >
                  <Icon
                    className={`w-10 h-10 mx-auto mb-4 ${
                      plan.highlight
                        ? "text-pinball-yellow"
                        : "text-pinball-red"
                    }`}
                  />

                  <h3 className="font-pixel text-sm text-pinball-cream mb-2">
                    {t(`tickets.plans.${plan.id}.name`)}
                  </h3>

                  <div className="mb-4">
                    {planPrices.original && (
                      <span className="font-body text-pinball-cream/40 line-through text-sm mr-2">
                        {planPrices.original}
                      </span>
                    )}
                    <span
                      className={`font-retro text-4xl ${
                        plan.highlight
                          ? "text-pinball-yellow neon-text-yellow"
                          : "text-pinball-cream"
                      }`}
                    >
                      {planPrices.price}
                    </span>
                  </div>

                  <p className="font-body text-sm text-pinball-cream/60 mb-6">
                    {t(`tickets.plans.${plan.id}.description`)}
                  </p>

                  <ul className="space-y-2 mb-8 flex-1">
                    {[1, 2, 3, 4].map((fNum) => (
                      <li
                        key={fNum}
                        className="font-tech text-sm text-pinball-cream/70 flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-pinball-red" />
                        {t(`tickets.plans.${plan.id}.features.f${fNum}`)}
                      </li>
                    ))}
                  </ul>

                  {plan.mapLink ? (
                    <a
                      href={plan.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-retro w-full text-[10px] flex justify-center items-center"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{t("tickets.btn_map", "Abrir Mapa")}</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => openModal(plan.id)}
                      className={`btn-retro w-full text-[10px] ${plan.highlight ? "btn-retro-rgb" : ""} flex justify-center items-center`}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      <span>{t("tickets.btn_buy")}</span>
                    </button>
                  )}
                </div>
                {t(`tickets.plans.${plan.id}.discount`, {
                  defaultValue: "",
                }) && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pinball-red text-white font-pixel text-[10px] px-3 py-1 rounded-full whitespace-nowrap z-10 shadow-[0_0_10px_rgba(255,42,42,0.5)]">
                    {t(`tickets.plans.${plan.id}.discount`)}
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <TicketFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        preselectedPlan={modalPlan}
      />
    </section>
  );
}
