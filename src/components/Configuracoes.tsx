import React, { useState } from "react";
import { User } from "../types";
import { clearAllSystemData, logAction } from "../services/dbService";
import { 
  Settings, 
  Trash2, 
  AlertTriangle, 
  ShieldAlert, 
  Loader2, 
  CheckCircle 
} from "lucide-react";

interface ConfiguracoesProps {
  currentUser: User;
  onDataCleared: () => void;
}

export default function Configuracoes({ currentUser, onDataCleared }: ConfiguracoesProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmStage, setConfirmStage] = useState<1 | 2>(1);
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [isClearing, setIsClearing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const isAdmin = currentUser.perfil === "Administrador";

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs max-w-2xl mx-auto mt-8 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Acesso Restrito</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Você não possui permissões suficientes para acessar a área de Configurações do Sistema. 
          Apenas usuários com perfil de <strong>Administrador</strong> podem realizar operações nesta tela.
        </p>
      </div>
    );
  }

  const handleOpenConfirm = () => {
    setConfirmStage(1);
    setTypedConfirmation("");
    setErrorMsg("");
    setSuccess(false);
    setShowConfirmModal(true);
  };

  const handleNextStage = () => {
    setConfirmStage(2);
  };

  const handleClearData = async () => {
    if (typedConfirmation.trim().toUpperCase() !== "LIMPAR") {
      setErrorMsg("Palavra de confirmação incorreta. Digite 'LIMPAR' para autorizar.");
      return;
    }

    setIsClearing(true);
    setErrorMsg("");

    try {
      await clearAllSystemData();
      await logAction(currentUser.nome, "Limpeza total de lançamentos do sistema executada");
      
      setSuccess(true);
      setShowConfirmModal(false);
      onDataCleared();
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Ocorreu um erro ao limpar os dados do sistema.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 md:p-8 relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 pointer-events-none">
          <Settings className="w-full h-full text-slate-400 rotate-12 scale-110 translate-x-12 translate-y-4" />
        </div>
        <div className="relative z-10 space-y-2">
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-500 shrink-0" />
            Configurações do Sistema
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Gerencie as preferências globais do SEGAF e execute tarefas de manutenção administrativa.
          </p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start gap-3 shadow-sm animate-fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Sucesso!</h4>
            <p className="text-xs text-emerald-700">Todos os lançamentos e dados operacionais do sistema foram apagados permanentemente. Os usuários e credenciais administrativos foram mantidos.</p>
          </div>
        </div>
      )}

      {/* Gerenciamento do Sistema Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Gerenciamento do Sistema</h3>
            <p className="text-xs text-slate-500">Operações críticas e de manutenção administrativa do banco de dados.</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-4 bg-rose-50/40 border border-rose-100 rounded-xl">
            <div className="space-y-1.5 flex-1">
              <h4 className="text-sm font-bold text-rose-800 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                Limpar todos os lançamentos
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                Esta operação irá apagar de forma <strong>definitiva</strong> todas as passagens registradas, passageiros cadastrados, 
                empresas de navegação, embarcações, acomodações, motivos legais de concessão, autorizadores, logs de ação e relatórios. 
                Os usuários autorizados do sistema serão preservados para permitir o acesso contínuo.
              </p>
            </div>
            <button
              onClick={handleOpenConfirm}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm shadow-rose-600/10 hover:shadow-md transition cursor-pointer self-start md:self-center shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              <span>Limpar Todos os Lançamentos</span>
            </button>
          </div>
        </div>
      </div>

      {/* DOUBLE CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all duration-300">
            {/* Header */}
            <div className="bg-rose-950 p-5 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
                <h4 className="text-base font-bold">Confirmação de Segurança</h4>
              </div>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-white transition text-lg"
                disabled={isClearing}
              >
                &times;
              </button>
            </div>

            {/* Stage 1: Initial Warning */}
            {confirmStage === 1 && (
              <div className="p-6 space-y-4">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800">Você tem certeza absoluta?</h3>
                </div>
                
                <p className="text-xs text-slate-600 leading-relaxed text-center">
                  Esta ação é <strong>irreversível</strong>. Todos os dados operacionais (passagens, passageiros, faturamento, embarcações, rotas, etc.) 
                  serão completamente destruídos das bases do Firestore do SEGAF.
                </p>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleNextStage}
                    className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <span>Prosseguir</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              </div>
            )}

            {/* Stage 2: Typing word "LIMPAR" to double confirm */}
            {confirmStage === 2 && (
              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Confirmação Dupla Obrigatória:
                  </label>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Para confirmar que você compreende os riscos de apagar todo o banco de dados do sistema, 
                    digite a palavra <strong className="text-rose-600 select-all">LIMPAR</strong> no campo abaixo:
                  </p>
                </div>

                <input
                  type="text"
                  value={typedConfirmation}
                  onChange={(e) => setTypedConfirmation(e.target.value)}
                  placeholder="Digite LIMPAR para confirmar"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 text-center font-bold tracking-widest uppercase"
                  disabled={isClearing}
                />

                {errorMsg && (
                  <p className="text-[11px] font-semibold text-rose-600 text-center bg-rose-50 p-2 rounded-lg border border-rose-100">
                    {errorMsg}
                  </p>
                )}

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                    disabled={isClearing}
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleClearData}
                    disabled={isClearing || typedConfirmation.trim().toUpperCase() !== "LIMPAR"}
                    className="flex-1 px-4 py-2 bg-rose-700 hover:bg-rose-600 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-rose-700/10"
                  >
                    {isClearing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Limpando...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Confirmar Exclusão</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
