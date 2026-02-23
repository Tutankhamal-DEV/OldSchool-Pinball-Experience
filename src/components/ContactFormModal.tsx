import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MessageCircle } from "lucide-react";
import WhatsAppModal from "./WhatsAppModal";
import TurnstileWidget from "./TurnstileWidget";

const WA_NUMBER = "5511915620127";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preselectedReason?: string;
}

export default function ContactFormModal({
  isOpen,
  onClose,
  preselectedReason,
}: Props) {
  const { t } = useTranslation();

  const REASONS = [
    {
      id: "general",
      label: t("forms.contact.reasons.general", "Dúvidas Gerais"),
    },
    {
      id: "events",
      label: t("forms.contact.reasons.events", "Reserva de Eventos"),
    },
    {
      id: "partnerships",
      label: t("forms.contact.reasons.partnerships", "Parcerias"),
    },
    {
      id: "feedback",
      label: t("forms.contact.reasons.feedback", "Elogios / Sugestões"),
    },
    { id: "other", label: t("forms.contact.reasons.other", "Outro") },
  ];

  // State
  const [step, setStep] = useState(0);
  const [captchaOk, setCaptchaOk] = useState(false);
  const [reason, setReason] = useState(preselectedReason || "general");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  const handleClose = () => {
    setStep(0);
    setCaptchaOk(false);
    setReason(preselectedReason || "general");
    setName("");
    setEmail("");
    setPhone("");
    setDescription("");
    onClose();
  };

  const reasonLabel = REASONS.find((r) => r.id === reason)?.label || reason;

  const buildMessage = () => {
    return [
      `📞 *${t("forms.contact.wa_title", "Contato - Old School Pinball")}*`,
      "",
      `📌 ${t("forms.contact.wa_reason", "Motivo")}: ${reasonLabel}`,
      `👤 ${t("forms.contact.wa_name", "Nome")}: ${name || "—"}`,
      `📧 Email: ${email || "—"}`,
      `📱 ${t("forms.contact.wa_phone", "Telefone")}: ${phone || "—"}`,
      "",
      `💬 ${t("forms.contact.wa_message", "Mensagem")}:`,
      description || "—",
      "",
      t(
        "forms.contact.wa_footer",
        "Mensagem enviada pelo site oldschool.tutankhamal.com",
      ),
    ].join("\n");
  };

  const handleSubmit = () => {
    const msg = encodeURIComponent(buildMessage());
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, "_blank");
    handleClose();
  };

  const steps = [
    // Step 0: Captcha
    {
      title: t("forms.captcha_title", "Verificação de Segurança"),
      canProceed: captchaOk,
      content: (
        <div className="flex flex-col items-center gap-6 py-4">
          <p className="font-body text-sm text-pinball-cream/70 text-center">
            {t("forms.captcha_desc", "Complete a verificação para continuar.")}
          </p>
          <TurnstileWidget onVerify={() => setCaptchaOk(true)} />
          {captchaOk && (
            <p className="font-tech text-xs text-green-400">
              ✓ {t("forms.captcha_ok", "Verificado com sucesso!")}
            </p>
          )}
        </div>
      ),
    },
    // Step 1: Reason
    {
      title: t("forms.contact.step_reason", "Motivo do Contato"),
      canProceed: true,
      content: (
        <div className="space-y-3">
          {REASONS.map((r) => (
            <button
              key={r.id}
              onClick={() => setReason(r.id)}
              className={`w-full p-4 rounded-lg border text-left transition-all duration-200 ${
                reason === r.id
                  ? "border-pinball-red bg-pinball-red/10 shadow-[0_0_15px_rgba(196,30,42,0.2)]"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
            >
              <span className="font-tech text-sm text-pinball-cream">
                {r.label}
              </span>
            </button>
          ))}
        </div>
      ),
    },
    // Step 2: Personal Info + Description
    {
      title: t("forms.contact.step_info", "Seus Dados"),
      canProceed: name.trim().length > 0,
      content: (
        <div className="space-y-4">
          <input
            type="text"
            placeholder={t("forms.contact.name", "Seu nome") + " *"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body text-sm text-pinball-cream placeholder:text-pinball-cream/30 focus:border-pinball-red/50 focus:outline-none transition-colors"
          />
          <input
            type="email"
            placeholder={t("forms.contact.email", "E-mail (opcional)")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body text-sm text-pinball-cream placeholder:text-pinball-cream/30 focus:border-pinball-red/50 focus:outline-none transition-colors"
          />
          <input
            type="tel"
            placeholder={t("forms.contact.phone", "Telefone (opcional)")}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body text-sm text-pinball-cream placeholder:text-pinball-cream/30 focus:border-pinball-red/50 focus:outline-none transition-colors"
          />
          <textarea
            placeholder={t(
              "forms.contact.description",
              "Descreva sua mensagem...",
            )}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-body text-sm text-pinball-cream placeholder:text-pinball-cream/30 focus:border-pinball-red/50 focus:outline-none transition-colors resize-none"
          />
        </div>
      ),
    },
    // Step 3: Preview
    {
      title: t("forms.contact.step_preview", "Prévia da Mensagem"),
      canProceed: true,
      content: (
        <div className="space-y-4">
          <p className="font-body text-xs text-pinball-cream/50">
            {t(
              "forms.contact.preview_desc",
              "Esta é a mensagem que será enviada pelo WhatsApp:",
            )}
          </p>
          <pre className="bg-white/5 border border-white/10 rounded-lg p-4 font-body text-xs text-pinball-cream/80 whitespace-pre-wrap leading-relaxed max-h-[40vh] overflow-y-auto">
            {buildMessage()}
          </pre>
        </div>
      ),
    },
  ];

  return (
    <WhatsAppModal
      isOpen={isOpen}
      onClose={handleClose}
      steps={steps}
      currentStep={step}
      onStepChange={setStep}
      onSubmit={handleSubmit}
      submitLabel={t("forms.contact.send", "Enviar pelo WhatsApp")}
      submitIcon={<MessageCircle className="w-4 h-4" />}
    />
  );
}
