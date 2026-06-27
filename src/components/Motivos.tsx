import React, { useState } from "react";
import { Motivo } from "../types";
import { saveMotivo, deleteMotivo } from "../services/dbService";
import { ClipboardList, Plus, Edit2, Trash2, ShieldAlert } from "lucide-react";

interface MotivosProps {
  motivos: Motivo[];
  userPerfil: string;
  userLogin: string;
  onRefresh: () => void;
}

export default function Motivos({ motivos, userPerfil, userLogin, onRefresh }: MotivosProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMot, setEditingMot] = useState<Motivo | null>(null);

  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState<"Ativo" | "Inativo">("Ativo");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-scroll when modal opens
  React.useEffect(() => {
    if (isModalOpen) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isModalOpen]);

  const openAddModal = () => {
    setEditingMot(null);
    setNome("");
    setDescricao("");
    setStatus("Ativo");
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (mot: Motivo) => {
    setEditingMot(mot);
    setNome(mot.nome || "");
    setDescricao(mot.descricao || "");
    setStatus(mot.status || "Ativo");
    setError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) {
      setError("O nome do motivo de viagem é obrigatório.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload: Motivo = {
        id: editingMot?.id || "",
        nome,
        descricao,
        status
      };
      await saveMotivo(payload, userLogin);
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar motivo.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (mot: Motivo) => {
    if (userPerfil !== "Administrador") {
      alert("Apenas administradores podem excluir registros.");
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o motivo "${mot.nome}"?`)) {
      try {
        await deleteMotivo(mot.id, mot.nome, userLogin);
        onRefresh();
      } catch (err: any) {
        alert("Erro ao excluir: " + err.message);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Motivos de Viagem</h2>
            <p className="text-xs text-slate-500">Cadastro de finalidades oficiais ou sociais que amparam a concessão de passagens</p>
          </div>
        </div>

        {userPerfil === "Administrador" && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-md shadow-amber-600/10 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Motivo</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {motivos.map((mot) => (
          <div key={mot.id} className="bg-white rounded-xl p-5 border border-slate-200/80 flex flex-col justify-between space-y-3 shadow-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm truncate max-w-[180px]">{mot.nome}</h3>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                  mot.status === "Ativo" 
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}>
                  {mot.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">{mot.descricao || "Sem descrição"}</p>
            </div>

            {userPerfil === "Administrador" && (
              <div className="flex justify-end space-x-1.5 pt-2 border-t border-slate-100">
                <button
                  onClick={() => openEditModal(mot)}
                  className="p-1.5 text-slate-500 hover:text-amber-600 rounded-md hover:bg-slate-50 border border-slate-200/60 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(mot)}
                  className="p-1.5 text-slate-500 hover:text-rose-600 rounded-md hover:bg-rose-50 border border-slate-200/60 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all my-auto">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <h3 className="text-sm font-bold flex items-center space-x-2">
                <ClipboardList className="w-5 h-5 text-amber-400" />
                <span>{editingMot ? "Editar Motivo" : "Novo Motivo de Viagem"}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-lg">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Nome do Motivo *</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    autoFocus
                    placeholder="Ex: Tratamento de Saúde (TFD)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Descrição / Justificativa</label>
                  <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Opcional. Adicione amparo legal ou regras..."
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "Ativo" | "Inativo")}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-amber-500 transition"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition"
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
