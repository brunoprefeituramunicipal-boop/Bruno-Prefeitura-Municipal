import React, { useState, useEffect } from "react";
import { Passagem, Passageiro, Empresa, AuditLog } from "../types";
import { getLogs } from "../services/dbService";
import { 
  BarChart4, 
  Search, 
  Printer, 
  Calendar, 
  Download, 
  TrendingUp, 
  DollarSign, 
  FileSpreadsheet, 
  Activity, 
  ShieldCheck, 
  User, 
  Ship,
  CheckCircle,
  QrCode,
  MapPin
} from "lucide-react";

interface RelatoriosProps {
  passagens: Passagem[];
  passageiros: Passageiro[];
  empresas: Empresa[];
  userPerfil: string;
  onRefresh: () => void;
}

export default function RelatoriosFinanceiro({
  passagens,
  passageiros,
  empresas,
  userPerfil,
  onRefresh
}: RelatoriosProps) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"financeiro" | "auditoria">("financeiro");

  // Filters State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [companyFilter, setCompanyFilter] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [passengerSearch, setPassengerSearch] = useState("");

  // Audit Logs State
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Printing voucher modal state
  const [printingTicket, setPrintingTicket] = useState<Passagem | null>(null);

  const getPassageiro = (id: string) => passageiros.find(p => p.id === id);
  const getEmpresa = (id: string) => empresas.find(e => e.id === id);

  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const allLogs = await getLogs();
      setLogs(allLogs);
    } catch (err) {
      console.error("Erro ao carregar auditoria:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "auditoria") {
      fetchAuditLogs();
    }
  }, [activeTab]);

  // Filter passagens for reports
  const filteredReportTickets = passagens.filter(p => {
    const passengerName = getPassageiro(p.passageiroId)?.nome.toLowerCase() || "";
    const matchesPassenger = passengerName.includes(passengerSearch.toLowerCase());

    const matchesCompany = companyFilter === "Todos" || p.empresaId === companyFilter;
    const matchesStatus = statusFilter === "Todos" || p.status === statusFilter;

    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(p.dataViagem) >= new Date(startDate);
    }
    if (endDate) {
      matchesDate = matchesDate && new Date(p.dataViagem) <= new Date(endDate);
    }

    return matchesPassenger && matchesCompany && matchesStatus && matchesDate;
  });

  // Calculate totals
  const totalValue = filteredReportTickets.reduce((sum, p) => sum + p.valorFinal, 0);
  const totalOriginal = filteredReportTickets.reduce((sum, p) => sum + p.valorOriginal, 0);
  const totalDescontos = filteredReportTickets.reduce((sum, p) => sum + p.desconto, 0);
  const totalQtd = filteredReportTickets.length;

  // Print voucher trigger
  const handlePrintVoucher = (ticket: Passagem) => {
    setPrintingTicket(ticket);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Export spreadsheet as CSV
  const exportRelatorioCSV = () => {
    const headers = "Ref,Passageiro,CPF,Empresa,Destino,Data Viagem,Valor Original,Desconto,Valor Pago,Status\n";
    const rows = filteredReportTickets.map(p => {
      const pass = getPassageiro(p.passageiroId);
      const emp = getEmpresa(p.empresaId);
      return `"${p.id.substring(0, 8).toUpperCase()}","${pass?.nome || "Desconhecido"}","${pass?.cpf || ""}","${emp?.nomeFantasia || ""}","${p.destino}","${p.dataViagem}",${p.valorOriginal},${p.desconto},${p.valorFinal},"${p.status}"`;
    }).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `relatorio_financeiro_segaf_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 no-print">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <BarChart4 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Relatórios & Auditoria</h2>
            <p className="text-xs text-slate-500">Acompanhamento financeiro, emissão de bilhetes oficiais e rastreabilidade de ações</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="bg-slate-100 p-1 rounded-xl flex space-x-1 self-start md:self-auto">
          <button
            onClick={() => setActiveTab("financeiro")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === "financeiro" 
                ? "bg-white text-slate-800 shadow-xs" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Prestação de Contas
          </button>
          
          {userPerfil === "Administrador" && (
            <button
              onClick={() => setActiveTab("auditoria")}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === "auditoria" 
                  ? "bg-white text-slate-800 shadow-xs" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Trilha de Logs</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === "financeiro" ? (
        <div className="space-y-6 no-print">
          {/* Filtering Panel */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Filtros de Consolidação</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Período Inicial</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Período Final</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Empresa de Navegação</label>
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                >
                  <option value="Todos">Todas as empresas</option>
                  {empresas.map(e => (
                    <option key={e.id} value={e.id}>{e.nomeFantasia}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Status do Bilhete</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                >
                  <option value="Todos">Todos os Status</option>
                  <option value="Solicitada">Solicitada</option>
                  <option value="Aprovada">Aprovada</option>
                  <option value="Emitida">Emitida</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-semibold">Nome do Passageiro</label>
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={passengerSearch}
                  onChange={(e) => setPassengerSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Report Financial Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Quantidade de Viagens</p>
                <p className="text-2xl font-bold text-slate-800">{totalQtd}</p>
              </div>
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                <Ship className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Investimento Bruto</p>
                <p className="text-2xl font-bold text-slate-800">R$ {totalOriginal.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Economia / Descontos</p>
                <p className="text-2xl font-bold text-rose-600">R$ {totalDescontos.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Investimento Líquido</p>
                <p className="text-2xl font-bold text-emerald-600">R$ {totalValue.toFixed(2)}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Matched Tickets List with Print Option */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Listagem Consolidada</h3>
              <button
                onClick={exportRelatorioCSV}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Planilha</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                    <th className="py-3 px-4">Ref</th>
                    <th className="py-3 px-4">Passageiro (CPF)</th>
                    <th className="py-3 px-4">Empresa / Embarcação</th>
                    <th className="py-3 px-4">Rota / Destino</th>
                    <th className="py-3 px-4">Data Saída</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Valor Final</th>
                    <th className="py-3 px-4 text-center">Bilhete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReportTickets.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">Nenhum registro encontrado no período.</td>
                    </tr>
                  ) : (
                    filteredReportTickets.map(p => {
                      const pass = getPassageiro(p.passageiroId);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono font-semibold text-slate-400">{p.id.substring(0, 8).toUpperCase()}</td>
                          <td className="py-3 px-4">
                            <span className="block font-bold text-slate-800">{pass?.nome || "Não encontrado"}</span>
                            <span className="text-[10px] text-slate-400 font-mono">CPF: {pass?.cpf}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="block font-medium">{getEmpresa(p.empresaId)?.nomeFantasia}</span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-blue-600">{p.destino}</td>
                          <td className="py-3 px-4">{new Date(p.dataViagem).toLocaleDateString("pt-BR")}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              p.status === "Emitida" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-amber-50 text-amber-600 border-amber-200"
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-800">R$ {p.valorFinal.toFixed(2)}</td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => handlePrintVoucher(p)}
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:text-blue-600 transition"
                              title="Imprimir Bilhete Oficial"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Audit logs list tab */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden no-print">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center">
              <ShieldCheck className="w-5 h-5 text-emerald-500 mr-1.5" /> Histórico de Alterações (Auditoria)
            </h3>
            <button
              onClick={fetchAuditLogs}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-600 rounded-md transition"
            >
              Atualizar Logs
            </button>
          </div>

          <div className="p-4 max-h-[500px] overflow-y-auto space-y-3.5">
            {logsLoading ? (
              <p className="text-center py-12 text-slate-400 text-xs">Acessando trilha segura de auditoria...</p>
            ) : logs.length === 0 ? (
              <p className="text-center py-12 text-slate-400 text-xs">Nenhum log registrado ainda.</p>
            ) : (
              logs.map(log => (
                <div key={log.id} className="p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-150 rounded-xl flex items-start space-x-3 text-xs transition">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">{log.usuario}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString("pt-BR") : ""}
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium">{log.acao}</p>
                    {log.detalhes && <span className="block text-[10px] text-slate-400">Detalhes: {log.detalhes}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TICKET VOUCHER PRINT TEMPLATE - VISIBLE ONLY DURING PRINTING */}
      {printingTicket && (
        <div className="print-only fixed inset-0 z-100 bg-white p-8 flex flex-col justify-between" id="print-area">
          {/* Municipal Header layout */}
          <div className="border-b-4 border-double border-slate-900 pb-5 text-center space-y-2">
            <h1 className="text-xl font-bold tracking-wider uppercase text-slate-900">Prefeitura Municipal de Portel</h1>
            <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-600">SEGAF - Secretaria de Gestão Administrativa e Financeira</h2>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-4 py-1 rounded inline-block border border-slate-200">
              Autorização de Concessão de Passagem Fluvial Oficial
            </div>
          </div>

          {/* Ticket Body Content */}
          <div className="grid grid-cols-12 gap-6 py-6 border-b-2 border-dashed border-slate-300">
            {/* Left Col details */}
            <div className="col-span-8 space-y-4">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold text-slate-400">Nome do Beneficiário</span>
                <p className="text-base font-bold text-slate-900">{getPassageiro(printingTicket.passageiroId)?.nome}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Documento CPF</span>
                  <p className="font-mono font-semibold text-slate-800">{getPassageiro(printingTicket.passageiroId)?.cpf}</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Documento RG</span>
                  <p className="font-mono font-semibold text-slate-800">{getPassageiro(printingTicket.passageiroId)?.rg || "Não cadastrado"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Linha de Navegação</span>
                  <p className="font-bold text-slate-800">{getEmpresa(printingTicket.empresaId)?.nomeFantasia}</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Rota / Destino</span>
                  <p className="font-bold text-slate-900 text-sm">{printingTicket.destino}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Data de Saída</span>
                  <p className="font-semibold text-slate-800">{new Date(printingTicket.dataViagem).toLocaleDateString("pt-BR")}</p>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400">Modalidade</span>
                  <p className="font-semibold text-slate-800">{printingTicket.tipoViagem}</p>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-[9px] uppercase font-bold text-slate-400">Observações Legais</span>
                <p className="text-[10px] text-slate-500 italic">
                  Este bilhete é de uso pessoal e intransferível concedido sob amparo da Prefeitura de Portel. {printingTicket.observacoes || ""}
                </p>
              </div>
            </div>

            {/* Right Col layout (Image, Stamp, QR representation) */}
            <div className="col-span-4 border-l border-slate-200 pl-6 flex flex-col justify-between items-center space-y-6">
              <div className="w-24 h-24 border-2 border-slate-300 bg-slate-50 overflow-hidden rounded flex items-center justify-center relative">
                {getPassageiro(printingTicket.passageiroId)?.fotoUrl ? (
                  <img 
                    src={getPassageiro(printingTicket.passageiroId)?.fotoUrl} 
                    alt="Beneficiário" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-[9px] font-bold text-slate-400 uppercase text-center p-2">Foto de Identificação</span>
                )}
              </div>

              <div className="flex flex-col items-center text-center">
                <QrCode className="w-16 h-16 text-slate-900" />
                <span className="text-[8px] font-mono font-bold text-slate-500 mt-1 uppercase tracking-widest">Controle SEGAF</span>
              </div>
            </div>
          </div>

          {/* Signatures & Barcode footer */}
          <div className="space-y-6 pt-6 flex flex-col items-center">
            {/* Signature Block */}
            <div className="flex flex-col items-center space-y-1 text-center">
              <div className="h-16 flex items-center justify-center">
                {/* Find signee autorizador and render signature */}
                {(() => {
                  const aut = [...new Set(passagens.map(p => p.autorizadorId))].map(id => ({ id, signature: "" })); // Placeholder
                  // Match real signee
                  const matchedAut = passagens.find(p => p.id === printingTicket.id)?.autorizadorId;
                  const realAut = matchedAut ? [...new Set(passagens.map(p => p.autorizadorId))] : null;
                  
                  // Simple fallback or drawn signature base64
                  return (
                    <span className="font-mono text-sm italic text-blue-900 border-b border-slate-400 px-10">
                      Assinado Digitalmente por SEGAF Portel
                    </span>
                  );
                })()}
              </div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Órgão Deferente Autorizado</span>
            </div>

            {/* Simulated Barcode */}
            <div className="w-full h-12 flex items-center justify-center space-x-0.5">
              {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 3, 1, 2].map((w, idx) => (
                <div 
                  key={idx} 
                  className="h-full bg-black" 
                  style={{ width: `${w}px` }}
                />
              ))}
            </div>
            
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest text-center">
              SEGAF-PORTEL-CODE- {printingTicket.id.toUpperCase()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
