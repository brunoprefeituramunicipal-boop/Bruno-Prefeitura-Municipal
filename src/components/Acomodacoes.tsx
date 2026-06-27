import React, { useState } from "react";
import { Acomodacao } from "../types";
import { saveAcomodacao, deleteAcomodacao } from "../services/dbService";
import { Bed, Plus, Edit2, Trash2, ShieldAlert } from "lucide-react";

interface AcomodacoesProps {
  acomodacoes: Acomodacao[];
  userPerfil: string;
  userLogin: string;
  onRefresh: () => void;
}

export default function Acomodacoes({ acomodacoes, userPerfil, userLogin, onRefresh }: AcomodacoesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAco, setEditingAco] = useState<Acomodacao | null>(null);

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
    setEditingAco(null);
    setNome("");
    setDescricao("");
    setStatus("Ativo");
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (aco: Acomodacao) => {
    setEditingAco(aco);
    setNome(aco.nome || "");
    setDescricao(aco.descricao || "");
    setStatus(aco.status || "Ativo");
    setError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome) {
      setError("O nome da acomodação é obrigatório.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload: Acomodacao = {
        id: editingAco?.id || "",
        nome,
        descricao,
        status
      };
      await saveAcomodacao(payload, userLogin);
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar acomodação.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (aco: Acomodacao) => {
    if (userPerfil !== "Administrador") {
      alert("Apenas administradores podem excluir registros.");
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o tipo de acomodação "${aco.nome}"?`)) {
      try {
        await deleteAcomodacao(aco.id, aco.nome, userLogin);
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
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Bed className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Tipos de Acomodação</h2>
            <p className="text-xs text-slate-500">Gerenciamento de modalidades de viagem (Rede, Camarote, Assento, Suíte)</p>
          </div>
        </div>

        {userPerfil === "Administrador" && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-md shadow-indigo-600/10 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Acomodação</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {acomodacoes.map((aco) => (
          <div key={aco.id} className="bg-white rounded-xl p-5 border border-slate-200/80 flex flex-col justify-between space-y-3 shadow-xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm">{aco.nome}</h3>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                  aco.status === "Ativo" 
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}>
                  {aco.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px]">{aco.descricao || "Sem descrição definida"}</p>
            </div>

            {userPerfil === "Administrador" && (
              <div className="flex justify-end space-x-1.5 pt-2 border-t border-slate-100">
                <button
                  onClick={() => openEditModal(aco)}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-md hover:bg-slate-50 border border-slate-200/60 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(aco)}
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
                <Bed className="w-5 h-5 text-indigo-400" />
                <span>{editingAco ? "Editar Acomodação" : "Nova Acomodação"}</span>
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
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Nome da Acomodação *</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    autoFocus
                    placeholder="Ex: Cama em Camarote"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Descrição</label>
                  <textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Descreva brevemente a acomodação..."
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "Ativo" | "Inativo")}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-indigo-500 transition"
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition"
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
