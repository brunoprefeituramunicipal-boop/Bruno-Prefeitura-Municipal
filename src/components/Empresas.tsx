import React, { useState } from "react";
import { Empresa } from "../types";
import { saveEmpresa, deleteEmpresa } from "../services/dbService";
import { 
  Building2, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  AlertCircle 
} from "lucide-react";

interface EmpresasProps {
  empresas: Empresa[];
  userPerfil: string;
  userLogin: string;
  onRefresh: () => void;
}

export default function Empresas({ empresas, userPerfil, userLogin, onRefresh }: EmpresasProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  
  // Form modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  
  // Fields state
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [inscricaoEstadual, setInscricaoEstadual] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [status, setStatus] = useState<"Ativo" | "Inativo">("Ativo");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openAddModal = () => {
    setEditingEmpresa(null);
    setRazaoSocial("");
    setNomeFantasia("");
    setCnpj("");
    setInscricaoEstadual("");
    setTelefone("");
    setWhatsapp("");
    setEmail("");
    setEndereco("");
    setResponsavel("");
    setObservacoes("");
    setStatus("Ativo");
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Empresa) => {
    setEditingEmpresa(emp);
    setRazaoSocial(emp.razaoSocial || "");
    setNomeFantasia(emp.nomeFantasia || "");
    setCnpj(emp.cnpj || "");
    setInscricaoEstadual(emp.inscricaoEstadual || "");
    setTelefone(emp.telefone || "");
    setWhatsapp(emp.whatsapp || "");
    setEmail(emp.email || "");
    setEndereco(emp.endereco || "");
    setResponsavel(emp.responsavel || "");
    setObservacoes(emp.observacoes || "");
    setStatus(emp.status || "Ativo");
    setError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!razaoSocial || !nomeFantasia || !cnpj) {
      setError("Os campos Razão Social, Nome Fantasia e CNPJ são obrigatórios.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload: Empresa = {
        id: editingEmpresa?.id || "",
        razaoSocial,
        nomeFantasia,
        cnpj,
        inscricaoEstadual,
        telefone,
        whatsapp,
        email,
        endereco,
        responsavel,
        observacoes,
        status
      };

      await saveEmpresa(payload, userLogin);
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar empresa.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (emp: Empresa) => {
    if (userPerfil !== "Administrador") {
      alert("Apenas administradores podem excluir registros.");
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir a empresa "${emp.nomeFantasia}"?`)) {
      try {
        await deleteEmpresa(emp.id, emp.nomeFantasia, userLogin);
        onRefresh();
      } catch (err: any) {
        alert("Erro ao excluir: " + err.message);
      }
    }
  };

  // Export to CSV helper
  const exportToCSV = () => {
    const headers = "ID,Razao Social,Nome Fantasia,CNPJ,Inscricao Estadual,Telefone,WhatsApp,Email,Endereco,Responsavel,Status\n";
    const rows = filteredEmpresas.map(e => 
      `"${e.id}","${e.razaoSocial.replace(/"/g, '""')}","${e.nomeFantasia.replace(/"/g, '""')}","${e.cnpj}","${e.inscricaoEstadual || ""}","${e.telefone || ""}","${e.whatsapp || ""}","${e.email || ""}","${e.endereco?.replace(/"/g, '""') || ""}","${e.responsavel || ""}","${e.status}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `empresas_segaf_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter items
  const filteredEmpresas = empresas.filter(e => {
    const matchesSearch = 
      e.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.cnpj.includes(searchTerm);

    const matchesStatus = 
      statusFilter === "Todos" || e.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Empresas de Navegação</h2>
            <p className="text-xs text-slate-500">Controle de frotas e companhias habilitadas</p>
          </div>
        </div>
        
        <div className="flex space-x-2.5">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
          
          {userPerfil === "Administrador" && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-md shadow-blue-600/10 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Empresa</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar por Razão Social, Nome Fantasia ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 text-sm transition"
          />
        </div>
        
        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 text-sm transition"
          >
            <option value="Todos">Status: Todos</option>
            <option value="Ativo">Somente Ativos</option>
            <option value="Inativo">Somente Inativos</option>
          </select>
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredEmpresas.length === 0 ? (
          <div className="md:col-span-2 py-12 bg-white text-center rounded-xl border border-slate-200 text-slate-400 text-sm">
            Nenhuma empresa encontrada com os parâmetros informados.
          </div>
        ) : (
          filteredEmpresas.map(emp => (
            <div 
              key={emp.id} 
              className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-slate-800 text-base">{emp.nomeFantasia}</h3>
                    <p className="text-xs text-slate-400 truncate max-w-[280px]">{emp.razaoSocial}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 border ${
                    emp.status === "Ativo" 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  }`}>
                    {emp.status === "Ativo" ? <CheckCircle className="w-3 h-3 mr-0.5" /> : <XCircle className="w-3 h-3 mr-0.5" />}
                    {emp.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-y-2.5 gap-x-1 text-xs border-t border-slate-100 pt-3">
                  <div className="text-slate-500">
                    <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">CNPJ</span>
                    <span className="font-medium text-slate-700">{emp.cnpj}</span>
                  </div>
                  <div className="text-slate-500">
                    <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Inscrição Est.</span>
                    <span className="font-medium text-slate-700">{emp.inscricaoEstadual || "Isento"}</span>
                  </div>
                  <div className="text-slate-500 flex items-center space-x-1.5 col-span-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700">{emp.telefone || emp.whatsapp || "Sem telefone"}</span>
                  </div>
                  <div className="text-slate-500 flex items-center space-x-1.5 col-span-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700 truncate">{emp.email || "Sem email"}</span>
                  </div>
                  <div className="text-slate-500 flex items-center space-x-1.5 col-span-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700 truncate">{emp.endereco || "Não informado"}</span>
                  </div>
                  <div className="text-slate-500 flex items-center space-x-1.5 col-span-2">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-700">Resp: {emp.responsavel || "Não informado"}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {userPerfil === "Administrador" && (
                <div className="flex justify-end space-x-2 border-t border-slate-100 pt-3.5 mt-4">
                  <button
                    onClick={() => openEditModal(emp)}
                    className="p-2 hover:bg-slate-50 text-slate-600 hover:text-blue-600 rounded-lg transition border border-slate-200"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(emp)}
                    className="p-2 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg transition border border-slate-200"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Register/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all my-8">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <h3 className="text-base font-bold flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <span>{editingEmpresa ? "Editar Empresa de Navegação" : "Cadastrar Nova Empresa"}</span>
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition text-xl"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Razão Social *</label>
                  <input
                    type="text"
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Nome Fantasia *</label>
                  <input
                    type="text"
                    value={nomeFantasia}
                    onChange={(e) => setNomeFantasia(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">CNPJ *</label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Inscrição Estadual</label>
                  <input
                    type="text"
                    value={inscricaoEstadual}
                    onChange={(e) => setInscricaoEstadual(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Telefone</label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">WhatsApp</label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Responsável</label>
                  <input
                    type="text"
                    value={responsavel}
                    onChange={(e) => setResponsavel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Endereço Completo</label>
                  <input
                    type="text"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Observações</label>
                  <textarea
                    rows={2}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "Ativo" | "Inativo")}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/10 transition"
                >
                  {loading ? "Salvando..." : "Salvar Empresa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
