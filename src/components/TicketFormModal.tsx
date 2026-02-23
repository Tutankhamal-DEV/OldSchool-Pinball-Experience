import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { MessageCircle, Minus, Plus, Tag, Users } from "lucide-react";
import WhatsAppModal from "./WhatsAppModal";
import TurnstileWidget from "./TurnstileWidget";

const WA_NUMBER = "5511915620127";

interface Plan {
  id: string;
  name: string;
  price: number;
  original?: number;
}

interface Guest {
  name: string;
  ageRange: string;
  cpf: string;
  rg: string;
}

interface CartItem {
  planId: string;
  guests: Guest[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preselectedPlan?: string;
}

const KIDS_AGE_RANGES = ["0-5", "6-12"];
const ADULT_AGE_RANGES = ["13+"];

const emptyGuest = (planId: string): Guest => ({
  name: "",
  ageRange: planId === "kids" ? "6-12" : "18-25",
  cpf: "",
  rg: "",
});

export default function TicketFormModal({
  isOpen,
  onClose,
  preselectedPlan,
}: Props) {
  const { t } = useTranslation();

  const isSaturday = new Date().getDay() === 6;

  const PLANS: Plan[] = useMemo(
    () => [
      {
        id: "online",
        name: t("tickets.plans.online.name"),
        price: 90,
        original: 100,
      },
      {
        id: "kids",
        name: t("tickets.plans.kids.name"),
        price: isSaturday ? 63 : 90,
        original: 100,
      },
    ],
    [t, isSaturday],
  );

  // State
  const [step, setStep] = useState(0);
  const [captchaOk, setCaptchaOk] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const initial = preselectedPlan || "online";
    return [{ planId: initial, guests: [emptyGuest(initial)] }];
  });
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  // Track which cart item's guests we're editing
  const [editingIdx, setEditingIdx] = useState(0);

  const handleClose = () => {
    setStep(0);
    setCaptchaOk(false);
    setCart([
      {
        planId: preselectedPlan || "online",
        guests: [emptyGuest(preselectedPlan || "online")],
      },
    ]);
    setPromoCode("");
    setPromoApplied(false);
    setEditingIdx(0);
    onClose();
  };

  // Cart helpers
  const getQty = (planId: string) =>
    cart.find((c) => c.planId === planId)?.guests.length ?? 0;

  const setQty = (planId: string, qty: number) => {
    const clamped = Math.max(0, Math.min(20, qty));
    setCart((prev) => {
      if (clamped === 0) return prev.filter((c) => c.planId !== planId);
      const existing = prev.find((c) => c.planId === planId);
      if (!existing) {
        return [
          ...prev,
          {
            planId,
            guests: Array.from({ length: clamped }, () => emptyGuest(planId)),
          },
        ];
      }
      return prev.map((c) => {
        if (c.planId !== planId) return c;
        const g = [...c.guests];
        while (g.length < clamped) g.push(emptyGuest(planId));
        return { ...c, guests: g.slice(0, clamped) };
      });
    });
  };

  const updateGuest = (
    cartIdx: number,
    guestIdx: number,
    field: keyof Guest,
    value: string,
  ) => {
    setCart((prev) =>
      prev.map((c, ci) =>
        ci === cartIdx
          ? {
              ...c,
              guests: c.guests.map((g, gi) =>
                gi === guestIdx ? { ...g, [field]: value } : g,
              ),
            }
          : c,
      ),
    );
  };

  const getPlan = (id: string) => PLANS.find((p) => p.id === id)!;
  const totalTickets = cart.reduce((sum, c) => sum + c.guests.length, 0);
  const totalPrice = cart.reduce(
    (sum, c) => sum + getPlan(c.planId).price * c.guests.length,
    0,
  );
  const allGuestsNamed = cart.every((c) =>
    c.guests.every((g) => g.name.trim().length > 0),
  );

  // Build WhatsApp message
  const buildMessage = () => {
    const sections = cart.map((c) => {
      const plan = getPlan(c.planId);
      const guestLines = c.guests
        .map(
          (g, i) =>
            `  ${i + 1}. ${g.name || "—"} | ${g.ageRange} | CPF: ${g.cpf || "—"} | RG: ${g.rg || "—"}`,
        )
        .join("\n");
      return `📋 ${plan.name} × ${c.guests.length} (R$ ${plan.price * c.guests.length})\n${guestLines}`;
    });

    return [
      `🎮 *${t("forms.ticket.wa_title", "Reserva de Passaporte - Old School Pinball")}*`,
      "",
      ...sections,
      "",
      `💰 Total: R$ ${totalPrice}`,
      promoApplied
        ? `🏷️ ${t("forms.ticket.wa_promo", "Cupom")}: ${promoCode}`
        : `🏷️ ${t("forms.ticket.wa_promo", "Cupom")}: ${t("forms.ticket.wa_none", "Nenhum")}`,
      "",
      t(
        "forms.ticket.wa_footer",
        "Mensagem enviada pelo site oldschool.tutankhamal.com",
      ),
    ].join("\n");
  };

  const handleSubmit = () => {
    const msg = encodeURIComponent(buildMessage());
    window.open(`https://wa.me/${WA_NUMBER}?text=${msg}`, "_blank");
    handleClose();
  };

  // ── Step definitions ──

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

    // Step 1: Cart builder — qty per plan type
    {
      title: t("forms.ticket.step_cart", "Monte seu Pedido"),
      canProceed: totalTickets > 0,
      content: (
        <div className="space-y-4">
          <p className="font-body text-xs text-pinball-cream/50 mb-2">
            {t(
              "forms.ticket.cart_desc",
              "Adicione a quantidade de cada tipo de ingresso:",
            )}
          </p>
          {PLANS.map((p) => {
            const qty = getQty(p.id);
            return (
              <div
                key={p.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                  qty > 0
                    ? "border-pinball-red bg-pinball-red/10"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div>
                  <p className="font-pixel text-xs text-pinball-cream">
                    {p.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {p.original && (
                      <span className="font-body text-xs text-pinball-cream/40 line-through">
                        R$ {p.original}
                      </span>
                    )}
                    <span className="font-retro text-lg text-pinball-yellow">
                      R$ {p.price}
                    </span>
                    <span className="font-body text-[10px] text-pinball-cream/40">
                      /{t("forms.ticket.per_person", "pessoa")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQty(p.id, qty - 1)}
                    disabled={qty <= 0}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-pinball-cream"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-retro text-lg text-pinball-cream w-8 text-center">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(p.id, qty + 1)}
                    disabled={qty >= 20}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-pinball-cream"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {totalTickets > 0 && (
            <div className="flex justify-between items-center pt-2 border-t border-white/10">
              <span className="font-tech text-sm text-pinball-cream/70 flex items-center gap-2">
                <Users className="w-4 h-4" /> {totalTickets}{" "}
                {totalTickets === 1
                  ? t("forms.ticket.ticket_singular", "ingresso")
                  : t("forms.ticket.ticket_plural", "ingressos")}
              </span>
              <span className="font-retro text-lg text-pinball-yellow">
                R$ {totalPrice}
              </span>
            </div>
          )}
        </div>
      ),
    },

    // Step 2: Guest details — grouped by plan type
    {
      title: t("forms.ticket.step_guests", "Dados dos Ingressos"),
      canProceed: allGuestsNamed,
      content: (
        <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
          {/* Tabs for each plan type in cart */}
          {cart.length > 1 && (
            <div className="flex gap-2 mb-2">
              {cart.map((c, ci) => (
                <button
                  key={c.planId}
                  onClick={() => setEditingIdx(ci)}
                  className={`flex-1 py-2 px-3 rounded-lg font-tech text-xs transition-colors ${
                    editingIdx === ci
                      ? "bg-pinball-red text-white"
                      : "bg-white/5 text-pinball-cream/60 hover:bg-white/10"
                  }`}
                >
                  {getPlan(c.planId).name} ({c.guests.length})
                </button>
              ))}
            </div>
          )}

          {/* Guest forms for selected plan type */}
          {(() => {
            const item = cart[editingIdx];
            if (!item) return null;
            return item.guests.map((guest, gIdx) => (
              <div
                key={`${item.planId}-${gIdx}`}
                className="border border-white/10 rounded-lg p-4 space-y-3"
              >
                <span className="font-pixel text-[10px] text-pinball-yellow">
                  {getPlan(item.planId).name} —{" "}
                  {t("forms.ticket.guest", "Ingresso")} {gIdx + 1}
                </span>

                <input
                  type="text"
                  placeholder={t("forms.ticket.name", "Nome completo") + " *"}
                  value={guest.name}
                  onChange={(e) =>
                    updateGuest(editingIdx, gIdx, "name", e.target.value)
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 font-body text-sm text-pinball-cream placeholder:text-pinball-cream/30 focus:border-pinball-red/50 focus:outline-none transition-colors"
                />

                <select
                  value={guest.ageRange}
                  onChange={(e) =>
                    updateGuest(editingIdx, gIdx, "ageRange", e.target.value)
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 font-body text-sm text-pinball-cream focus:border-pinball-red/50 focus:outline-none transition-colors appearance-none"
                >
                  {(item.planId === "kids"
                    ? KIDS_AGE_RANGES
                    : ADULT_AGE_RANGES
                  ).map((r: string) => (
                    <option key={r} value={r} className="bg-pinball-black">
                      {t("forms.ticket.age", "Faixa etária")}: {r}{" "}
                      {t("forms.ticket.years", "anos")}
                    </option>
                  ))}
                </select>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder={t(
                      "forms.ticket.cpf_placeholder",
                      "CPF (opcional)",
                    )}
                    value={guest.cpf}
                    onChange={(e) =>
                      updateGuest(editingIdx, gIdx, "cpf", e.target.value)
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 font-body text-xs text-pinball-cream placeholder:text-pinball-cream/30 focus:border-pinball-red/50 focus:outline-none transition-colors"
                  />
                  <input
                    type="text"
                    placeholder={t(
                      "forms.ticket.rg_placeholder",
                      "RG (opcional)",
                    )}
                    value={guest.rg}
                    onChange={(e) =>
                      updateGuest(editingIdx, gIdx, "rg", e.target.value)
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 font-body text-xs text-pinball-cream placeholder:text-pinball-cream/30 focus:border-pinball-red/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            ));
          })()}
        </div>
      ),
    },

    // Step 3: Promo Code + Summary
    {
      title: t("forms.ticket.step_promo", "Cupom & Resumo"),
      canProceed: true,
      content: (
        <div className="space-y-5">
          {/* Promo code */}
          <div className="border border-white/10 rounded-lg p-4">
            <label className="font-pixel text-[10px] text-pinball-cream/60 mb-2 block">
              {t("forms.ticket.promo_label", "Código Promocional")}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pinball-cream/30" />
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => {
                    setPromoCode(e.target.value.toUpperCase());
                    setPromoApplied(false);
                  }}
                  placeholder={t(
                    "forms.ticket.promo_placeholder",
                    "Ex: RETRO10",
                  )}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-3 py-2 font-tech text-sm text-pinball-cream placeholder:text-pinball-cream/30 focus:border-pinball-red/50 focus:outline-none transition-colors uppercase"
                />
              </div>
              <button
                onClick={() => setPromoApplied(promoCode.trim().length > 0)}
                disabled={!promoCode.trim()}
                className="px-4 py-2 rounded-lg bg-pinball-red/20 text-pinball-red hover:bg-pinball-red/30 disabled:opacity-30 disabled:cursor-not-allowed font-tech text-xs transition-colors"
              >
                {t("forms.ticket.promo_apply", "Aplicar")}
              </button>
            </div>
            {promoApplied && (
              <p className="font-tech text-xs text-green-400 mt-2">
                ✓ {t("forms.ticket.promo_added", "Cupom adicionado à mensagem")}
              </p>
            )}
          </div>

          {/* Summary per type */}
          <div className="border border-white/10 rounded-lg p-4 space-y-3">
            <h4 className="font-pixel text-[10px] text-pinball-yellow mb-1">
              {t("forms.ticket.summary", "Resumo do Pedido")}
            </h4>
            {cart.map((c) => {
              const plan = getPlan(c.planId);
              return (
                <div
                  key={c.planId}
                  className="flex justify-between font-body text-sm text-pinball-cream/70"
                >
                  <span>
                    {plan.name} × {c.guests.length}
                  </span>
                  <span>R$ {plan.price * c.guests.length}</span>
                </div>
              );
            })}
            <div className="border-t border-white/10 pt-2 flex justify-between font-pixel text-sm">
              <span className="text-pinball-cream">Total</span>
              <span className="text-pinball-yellow">R$ {totalPrice}</span>
            </div>
            {promoApplied && (
              <p className="font-tech text-xs text-pinball-cream/50">
                🏷️ {promoCode}
              </p>
            )}
          </div>

          {/* Guest list */}
          <div className="border border-white/10 rounded-lg p-4 space-y-2">
            <h4 className="font-pixel text-[10px] text-pinball-yellow mb-1">
              {t("forms.ticket.wa_guests", "Ingressos")} ({totalTickets})
            </h4>
            {cart.map((c) =>
              c.guests.map((g, gi) => (
                <p
                  key={`${c.planId}-${gi}`}
                  className="font-body text-xs text-pinball-cream/60 truncate"
                >
                  {getPlan(c.planId).name}: {g.name || "—"} ({g.ageRange})
                </p>
              )),
            )}
          </div>
        </div>
      ),
    },

    // Step 4: Message Preview
    {
      title: t("forms.ticket.step_preview", "Prévia da Mensagem"),
      canProceed: true,
      content: (
        <div className="space-y-4">
          <p className="font-body text-xs text-pinball-cream/50">
            {t(
              "forms.ticket.preview_desc",
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
      submitLabel={t("forms.ticket.send", "Enviar pelo WhatsApp")}
      submitIcon={<MessageCircle className="w-4 h-4" />}
    />
  );
}
