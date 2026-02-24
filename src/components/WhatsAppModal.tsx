import { useEffect, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

export interface ModalStep {
  title: string;
  content: ReactNode;
  /** If true, the "Next" button is disabled until the step sets canProceed */
  canProceed?: boolean;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  steps: ModalStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onSubmit: () => void;
  submitLabel: string;
  submitIcon?: ReactNode;
}

export default function WhatsAppModal({
  isOpen,
  onClose,
  steps,
  currentStep,
  onStepChange,
  onSubmit,
  submitLabel,
  submitIcon,
}: Props) {
  const { t } = useTranslation();
  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];
  const canProceed = step?.canProceed !== false;

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border-2 border-pinball-red bg-pinball-black/95 backdrop-blur-md shadow-[0_0_40px_rgba(196,30,42,0.4),0_0_80px_rgba(0,255,255,0.1)]"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b-2 border-pinball-red/40 bg-pinball-black/95 backdrop-blur-md">
              <h3 className="font-pixel text-sm text-pinball-cream">
                {step?.title}
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-pinball-cream/60 hover:text-pinball-cream transition-colors"
                aria-label={t("forms.close", "Fechar")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex gap-1.5 px-6 pt-4">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    i <= currentStep ? "bg-pinball-red" : "bg-white/10"
                  }`}
                />
              ))}
            </div>

            {/* Content */}
            <div className="px-6 py-5 min-h-[350px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                >
                  {step?.content}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex items-center justify-between px-6 py-4 border-t-2 border-pinball-red/40 bg-pinball-black/95 backdrop-blur-md">
              <button
                onClick={() => onStepChange(currentStep - 1)}
                disabled={currentStep === 0}
                className="flex items-center gap-1 font-tech text-sm text-pinball-cream/60 hover:text-pinball-cream disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                {t("forms.back", "Voltar")}
              </button>

              {isLastStep ? (
                <button
                  onClick={onSubmit}
                  disabled={!canProceed}
                  className="btn-retro !py-2 !px-5 !text-xs flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitIcon}
                  {submitLabel}
                </button>
              ) : (
                <button
                  onClick={() => onStepChange(currentStep + 1)}
                  disabled={!canProceed}
                  className="flex items-center gap-1 font-tech text-sm text-pinball-cream bg-pinball-red/80 hover:bg-pinball-red px-4 py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {t("forms.next", "Próximo")}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
