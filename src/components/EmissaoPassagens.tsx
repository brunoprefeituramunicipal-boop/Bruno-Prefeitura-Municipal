import React, { useState, useEffect } from "react";
import { obterDataAtualBelem, formatarDataParaExibicao } from "../utils/dateUtils";
import { 
  Passagem, 
  Passageiro, 
  Empresa, 
  Embarcacao, 
  Acomodacao, 
  Motivo, 
  Autorizador,
  PassagemStatus
} from "../types";
import { savePassagem, deletePassagem, logAction } from "../services/dbService";
import { 
  Ship, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  DollarSign, 
  FileText,
  Percent,
  TrendingDown,
  UserCheck
} from "lucide-react";

interface EmissaoPassagensProps {
  passagens: Passagem[];
  passageiros: Passageiro[];
  empresas: Empresa[];
  embarcacoes: Embarcacao[];
  acomodacoes: Acomodacao[];
  motivos: Motivo[];
  autorizadores: Autorizador[];
  userPerfil: string;
  userLogin: string;
  onRefresh: () => void;
  // Trigger editing from outside (dashboard alerts)
  externalEditingTicket: Passagem | null;
  clearExternalEditingTicket: () => void;
}

export default function EmissaoPassagens({
  passagens,
  passageiros,
  empresas,
  embarcacoes,
  acomodacoes,
  motivos,
  autorizadores,
  userPerfil,
  userLogin,
  onRefresh,
  externalEditingTicket,
  clearExternalEditingTicket
}: EmissaoPassagensProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  
  // Modal toggle
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Passagem | null>(null);

  // Form states
  const [passageiroId, setPassageiroId] = useState("");
  const [empresaId, setEmpresaId] = useState("");
  const [embarcacaoId, setEmbarcacaoId] = useState("");
  const [acomodacaoId, setAcomodacaoId] = useState("");
  const [motivoId, setMotivoId] = useState("");
  const [autorizadorId, setAutorizadorId] = useState("");
  const [dataViagem, setDataViagem] = useState("");
  const [tipoViagem, setTipoViagem] = useState<"Ida" | "Volta" | "Ida e Volta">("Ida");
  const [destino, setDestino] = useState("Portel / Belém");
  const [valorOriginal, setValorOriginal] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [valorFinal, setValorFinal] = useState(0);
  const [status, setStatus] = useState<PassagemStatus>("Solicitada");
  const [observacoes, setObservacoes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-scroll when modal opens
  useEffect(() => {
    if (isModalOpen) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isModalOpen]);

  // Quick destinations presets
  const destinosPresets = [
    "Portel / Belém",
    "Belém / Portel",
    "Portel / Breves",
    "Breves / Portel",
    "Portel / Macapá",
    "Macapá / Portel",
    "Portel / Bagre",
    "Bagre / Portel"
  ];

  // Auto calculate valorFinal on original or discount changes
  useEffect(() => {
    const final = Math.max(valorOriginal - desconto, 0);
    setValorFinal(final);
  }, [valorOriginal, desconto]);

  // Handle external edit hooks from Dashboard
  useEffect(() => {
    if (externalEditingTicket) {
      openEditModal(externalEditingTicket);
      clearExternalEditingTicket();
    }
  }, [externalEditingTicket]);

  const getPassageiroName = (id: string) => passageiros.find(p => p.id === id)?.nome || "Não encontrado";
  const getEmpresaName = (id: string) => empresas.find(e => e.id === id)?.nomeFantasia || "Não cadastrada";
  const getEmbarcacaoName = (id: string) => embarcacoes.find(e => e.id === id)?.nome || "Não cadastrada";

  // Filter vessel list by the selected company only
  const filteredVessels = embarcacoes.filter(e => e.empresaId === empresaId && e.status === "Ativo");

  // Auto-select first boat of selected company
  useEffect(() => {
    if (filteredVessels.length > 0) {
      setEmbarcacaoId(filteredVessels[0].id);
    } else {
      setEmbarcacaoId("");
    }
  }, [empresaId]);

  const openAddModal = () => {
    if (passageiros.length === 0 || empresas.length === 0 || acomodacoes.length === 0 || motivos.length === 0 || autorizadores.length === 0) {
      alert("Antes de emitir uma passagem, certifique-se de ter cadastrado pelo menos: um passageiro, uma empresa, uma acomodação, um motivo e um autorizador.");
      return;
    }

    const defaultEmpresaId = empresas[0]?.id || "";
    const firstCompanyVessels = embarcacoes.filter(v => v.empresaId === defaultEmpresaId && v.status === "Ativo");

    setSelectedTicket(null);
    setPassageiroId(passageiros[0]?.id || "");
    setEmpresaId(defaultEmpresaId);
    setEmbarcacaoId(firstCompanyVessels[0]?.id || "");
    setAcomodacaoId(acomodacoes[0]?.id || "");
    setMotivoId(motivos[0]?.id || "");
    setAutorizadorId(autorizadores[0]?.id || "");
    setDataViagem(obterDataAtualBelem());
    setTipoViagem("Ida");
    setDestino("Portel / Belém");
    setValorOriginal(150);
    setDesconto(0);
    setValorFinal(150);
    setStatus("Solicitada");
    setObservacoes("");
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (t: Passagem) => {
    setSelectedTicket(t);
    setPassageiroId(t.passageiroId || "");
    setEmpresaId(t.empresaId || "");
    setEmbarcacaoId(t.embarcacaoId || "");
    setAcomodacaoId(t.acomodacaoId || "");
    setMotivoId(t.motivoId || "");
    setAutorizadorId(t.autorizadorId || "");
    setDataViagem(t.dataViagem || "");
    setTipoViagem(t.tipoViagem || "Ida");
    setDestino(t.destino || "Portel / Belém");
    setValorOriginal(t.valorOriginal || 0);
    setDesconto(t.desconto || 0);
    setValorFinal(t.valorFinal || 0);
    setStatus(t.status || "Solicitada");
    setObservacoes(t.observacoes || "");
    setError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passageiroId || !empresaId || !embarcacaoId || !acomodacaoId || !motivoId || !autorizadorId) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload: Passagem = {
        id: selectedTicket?.id || "",
        passageiroId,
        empresaId,
        embarcacaoId,
        acomodacaoId,
        motivoId,
        autorizadorId,
        dataViagem,
        tipoViagem,
        destino,
        valorOriginal,
        desconto,
        valorFinal,
        status,
        observacoes,
        createdAt: selectedTicket?.createdAt || new Date().toISOString()
      };

      await savePassagem(payload, userLogin);
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar requisição de passagem.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (t: Passagem) => {
    if (userPerfil !== "Administrador") {
      alert("Apenas administradores podem excluir requisições.");
      return;
    }

    if (window.confirm("Deseja realmente excluir esta concessão de passagem de forma irreversível?")) {
      try {
        await deletePassagem(t.id, userLogin);
        onRefresh();
      } catch (err: any) {
        alert("Erro ao excluir: " + err.message);
      }
    }
  };

  const filteredTickets = passagens.filter(p => {
    const pName = getPassageiroName(p.passageiroId).toLowerCase();
    const eName = getEmpresaName(p.empresaId).toLowerCase();
    const matchesSearch = pName.includes(searchTerm.toLowerCase()) || 
                          eName.includes(searchTerm.toLowerCase()) ||
                          p.destino.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "Todos" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Edit3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Emissão & Concessão</h2>
            <p className="text-xs text-slate-500">Solicitação, auditoria, precificação e deferimento de passagens fluviais</p>
          </div>
        </div>

        {userPerfil !== "Consulta" && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-md shadow-blue-600/10 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Passagem</span>
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
            placeholder="Buscar por passageiro, empresa ou rota..."
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
            <option value="Solicitada">Solicitada</option>
            <option value="Aprovada">Aprovada</option>
            <option value="Emitida">Emitida</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Grid rendering */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTickets.length === 0 ? (
          <div className="lg:col-span-3 py-12 bg-white text-center rounded-xl border border-slate-200 text-slate-400 text-sm">
            Nenhuma requisição de passagem registrada.
          </div>
        ) : (
          filteredTickets.map(t => {
            const passenger = passageiros.find(p => p.id === t.passageiroId);
            return (
              <div 
                key={t.id} 
                className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                        Ref: {t.id.substring(0, 8).toUpperCase()}
                      </span>
                      <h3 className="font-bold text-slate-800 text-sm mt-1 line-clamp-1">{getPassageiroName(t.passageiroId)}</h3>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      t.status === "Emitida" 
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                        : t.status === "Aprovada"
                        ? "bg-blue-50 text-blue-600 border-blue-200"
                        : t.status === "Solicitada"
                        ? "bg-amber-50 text-amber-600 border-amber-200"
                        : "bg-rose-50 text-rose-600 border-rose-200"
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-3.5 text-xs text-slate-600">
                    <div className="flex justify-between font-medium">
                      <span>Rota / Destino:</span>
                      <span className="text-blue-600 font-bold">{t.destino}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Viagem:</span>
                      <span className="font-semibold text-slate-700">{t.tipoViagem}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Linha / Empresa:</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[160px]">{getEmpresaName(t.empresaId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Embarcação:</span>
                      <span className="font-semibold text-slate-700 truncate max-w-[160px]">{getEmbarcacaoName(t.embarcacaoId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data de Saída:</span>
                      <span className="font-semibold text-slate-700">{formatarDataParaExibicao(t.dataViagem)}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-50 pt-2 font-bold text-slate-800">
                      <span>Preço Final:</span>
                      <span className="text-emerald-600 text-sm">R$ {t.valorFinal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {userPerfil !== "Consulta" && (
                  <div className="flex justify-end space-x-1.5 border-t border-slate-100 pt-3.5 mt-4">
                    <button
                      onClick={() => openEditModal(t)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-md border border-slate-200 hover:bg-slate-50 transition"
                      title="Alterar Status ou Editar"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    {userPerfil === "Administrador" && (
                      <button
                        onClick={() => handleDelete(t)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 rounded-md border border-slate-200 hover:bg-rose-50 transition"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Issuance Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold flex items-center space-x-2">
                <Ship className="w-5 h-5 text-blue-400" />
                <span>{selectedTicket ? "Auditar & Emitir Passagem" : "Nova Solicitação de Passagem"}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-lg">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden h-full">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Passenger Selector */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Passageiro Beneficiário *</label>
                    <select
                      value={passageiroId}
                      onChange={(e) => setPassageiroId(e.target.value)}
                      required
                      autoFocus
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                    >
                      {passageiros.map(p => (
                        <option key={p.id} value={p.id}>{p.nome} (CPF: {p.cpf})</option>
                      ))}
                    </select>
                  </div>

                  {/* Company Selector */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Linha / Empresa de Navegação *</label>
                    <select
                      value={empresaId}
                      onChange={(e) => setEmpresaId(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                    >
                      {empresas.map(e => (
                        <option key={e.id} value={e.id}>{e.nomeFantasia}</option>
                      ))}
                    </select>
                  </div>

                  {/* Vessel Selector (Filtered dynamically) */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Embarcação Credenciada *</label>
                    <select
                      value={embarcacaoId}
                      onChange={(e) => setEmbarcacaoId(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                    >
                      {filteredVessels.length === 0 ? (
                        <option value="">Nenhuma embarcação cadastrada para esta empresa</option>
                      ) : (
                        filteredVessels.map(v => (
                          <option key={v.id} value={v.id}>{v.nome} ({v.tipo})</option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Accommodation Selector */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Tipo de Acomodação *</label>
                    <select
                      value={acomodacaoId}
                      onChange={(e) => setAcomodacaoId(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                    >
                      {acomodacoes.map(a => (
                        <option key={a.id} value={a.id}>{a.nome}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Picker */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Data Programada da Viagem *</label>
                    <input
                      type="date"
                      value={dataViagem}
                      onChange={(e) => setDataViagem(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  {/* Trip type */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Modalidade da Viagem *</label>
                    <select
                      value={tipoViagem}
                      onChange={(e) => setTipoViagem(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                    >
                      <option value="Ida">Somente Ida</option>
                      <option value="Volta">Somente Volta</option>
                      <option value="Ida e Volta">Ida e Volta</option>
                    </select>
                  </div>

                  {/* Rota Destino presets or typed */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Rota de Viagem / Destino *</label>
                    <select
                      value={destino}
                      onChange={(e) => setDestino(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                    >
                      {destinosPresets.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Travel Motive Reason */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Motivo da Concessão *</label>
                    <select
                      value={motivoId}
                      onChange={(e) => setMotivoId(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                    >
                      {motivos.map(m => (
                        <option key={m.id} value={m.id}>{m.nome}</option>
                      ))}
                    </select>
                  </div>

                  {/* Authorizer Signee */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Autorizador / Deferente *</label>
                    <select
                      value={autorizadorId}
                      onChange={(e) => setAutorizadorId(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                    >
                      {autorizadores.map(a => (
                        <option key={a.id} value={a.id}>{a.nome} ({a.cargo})</option>
                      ))}
                    </select>
                  </div>

                  {/* Status selection */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Status da Passagem</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as PassagemStatus)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                    >
                      <option value="Solicitada">Solicitada (Rascunho)</option>
                      <option value="Aprovada">Aprovada (Defera)</option>
                      <option value="Emitida">Emitida (Liberada)</option>
                      {/* Operator CANNOT cancel unless Admin! Let's restrict cancel option in list */}
                      {userPerfil === "Administrador" && <option value="Cancelada">Cancelada</option>}
                    </select>
                  </div>

                  {/* Financial values card */}
                  <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3.5">
                    <h4 className="text-xs font-bold text-slate-700 flex items-center uppercase tracking-wider">
                      <DollarSign className="w-4 h-4 text-emerald-600 mr-1.5" /> Planilha de Custo e Tarifas
                    </h4>
                    
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-500 mb-1 font-semibold">Valor Bruto (R$)</label>
                        <input
                          type="number"
                          value={valorOriginal}
                          onChange={(e) => setValorOriginal(Math.max(parseFloat(e.target.value) || 0, 0))}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1 font-semibold">Desconto Concedido (R$)</label>
                        <input
                          type="number"
                          value={desconto}
                          onChange={(e) => setDesconto(Math.max(parseFloat(e.target.value) || 0, 0))}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold text-rose-600"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1 font-semibold">Valor Final Líquido (R$)</label>
                        <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 font-bold text-sm">
                          R$ {valorFinal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Observações / Justificativa Social</label>
                    <textarea
                      rows={2}
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                </div>
              </div>

              <div className="flex justify-end space-x-2 p-4 bg-slate-50 border-t border-slate-100 shrink-0">
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
                  {loading ? "Gravando..." : "Gravar Concessão"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
