import React, { useState } from "react";
import { 
  Passagem, 
  Passageiro, 
  Empresa, 
  Embarcacao, 
  Acomodacao, 
  Motivo, 
  Autorizador 
} from "../types";
import { 
  TrendingUp, 
  DollarSign, 
  Anchor, 
  Users, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Building, 
  ChevronRight, 
  MessageCircle, 
  Eye, 
  Edit3, 
  BellRing,
  Ship
} from "lucide-react";

interface DashboardProps {
  passagens: Passagem[];
  passageiros: Passageiro[];
  empresas: Empresa[];
  embarcacoes: Embarcacao[];
  acomodacoes: Acomodacao[];
  motivos: Motivo[];
  autorizadores: Autorizador[];
  onNavigateToTickets: () => void;
  onEditTicket: (ticket: Passagem) => void;
}

export default function Dashboard({ 
  passagens, 
  passageiros, 
  empresas, 
  embarcacoes, 
  acomodacoes, 
  motivos, 
  autorizadores,
  onNavigateToTickets,
  onEditTicket
}: DashboardProps) {
  const [selectedAlertTicket, setSelectedAlertTicket] = useState<Passagem | null>(null);

  // Math Helper for currencies
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const getPassageiroName = (id: string) => {
    return passageiros.find(p => p.id === id)?.nome || "Não identificado";
  };

  const getPassageiroPhone = (id: string) => {
    return passageiros.find(p => p.id === id)?.whatsapp || passageiros.find(p => p.id === id)?.telefone || "";
  };

  const getEmpresaName = (id: string) => {
    return empresas.find(e => e.id === id)?.nomeFantasia || "Não identificada";
  };

  const getEmbarcacaoName = (id: string) => {
    return embarcacoes.find(v => v.id === id)?.nome || "Não identificada";
  };

  // Date Parsing helper
  const hojeStr = new Date().toISOString().split("T")[0];
  
  const amanhaObj = new Date();
  amanhaObj.setDate(amanhaObj.getDate() + 1);
  const amanhaStr = amanhaObj.toISOString().split("T")[0];

  const atualMonth = new Date().getMonth(); // 0-11
  const atualYear = new Date().getFullYear();

  // Metrics calculation
  const totalPassagens = passagens.length;
  const passagensMes = passagens.filter(p => {
    const d = new Date(p.dataViagem);
    return d.getMonth() === atualMonth && d.getFullYear() === atualYear;
  }).length;

  const valorTotal = passagens.reduce((acc, p) => acc + p.valorFinal, 0);
  
  const viagensProgramadas = passagens.filter(p => 
    ["Solicitada", "Aprovada", "Emitida", "Confirmada"].includes(p.status) && 
    new Date(p.dataViagem).getTime() >= new Date(hojeStr).getTime()
  ).length;

  const viagensHoje = passagens.filter(p => p.dataViagem === hojeStr).length;
  const viagensAmanha = passagens.filter(p => p.dataViagem === amanhaStr).length;

  const totalEmpresas = empresas.length;
  const totalPassageiros = passageiros.length;

  // Countdown Helper with Colors
  const getAlertCountdown = (dataViagemStr: string) => {
    const hoje = new Date(hojeStr);
    const viagem = new Date(dataViagemStr);
    const diffTime = viagem.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return { days: 0, text: "Hoje", color: "rose", bg: "bg-rose-500/10 border-rose-500/30 text-rose-400" };
    } else if (diffDays === 1) {
      return { days: 1, text: "Amanhã (1 dia)", color: "orange", bg: "bg-orange-500/10 border-orange-500/30 text-orange-400" };
    } else if (diffDays <= 3) {
      return { days: diffDays, text: `Em ${diffDays} dias`, color: "amber", bg: "bg-amber-500/10 border-amber-500/30 text-amber-400" };
    } else if (diffDays <= 7) {
      return { days: diffDays, text: `Em ${diffDays} dias`, color: "yellow", bg: "bg-yellow-500/10 border-yellow-500/30 text-yellow-500" };
    } else if (diffDays <= 15) {
      return { days: diffDays, text: `Em ${diffDays} dias`, color: "teal", bg: "bg-teal-500/10 border-teal-500/30 text-teal-400" };
    } else if (diffDays <= 30) {
      return { days: diffDays, text: `Em ${diffDays} dias`, color: "emerald", bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" };
    } else {
      return { days: diffDays, text: `Mais de 30 dias`, color: "blue", bg: "bg-blue-500/10 border-blue-500/30 text-blue-400" };
    }
  };

  // Build the list of tickets with upcoming alert within 30 days
  const alertTickets = passagens
    .filter(p => ["Solicitada", "Aprovada", "Emitida", "Confirmada"].includes(p.status))
    .map(p => ({ ticket: p, countdown: getAlertCountdown(p.dataViagem) }))
    .filter(item => item.countdown.days >= 0 && item.countdown.days <= 30)
    .sort((a, b) => a.countdown.days - b.countdown.days);

  // WhatsApp reminder generator
  const sendWhatsAppReminder = (ticket: Passagem) => {
    const passenger = passageiros.find(p => p.id === ticket.passageiroId);
    if (!passenger) return;
    
    let rawPhone = passenger.whatsapp || passenger.telefone || "";
    // Clean non numeric
    rawPhone = rawPhone.replace(/\D/g, "");
    if (!rawPhone) {
      alert("Este passageiro não possui telefone cadastrado.");
      return;
    }

    // Standard Brazil code if missing
    if (rawPhone.length === 11 && !rawPhone.startsWith("55")) {
      rawPhone = "55" + rawPhone;
    } else if (rawPhone.length === 9) {
      rawPhone = "5591" + rawPhone; // Default area code of Portel is 91
    }

    const dataFormatted = new Date(ticket.dataViagem).toLocaleDateString("pt-BR");
    const embarcacaoName = getEmbarcacaoName(ticket.embarcacaoId);

    const messageText = `Olá, ${passenger.nome}.

Lembramos que sua viagem está programada para:

Data: ${dataFormatted}
Destino: ${ticket.destino}
Embarcação: ${embarcacaoName}

Em caso de dúvidas procure a SEGAF.

Prefeitura Municipal de Portel.`;

    const encoded = encodeURIComponent(messageText);
    const link = `https://wa.me/${rawPhone}?text=${encoded}`;
    window.open(link, "_blank");
  };

  // Analytical Chart Groupings (pure SVGs)
  // 1. Passagens / Gastos por mês (Last 6 Months)
  const getMonthlyChartsData = () => {
    const monthsName = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const now = new Date();
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      
      const filtered = passagens.filter(p => {
        const pd = new Date(p.dataViagem);
        return pd.getMonth() === m && pd.getFullYear() === y;
      });

      const count = filtered.length;
      const amount = filtered.reduce((sum, p) => sum + p.valorFinal, 0);

      result.push({
        label: `${monthsName[m]}/${String(y).substring(2)}`,
        count,
        amount
      });
    }
    return result;
  };

  const monthlyData = getMonthlyChartsData();

  // 2. Destinos mais utilizados (Top 4)
  const getTopDestinations = () => {
    const counts: { [key: string]: number } = {};
    passagens.forEach(p => {
      counts[p.destino] = (counts[p.destino] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, val]) => ({ name, value: val }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  };

  const topDestinations = getTopDestinations();

  // 3. Empresas mais utilizadas
  const getTopCompanies = () => {
    const counts: { [key: string]: number } = {};
    passagens.forEach(p => {
      counts[p.empresaId] = (counts[p.empresaId] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([id, val]) => ({ name: getEmpresaName(id), value: val }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 4);
  };

  const topCompanies = getTopCompanies();

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 md:p-8 relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 pointer-events-none">
          <Ship className="w-full h-full text-slate-400 rotate-12 scale-110 translate-x-12 translate-y-4" />
        </div>
        <div className="relative z-10 space-y-2">
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
            Painel Executivo
          </h1>
          <p className="text-slate-400 text-sm max-w-xl">
            Bem-vindo ao SEGAF. Abaixo estão consolidados os indicadores de passagens concedidas pela Prefeitura Municipal de Portel para fins administrativos e sociais.
          </p>
        </div>
      </div>

      {/* Counters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Passagens Emitidas</p>
            <p className="text-2xl font-bold text-slate-800">{totalPassagens}</p>
            <p className="text-xs text-slate-400">{passagensMes} este mês</p>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Valor das Passagens</p>
            <p className="text-2xl font-bold text-slate-800">{formatBRL(valorTotal)}</p>
            <p className="text-xs text-slate-400">Total investido</p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Viagens Agendadas</p>
            <p className="text-2xl font-bold text-slate-800">{viagensProgramadas}</p>
            <div className="flex space-x-2 text-xs text-slate-400 mt-1">
              <span>Hoje: <strong className="text-blue-600">{viagensHoje}</strong></span>
              <span>•</span>
              <span>Amanhã: <strong className="text-cyan-600">{viagensAmanha}</strong></span>
            </div>
          </div>
          <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition duration-200 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Parceiros & Clientes</p>
            <p className="text-2xl font-bold text-slate-800">{totalPassageiros}</p>
            <p className="text-xs text-slate-400">{totalEmpresas} empresas cadastradas</p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Charts & Countdown Warnings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SVG Charts Box (Left Side) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Chart 1: Passagens e Gastos por Mês */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">Emissão de Passagens & Investimento</h3>
                <p className="text-xs text-slate-500">Acompanhamento dos últimos 6 meses</p>
              </div>
              <div className="flex space-x-3 text-xs">
                <span className="flex items-center text-slate-500"><span className="w-3 h-3 rounded-xs bg-blue-500 mr-1.5" /> Qtd.</span>
                <span className="flex items-center text-slate-500"><span className="w-3 h-3 rounded-xs bg-emerald-400 mr-1.5" /> R$ Gasto</span>
              </div>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="h-64 w-full relative">
              <svg className="w-full h-full" viewBox="0 0 600 240">
                {/* Horizontal Gridlines */}
                {[0, 60, 120, 180].map((yVal) => (
                  <line 
                    key={yVal} 
                    x1="40" 
                    y1={yVal + 10} 
                    x2="580" 
                    y2={yVal + 10} 
                    stroke="#f1f5f9" 
                    strokeWidth="1.5"
                  />
                ))}

                {monthlyData.map((data, i) => {
                  const xBase = 60 + i * 90;
                  // Map values to fits SVG coordinate (height max 180)
                  const maxCount = Math.max(...monthlyData.map(d => d.count), 5);
                  const maxAmount = Math.max(...monthlyData.map(d => d.amount), 500);

                  const countHeight = (data.count / maxCount) * 160;
                  const amountHeight = (data.amount / maxAmount) * 160;

                  return (
                    <g key={data.label} className="group cursor-pointer">
                      {/* Count Bar (Blue) */}
                      <rect
                        x={xBase}
                        y={190 - countHeight}
                        width="18"
                        height={Math.max(countHeight, 4)}
                        fill="#3b82f6"
                        rx="4"
                        className="transition-all hover:fill-blue-600"
                      />
                      {/* Amount Bar (Green) */}
                      <rect
                        x={xBase + 24}
                        y={190 - amountHeight}
                        width="18"
                        height={Math.max(amountHeight, 4)}
                        fill="#34d399"
                        rx="4"
                        className="transition-all hover:fill-emerald-500"
                      />
                      {/* Label */}
                      <text
                        x={xBase + 21}
                        y="215"
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize="11"
                        className="font-medium"
                      >
                        {data.label}
                      </text>
                      {/* Hover Tooltip Value */}
                      <title>{`${data.label} -> Qtd: ${data.count} | Investimento: ${formatBRL(data.amount)}`}</title>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Side by side Distribution SVGs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Top Destinos Pie/Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-800 mb-4">Destinos mais Procurados</h3>
              {topDestinations.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-xs text-slate-400">Nenhum dado registrado</div>
              ) : (
                <div className="space-y-3">
                  {topDestinations.map((dest, i) => {
                    const totalVal = topDestinations.reduce((acc, d) => acc + d.value, 0);
                    const pct = Math.round((dest.value / totalVal) * 100);
                    const colors = ["bg-blue-500", "bg-cyan-500", "bg-indigo-500", "bg-teal-500"];
                    return (
                      <div key={dest.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{dest.name}</span>
                          <span>{dest.value} passagens ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${colors[i % colors.length]}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Top Empresas Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-800 mb-4">Empresas mais Utilizadas</h3>
              {topCompanies.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-xs text-slate-400">Nenhuma empresa utilizada</div>
              ) : (
                <div className="space-y-3">
                  {topCompanies.map((emp, i) => {
                    const totalVal = topCompanies.reduce((acc, c) => acc + c.value, 0);
                    const pct = Math.round((emp.value / totalVal) * 100);
                    const colors = ["bg-emerald-500", "bg-amber-500", "bg-purple-500", "bg-sky-500"];
                    return (
                      <div key={emp.name} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span className="truncate max-w-[160px] inline-block">{emp.name}</span>
                          <span>{emp.value} viagens ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${colors[i % colors.length]}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Dynamic Warning Countdown Sidebar (Right Side) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-amber-500" />
              <h3 className="text-base font-bold text-slate-800">Alertas de Viagens</h3>
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Filtro 30 dias</span>
          </div>

          {alertTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-300" />
              <p className="text-xs">Não há viagens agendadas para os próximos 30 dias.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {alertTickets.map(({ ticket, countdown }) => (
                <div 
                  key={ticket.id}
                  onClick={() => setSelectedAlertTicket(ticket)}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-150 transition cursor-pointer flex flex-col justify-between space-y-2.5 relative group"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition">
                        {getPassageiroName(ticket.passageiroId)}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {ticket.destino}
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${countdown.bg}`}>
                      {countdown.text}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100/80 pt-2">
                    <span>{new Date(ticket.dataViagem).toLocaleDateString("pt-BR")}</span>
                    <span className="flex items-center text-blue-500 hover:underline">
                      Ver Detalhes <ChevronRight className="w-3 h-3 ml-0.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Alertas Modal */}
      {selectedAlertTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all duration-300">
            {/* Header */}
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <BellRing className="w-5 h-5 text-yellow-400" />
                <h4 className="text-base font-bold">Detalhamento do Alerta de Viagem</h4>
              </div>
              <button 
                onClick={() => setSelectedAlertTicket(null)}
                className="text-slate-400 hover:text-white transition text-lg"
              >
                &times;
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Passageiro:</span>
                  <span className="text-xs font-bold text-slate-800">{getPassageiroName(selectedAlertTicket.passageiroId)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">CPF do Passageiro:</span>
                  <span className="text-xs font-mono font-medium text-slate-700">
                    {passageiros.find(p => p.id === selectedAlertTicket.passageiroId)?.cpf || "Não informado"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Contato:</span>
                  <span className="text-xs font-medium text-slate-700">{getPassageiroPhone(selectedAlertTicket.passageiroId) || "Nenhum cadastrado"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Destino / Rota:</span>
                  <span className="text-xs font-bold text-blue-600">{selectedAlertTicket.destino}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Data de Saída:</span>
                  <span className="text-xs font-bold text-slate-800">
                    {new Date(selectedAlertTicket.dataViagem).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Empresa / Embarcação:</span>
                  <span className="text-xs font-medium text-slate-700">
                    {getEmpresaName(selectedAlertTicket.empresaId)} - {getEmbarcacaoName(selectedAlertTicket.embarcacaoId)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Acomodação:</span>
                  <span className="text-xs font-medium text-slate-700">
                    {acomodacoes.find(a => a.id === selectedAlertTicket.acomodacaoId)?.nome || "Não informada"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Valor Final:</span>
                  <span className="text-xs font-bold text-emerald-600">{formatBRL(selectedAlertTicket.valorFinal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-slate-400">Status atual:</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                    {selectedAlertTicket.status}
                  </span>
                </div>
              </div>

              {selectedAlertTicket.observacoes && (
                <div className="text-xs text-slate-500 bg-amber-50/50 p-3 rounded-lg border border-amber-100/50">
                  <strong>Observações:</strong> {selectedAlertTicket.observacoes}
                </div>
              )}
            </div>

            {/* Footer with Action Buttons */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:justify-end gap-2.5">
              <button
                onClick={() => {
                  setSelectedAlertTicket(null);
                  onEditTicket(selectedAlertTicket);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center space-x-1.5 transition"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar Passagem</span>
              </button>

              <button
                onClick={() => sendWhatsAppReminder(selectedAlertTicket)}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/10 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Lembrete WhatsApp</span>
              </button>

              <button
                onClick={() => setSelectedAlertTicket(null)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold text-center transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
