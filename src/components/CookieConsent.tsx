import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { Info, X, ShieldCheck, FileText, Check } from "lucide-react";

export default function CookieConsent() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    // Only show if the user hasn't explicitly consented yet
    const consent = localStorage.getItem("osp_cookie_consent");
    if (!consent) {
      // Small delay so it doesn't pop up instantly on page load
      const timer = setTimeout(() => setIsVisible(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("osp_cookie_consent", "accepted");
    setIsVisible(false);
    setShowModal(false);
  };

  return (
    <>
      {/* Small Floating Consent Banner */}
      <AnimatePresence>
        {isVisible && !showModal && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:bottom-8 md:w-[500px] z-[9998]"
          >
            <div className="glass-panel p-5 relative !bg-pinball-black/95">
              <button
                onClick={() => setIsVisible(false)}
                className="absolute top-3 right-3 text-pinball-cream/60 hover:text-pinball-red transition-colors"
                aria-label="Dismiss (Does not save consent)"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex gap-4 items-start">
                <Info className="w-6 h-6 text-pinball-neon-red flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-tech text-lg text-pinball-cream mb-2">
                    {t("cookies.title") || "Políticas de Privacidade"}
                  </h3>
                  <p className="font-body text-xs text-pinball-cream/80 mb-4 leading-relaxed">
                    {t("cookies.message") ||
                      "Usamos cookies apenas para aprimorar sua experiência de navegação (como idioma preferido) de acordo com a LGPD. Não revendemos dados. Ao continuar, você concorda com nossos termos."}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowModal(true)}
                      className="flex flex-col md:flex-row items-center justify-center gap-1 !py-2 !px-2 text-xs font-tech text-pinball-cream/80 hover:text-white border border-pinball-red/30 hover:border-pinball-red rounded bg-transparent transition-all w-1/2 text-center"
                    >
                      <FileText className="w-4 h-4" />
                      {t("cookies.info_btn") || "INFORMAÇÕES"}
                    </button>
                    <button
                      onClick={handleAccept}
                      className="!flex flex-col md:flex-row items-center justify-center gap-1 btn-retro !py-2 !px-2 w-1/2 text-center text-xs font-tech animate-neon-pulse"
                    >
                      <Check className="w-4 h-4" />
                      {t("cookies.accept") || "CONCORDO"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detailed LGPD Modal Overlay */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-pinball-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel-heavy p-6 md:p-8 max-w-2xl w-full relative max-h-[85vh] flex flex-col"
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-pinball-cream/60 hover:text-white transition-colors"
                aria-label="Fechar Modal"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="w-8 h-8 text-pinball-neon-red" />
                <h2 className="font-tech text-2xl text-pinball-cream">
                  {t("cookies.modal_title") || "Política de Cookies & LGPD"}
                </h2>
              </div>

              <div className="overflow-y-auto pr-2 custom-scrollbar font-body text-sm text-pinball-cream/80 space-y-4 mb-8">
                {(t("cookies.modal_content") || "")
                  .split("\n\n")
                  .map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
              </div>

              <div className="mt-auto pt-4 border-t border-pinball-red/20 flex justify-end">
                <button
                  onClick={handleAccept}
                  className="btn-retro font-tech animate-neon-pulse"
                >
                  {t("cookies.accept") || "Compreendido"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
