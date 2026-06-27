import React, { useState } from "react";
import { Embarcacao, Empresa, EmbarcacaoTipo } from "../types";
import { saveEmbarcacao, deleteEmbarcacao } from "../services/dbService";
import { Ship, Plus, Search, Edit2, Trash2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface EmbarcacoesProps {
  embarcacoes: Embarcacao[];
  empresas: Empresa[];
  userPerfil: string;
  userLogin: string;
  onRefresh: () => void;
}

export default function Embarcacoes({ embarcacoes, empresas, userPerfil, userLogin, onRefresh }: EmbarcacoesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("Todos");

  // Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmb, setEditingEmb] = useState<Embarcacao | null>(null);

  // Form fields
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<EmbarcacaoTipo>("Navio");
  const [empresaId, setEmpresaId] = useState("");
  const [capacidade, setCapacidade] = useState(100);
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

  const getEmpresaName = (id: string) => {
    return empresas.find(e => e.id === id)?.nomeFantasia || "Empresa não cadastrada";
  };

  const openAddModal = () => {
    setEditingEmb(null);
    setNome("");
    setTipo("Navio");
    setEmpresaId(empresas[0]?.id || "");
    setCapacidade(100);
    setStatus("Ativo");
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (emb: Embarcacao) => {
    setEditingEmb(emb);
    setNome(emb.nome || "");
    setTipo(emb.tipo || "Navio");
    setEmpresaId(emb.empresaId || "");
    setCapacidade(emb.capacidade || 100);
    setStatus(emb.status || "Ativo");
    setError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !empresaId) {
      setError("Todos os campos obrigatórios devem ser preenchidos.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload: Embarcacao = {
        id: editingEmb?.id || "",
        nome,
        tipo,
        empresaId,
        capacidade,
        status
      };

      await saveEmbarcacao(payload, userLogin);
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar embarcação.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (emb: Embarcacao) => {
    if (userPerfil !== "Administrador") {
      alert("Apenas administradores podem excluir registros.");
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir a embarcação "${emb.nome}"?`)) {
      try {
        await deleteEmbarcacao(emb.id, emb.nome, userLogin);
        onRefresh();
      } catch (err: any) {
        alert("Erro ao excluir: " + err.message);
      }
    }
  };

  // Filter lists
  const filtered = embarcacoes.filter(e => {
    const matchesSearch = e.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          getEmpresaName(e.empresaId).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "Todos" || e.tipo === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center">
            <Ship className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Embarcações</h2>
            <p className="text-xs text-slate-500">Cadastro de frotas fluviais e capacidade das embarcações</p>
          </div>
        </div>

        {userPerfil === "Administrador" && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-md shadow-cyan-600/10 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Embarcação</span>
          </button>
        )}
      </div>

      {/* Filters block */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nome da embarcação ou empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-cyan-500 text-sm transition"
          />
        </div>

        <div className="w-full md:w-48">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-cyan-500 text-sm transition"
          >
            <option value="Todos">Tipo: Todos</option>
            <option value="Navio">Navio</option>
            <option value="Balsa">Balsa</option>
            <option value="Lancha">Lancha</option>
            <option value="Ferry Boat">Ferry Boat</option>
          </select>
        </div>
      </div>

      {/* Grid rendering */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="lg:col-span-3 py-12 bg-white text-center rounded-xl border border-slate-200 text-slate-400 text-sm">
            Nenhuma embarcação cadastrada com os termos pesquisados.
          </div>
        ) : (
          filtered.map(emb => (
            <div 
              key={emb.id} 
              className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-800 text-sm">{emb.nome}</h3>
                    <span className="px-2 py-0.5 bg-cyan-50 text-cyan-600 border border-cyan-100 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      {emb.tipo}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 border ${
                    emb.status === "Ativo" 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}>
                    {emb.status === "Ativo" ? "Ativo" : "Inativo"}
                  </span>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Proprietário:</span>
                    <span className="font-semibold text-slate-700 truncate max-w-[160px]">{getEmpresaName(emb.empresaId)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Capacidade Máxima:</span>
                    <span className="font-bold text-slate-700">{emb.capacidade || "Não informada"} passageiros</span>
                  </div>
                </div>
              </div>

              {/* Operations row */}
              {userPerfil === "Administrador" && (
                <div className="flex justify-end space-x-1.5 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => openEditModal(emb)}
                    className="p-1.5 text-slate-500 hover:text-cyan-600 rounded-md hover:bg-slate-50 border border-slate-200/60 transition"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(emb)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 rounded-md hover:bg-rose-50 border border-slate-200/60 transition"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

       {/* Form Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all my-auto">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <h3 className="text-sm font-bold flex items-center space-x-2">
                <Ship className="w-5 h-5 text-cyan-400" />
                <span>{editingEmb ? "Editar Embarcação" : "Cadastrar Nova Embarcação"}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Nome da Embarcação *</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    autoFocus
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Tipo de Embarcação *</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as EmbarcacaoTipo)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-cyan-500 transition"
                  >
                    <option value="Navio">Navio</option>
                    <option value="Balsa">Balsa</option>
                    <option value="Lancha">Lancha</option>
                    <option value="Ferry Boat">Ferry Boat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Empresa Proprietária *</label>
                  <select
                    value={empresaId}
                    onChange={(e) => setEmpresaId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-cyan-500 transition"
                  >
                    {empresas.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.nomeFantasia}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Capacidade Máxima de Passageiros</label>
                  <input
                    type="number"
                    value={capacidade}
                    onChange={(e) => setCapacidade(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "Ativo" | "Inativo")}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-cyan-500 transition"
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
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-600/10 transition"
                >
                  {loading ? "Salvando..." : "Salvar Embarcação"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
