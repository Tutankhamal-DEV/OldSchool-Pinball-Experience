import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';

type MessageType = {
    id: string;
    sender: 'bot' | 'user';
    text: string;
    isOptions?: boolean;
};

export default function Chatbot() {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<MessageType[]>([]);
    const [showTooltip, setShowTooltip] = useState(true);
    const [isAtBottom, setIsAtBottom] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Tooltip timeout
    useEffect(() => {
        const timer = setTimeout(() => setShowTooltip(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    // Scroll listener to prevent footer overlap
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.innerHeight + window.scrollY;
            const documentHeight = document.documentElement.scrollHeight;
            setIsAtBottom(documentHeight - scrollPosition < 280);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Initial check
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Initialize bot welcome message
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                { id: '1', sender: 'bot', text: t("chatbot.welcome") },
                { id: '2', sender: 'bot', text: '', isOptions: true }
            ]);
        }
    }, [isOpen, messages.length, t]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSendMessage = (text: string) => {
        if (!text.trim()) return;

        // Add user message
        const userMsg: MessageType = {
            id: Date.now().toString(),
            sender: 'user',
            text: text
        };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');

        // Process bot response
        const lowerText = text.toLowerCase();
        let responseKey = '';

        const keywordsTickets = t("chatbot.keywords.tickets", { defaultValue: "ingressos,preço,valor,tickets,price,buy,cost" }).split(',');
        const keywordsLocation = t("chatbot.keywords.location", { defaultValue: "onde,local,endereço,where,location,address,map" }).split(',');
        const keywordsGames = t("chatbot.keywords.games", { defaultValue: "jogos,máquinas,pinball,games,machines,play" }).split(',');

        if (keywordsTickets.some(kw => lowerText.includes(kw.trim()))) responseKey = 'tickets';
        else if (keywordsLocation.some(kw => lowerText.includes(kw.trim()))) responseKey = 'location';
        else if (keywordsGames.some(kw => lowerText.includes(kw.trim()))) responseKey = 'games';

        setTimeout(() => {
            if (responseKey) {
                setMessages(prev => [
                    ...prev,
                    { id: Date.now().toString(), sender: 'bot', text: t(`chatbot.answers.${responseKey}`) },
                    { id: (Date.now() + 1).toString(), sender: 'bot', text: '', isOptions: true }
                ]);
            } else {
                setMessages(prev => [
                    ...prev,
                    { id: Date.now().toString(), sender: 'bot', text: t("chatbot.fallback") },
                    { id: (Date.now() + 1).toString(), sender: 'bot', text: '', isOptions: true }
                ]);
            }
        }, 600);
    };

    const handleOptionClick = (key: string) => {
        handleSendMessage(t(`chatbot.options.${key}`));
    };

    return (
        <>
            {/* Floating CTA Button */}
            <div className={`fixed right-6 z-[100] flex flex-col items-end gap-2 transition-all duration-300 ${isAtBottom ? 'bottom-40 sm:bottom-48' : 'bottom-6'}`}>
                <AnimatePresence>
                    {!isOpen && showTooltip && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="bg-pinball-black border border-pinball-neon-red/50 text-pinball-cream font-pixel text-[10px] sm:text-xs py-2 px-3 rounded shadow-[0_0_10px_rgba(196,30,42,0.6)] animate-pulse"
                        >
                            {t("chatbot.tooltip")}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {!isOpen && (
                        <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            onClick={() => setIsOpen(true)}
                            className="w-14 h-14 rounded-full bg-pinball-black border-2 border-pinball-neon-red flex items-center justify-center shadow-[0_0_15px_rgba(196,30,42,0.8)] hover:scale-110 hover:shadow-[0_0_25px_rgba(196,30,42,1)] transition-all duration-300"
                            aria-label={t("chatbot.aria_open")}
                        >
                            <MessageSquare className="w-6 h-6 text-pinball-neon-red drop-shadow-[0_0_5px_rgba(196,30,42,1)]" />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* AI Chatbot Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-pinball-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 30 }}
                            className="glass-panel border-2 border-pinball-red/40 w-full max-w-md bg-pinball-black/95 flex flex-col h-[600px] max-h-[85vh] rounded-lg shadow-[0_0_40px_rgba(196,30,42,0.3)] overflow-hidden"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-pinball-red/20 to-transparent border-b border-pinball-red/30 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Bot className="w-6 h-6 text-pinball-neon-red animate-pulse" />
                                    <div>
                                        <h2 className="font-tech text-pinball-cream text-lg tracking-wider">
                                            {t("chatbot.title")}
                                        </h2>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse drop-shadow-[0_0_3px_#22c55e]" />
                                            <span className="font-pixel text-[8px] text-green-500/80 uppercase">{t("chatbot.status_online")} - v1.0.4</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-pinball-cream/60 hover:text-white transition-colors"
                                    aria-label={t("chatbot.aria_close")}
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Messages Container */}
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex items-end gap-2 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                            <div className="flex-shrink-0 w-8 h-8 rounded bg-pinball-black border border-current/20 flex items-center justify-center">
                                                {msg.sender === 'bot' ? (
                                                    <Bot className="w-4 h-4 text-pinball-neon-red" />
                                                ) : (
                                                    <User className="w-4 h-4 text-pinball-yellow" />
                                                )}
                                            </div>
                                            <div className={`p-3 rounded-lg text-sm font-body leading-relaxed border backdrop-blur-sm ${msg.sender === 'user'
                                                ? 'bg-pinball-yellow/10 border-pinball-yellow/30 text-pinball-cream'
                                                : 'bg-pinball-red/10 border-pinball-red/30 text-pinball-cream'
                                                }`}>
                                                {msg.isOptions ? (
                                                    <div className="flex flex-col gap-2 mt-1">
                                                        {['tickets', 'location', 'games'].map(optionKey => (
                                                            <button
                                                                key={optionKey}
                                                                onClick={() => handleOptionClick(optionKey)}
                                                                className="text-left font-tech text-xs w-full py-1.5 px-3 rounded border border-pinball-red/40 hover:bg-pinball-red/20 transition-colors bg-pinball-black/50 text-pinball-cream/90 hover:text-white"
                                                            >
                                                                {t(`chatbot.options.${optionKey}`)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    msg.text
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 border-t border-pinball-red/30 bg-pinball-black/60">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSendMessage(inputValue);
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder={t("chatbot.placeholder") || "Digite sua mensagem..."}
                                        className="flex-1 bg-pinball-black border border-pinball-cream/20 rounded px-4 py-3 font-body text-sm text-pinball-cream focus:outline-none focus:border-pinball-red/60 focus:ring-1 focus:ring-pinball-red/60 placeholder:text-pinball-cream/30"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!inputValue.trim()}
                                        className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded bg-pinball-red/20 border border-pinball-red/40 text-pinball-neon-red hover:bg-pinball-red/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-label={t("chatbot.aria_send")}
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
