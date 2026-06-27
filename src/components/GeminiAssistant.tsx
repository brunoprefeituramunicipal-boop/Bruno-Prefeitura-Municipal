import React, { useState, useRef, useEffect } from "react";
import { Passagem, Passageiro, Empresa } from "../types";
import { MessageSquareCode, Send, Sparkles, X, Bot, User as UserIcon, Loader2, RefreshCw } from "lucide-react";

interface GeminiAssistantProps {
  passagens: Passagem[];
  passageiros: Passageiro[];
  empresas: Empresa[];
  currentUserEmail?: string;
}

interface Message {
  sender: "user" | "bot";
  text: string;
}

export default function GeminiAssistant({ passagens, passageiros, empresas, currentUserEmail }: GeminiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "Olá! Sou o Assistente Inteligente da SEGAF de Portel. Posso lhe dar respostas baseadas em dados reais sobre viagens agendadas, gastos mensais, empresas utilizadas e sugerir estratégias de economia. Como posso ajudar você hoje?"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [queriesLeft, setQueriesLeft] = useState<number>(10);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const getQueriesLeft = (): number => {
    const today = new Date().toISOString().split("T")[0];
    const storageKey = `segaf_copilot_usage_${currentUserEmail || "usuario"}`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) {
          return Math.max(0, 10 - parsed.count);
        }
      }
    } catch (e) {
      console.error(e);
    }
    return 10;
  };

  const checkAndIncrementUsage = (): boolean => {
    const today = new Date().toISOString().split("T")[0];
    const storageKey = `segaf_copilot_usage_${currentUserEmail || "usuario"}`;
    try {
      const stored = localStorage.getItem(storageKey);
      let usage = { date: today, count: 0 };
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) {
          usage = parsed;
        }
      }
      if (usage.count >= 10) {
        return false;
      }
      usage.count += 1;
      localStorage.setItem(storageKey, JSON.stringify(usage));
      setQueriesLeft(Math.max(0, 10 - usage.count));
      return true;
    } catch (e) {
      console.error(e);
      return true;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setQueriesLeft(getQueriesLeft());
    }
  }, [isOpen, messages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Clean and prepare minimized grounding data to feed Gemini
  const compileGroundingContext = () => {
    const getPassageiroName = (id: string) => passageiros.find(p => p.id === id)?.nome || "Desconhecido";
    const getEmpresaName = (id: string) => empresas.find(e => e.id === id)?.nomeFantasia || "Desconhecida";

    const formattedTickets = passagens.map(p => ({
      id: p.id,
      passageiro: getPassageiroName(p.passageiroId),
      empresa: getEmpresaName(p.empresaId),
      destino: p.destino,
      dataViagem: p.dataViagem,
      valorFinal: p.valorFinal,
      tipo: p.tipoViagem,
      status: p.status
    }));

    return {
      estatisticas_gerais: {
        total_passagens_emitidas: passagens.length,
        total_passageiros_cadastrados: passageiros.length,
        total_empresas_parceiras: empresas.length,
        custo_acumulado_total: passagens.reduce((acc, p) => acc + p.valorFinal, 0),
        data_atual_sistema: new Date().toISOString().split("T")[0]
      },
      listagem_passagens_reais: formattedTickets
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput("");
    setMessages(prev => [...prev, { sender: "user", text: userText }]);
    setLoading(true);

    if (!checkAndIncrementUsage()) {
      setLoading(false);
      setMessages(prev => [
        ...prev,
        {
          sender: "bot",
          text: "Você atingiu o limite diário de consultas gratuitas do SEGAF Copilot. Novas consultas estarão disponíveis amanhã."
        }
      ]);
      return;
    }

    try {
      // Gather current real-time database snapshot for grounding
      const contextData = compileGroundingContext();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userText,
          contextData
        })
      });

      if (!response.ok) {
        throw new Error("Erro na comunicação com o servidor Gemini.");
      }

      const data = await response.json();
      setMessages(prev => [...prev, { sender: "bot", text: data.text }]);
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev, 
        { sender: "bot", text: "Desculpe, ocorreu um erro ao conectar com o meu motor de IA. Verifique as configurações de rede." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Basic markdown text renderer helper
  const renderMessageText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Bold rendering **text**
      let renderedLine: React.ReactNode = line;
      if (line.includes("**")) {
        const parts = line.split("**");
        renderedLine = parts.map((part, pIdx) => {
          if (pIdx % 2 === 1) {
            return <strong key={pIdx} className="font-bold text-slate-950 dark:text-white">{part}</strong>;
          }
          return part;
        });
      }

      // Check bullet point
      if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-sm py-0.5">
            {line.substring(2)}
          </li>
        );
      }

      return (
        <p key={idx} className="text-sm leading-relaxed mb-1.5">
          {renderedLine}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        id="toggle-copilot-btn"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full shadow-2xl border border-blue-400/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center space-x-2 no-print group"
      >
        <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
        <span className="font-semibold text-xs tracking-wider uppercase pr-1">SEGAF Copilot</span>
      </button>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs no-print">
          {/* Main Panel */}
          <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-slate-200 transform animate-slide-in">
            {/* Header */}
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/30">
                  <Bot className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center">
                    SEGAF Copilot <Sparkles className="w-3.5 h-3.5 text-yellow-300 ml-1.5" />
                  </h3>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-emerald-400 font-medium flex items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-ping" />
                      Gemini 3.5 Flash Conectado
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold tracking-wide uppercase mt-0.5">
                      Cota Gratuita: {queriesLeft}/10 restantes hoje
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conversation Window */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
              {messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} items-start space-x-2.5`}
                >
                  {msg.sender === "bot" && (
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4.5 h-4.5" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-xs ${
                    msg.sender === "user" 
                      ? "bg-blue-600 text-white rounded-tr-none" 
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none"
                  }`}>
                    {renderMessageText(msg.text)}
                  </div>
                  {msg.sender === "user" && (
                    <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                      <UserIcon className="w-4.5 h-4.5" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex justify-start items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4.5 h-4.5" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 text-slate-400 text-xs flex items-center space-x-2 shadow-xs">
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    <span>Calculando indicadores no Firestore...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Prompt Suggestion Chips */}
            <div className="p-3 border-t border-slate-100 bg-white flex flex-wrap gap-2 justify-center">
              {[
                "Quanto gastamos com passagens?",
                "Quais passageiros viajam hoje?",
                "Sugira cortes de gastos em viagens",
              ].map((chip) => (
                <button
                  key={chip}
                  disabled={loading}
                  onClick={() => setInput(chip)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-600 rounded-full transition cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte sobre gastos, destinos, rotas..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition shadow-lg hover:shadow-blue-500/20 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
