import React, { useState, useRef } from "react";
import { formatarDataParaExibicao } from "../utils/dateUtils";
import { Passageiro, Passagem } from "../types";
import { savePassageiro, deletePassageiro } from "../services/dbService";
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Camera, 
  Upload, 
  ShieldAlert, 
  Phone, 
  MapPin, 
  Calendar, 
  FileText, 
  UserCheck, 
  Sparkles, 
  History,
  FileSpreadsheet
} from "lucide-react";

interface PassageirosProps {
  passageiros: Passageiro[];
  passagens: Passagem[];
  userPerfil: string;
  userLogin: string;
  onRefresh: () => void;
}

export default function Passageiros({ passageiros, passagens, userPerfil, userLogin, onRefresh }: PassageirosProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal controllers
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedPassageiro, setSelectedPassageiro] = useState<Passageiro | null>(null);

  // Form Fields
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [endereco, setEndereco] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [anexoDocumento, setAnexoDocumento] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-scroll and prevent background scroll when modal opens
  React.useEffect(() => {
    if (isModalOpen) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isModalOpen]);

  // Webcam Capture states
  const [useWebcam, setUseWebcam] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const openAddModal = () => {
    setSelectedPassageiro(null);
    setNome("");
    setCpf("");
    setRg("");
    setDataNascimento("");
    setTelefone("");
    setWhatsapp("");
    setEndereco("");
    setFotoUrl("");
    setAnexoDocumento("");
    setObservacoes("");
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (p: Passageiro) => {
    setSelectedPassageiro(p);
    setNome(p.nome || "");
    setCpf(p.cpf || "");
    setRg(p.rg || "");
    setDataNascimento(p.dataNascimento || "");
    setTelefone(p.telefone || "");
    setWhatsapp(p.whatsapp || "");
    setEndereco(p.endereco || "");
    setFotoUrl(p.fotoUrl || "");
    setAnexoDocumento(p.anexoDocumento || "");
    setObservacoes(p.observacoes || "");
    setError("");
    setIsModalOpen(true);
  };

  // Turn on webcam stream
  const startCamera = async () => {
    try {
      setUseWebcam(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error(err);
      alert("Não foi possível acessar a câmera do dispositivo.");
      setUseWebcam(false);
    }
  };

  // Capture frame
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, 320, 240);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setFotoUrl(dataUrl);
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setStream(null);
    setUseWebcam(false);
  };

  // Handle files base64 conversions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "foto" | "anexo") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (type === "foto") {
        setFotoUrl(base64);
      } else {
        setAnexoDocumento(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !cpf) {
      setError("Nome e CPF são campos obrigatórios.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload: Passageiro = {
        id: selectedPassageiro?.id || "",
        nome,
        cpf,
        rg,
        dataNascimento,
        telefone,
        whatsapp,
        endereco,
        fotoUrl,
        anexoDocumento,
        observacoes,
        createdAt: selectedPassageiro?.createdAt || new Date().toISOString()
      };

      await savePassageiro(payload, userLogin);
      setIsModalOpen(false);
      stopCamera();
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar cadastro.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (p: Passageiro) => {
    if (userPerfil !== "Administrador") {
      alert("Apenas administradores podem excluir passageiros.");
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o passageiro "${p.nome}"?`)) {
      try {
        await deletePassageiro(p.id, p.nome, userLogin);
        onRefresh();
      } catch (err: any) {
        alert("Erro ao excluir: " + err.message);
      }
    }
  };

  const exportToCSV = () => {
    const headers = "ID,Nome,CPF,RG,Nascimento,Telefone,WhatsApp,Endereco\n";
    const rows = filteredPassageiros.map(p => 
      `"${p.id}","${p.nome.replace(/"/g, '""')}","${p.cpf}","${p.rg || ""}","${p.dataNascimento || ""}","${p.telefone || ""}","${p.whatsapp || ""}","${p.endereco?.replace(/"/g, '""') || ""}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `passageiros_segaf_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPassageiros = passageiros.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.cpf.includes(searchTerm) ||
    (p.rg && p.rg.includes(searchTerm))
  );

  const getPassengerHistory = (passengerId: string) => {
    return passagens.filter(p => p.passageiroId === passengerId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Passageiros</h2>
            <p className="text-xs text-slate-500">Gestão de assistidos e acompanhamento de viagens sociais ou funcionais</p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exportar</span>
          </button>

          {userPerfil !== "Consulta" && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-md shadow-blue-600/10 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Passageiro</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar por Nome do Passageiro, CPF ou RG..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 text-sm transition"
          />
        </div>
      </div>

      {/* Table grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPassageiros.length === 0 ? (
          <div className="lg:col-span-3 py-12 bg-white text-center rounded-xl border border-slate-200 text-slate-400 text-sm">
            Nenhum passageiro cadastrado no sistema.
          </div>
        ) : (
          filteredPassageiros.map(p => (
            <div key={p.id} className="bg-white rounded-xl p-5 border border-slate-200/80 flex flex-col justify-between shadow-xs">
              <div className="space-y-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-14 h-14 rounded-full border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                    {p.fotoUrl ? (
                      <img src={p.fotoUrl} alt={p.nome} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Users className="w-7 h-7 text-slate-300" />
                    )}
                  </div>
                  <div className="space-y-0.5 truncate">
                    <h3 className="font-bold text-slate-800 text-sm truncate">{p.nome}</h3>
                    <span className="text-[10px] font-mono font-medium text-slate-400 block">CPF: {p.cpf}</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Nasc: {p.dataNascimento ? new Date(p.dataNascimento).toLocaleDateString("pt-BR") : "Não informado"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{p.whatsapp || p.telefone || "Sem telefone"}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate max-w-[200px]">{p.endereco || "Não informado"}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 pt-3.5 mt-4">
                <button
                  onClick={() => {
                    setSelectedPassageiro(p);
                    setIsHistoryOpen(true);
                  }}
                  className="text-[10px] font-bold text-blue-600 hover:underline flex items-center space-x-1"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Ver Histórico de Viagens ({getPassengerHistory(p.id).length})</span>
                </button>

                {userPerfil !== "Consulta" && (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 rounded-md border border-slate-200 hover:bg-slate-50 transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {userPerfil === "Administrador" && (
                      <button
                        onClick={() => handleDelete(p)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 rounded-md border border-slate-200 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* History Modal */}
      {isHistoryOpen && selectedPassageiro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <h3 className="text-sm font-bold flex items-center space-x-2">
                <History className="w-5 h-5 text-blue-400" />
                <span>Histórico de Passagens: {selectedPassageiro.nome}</span>
              </h3>
              <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-white text-lg">&times;</button>
            </div>

            <div className="p-6 max-h-[400px] overflow-y-auto space-y-3">
              {getPassengerHistory(selectedPassageiro.id).length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-8">Este passageiro ainda não possui passagens emitidas no sistema.</p>
              ) : (
                getPassengerHistory(selectedPassageiro.id).map(ticket => (
                  <div key={ticket.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800">Cód: {ticket.id.substring(0, 8).toUpperCase()}</span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold text-[9px] uppercase border border-blue-100">
                          {ticket.status}
                        </span>
                      </div>
                      <p className="text-slate-500">Destino: <strong className="text-slate-700">{ticket.destino}</strong> | Saída: <strong>{formatarDataParaExibicao(ticket.dataViagem)}</strong></p>
                      <p className="text-[10px] text-slate-400">Tipo: {ticket.tipoViagem} | Acomodação: {ticket.id}</p>
                    </div>

                    <div className="text-right">
                      <span className="block text-[10px] text-slate-400 font-semibold uppercase">Valor Pago</span>
                      <strong className="text-sm text-emerald-600">R$ {ticket.valorFinal.toFixed(2)}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsHistoryOpen(false)} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition">
                Fechar Histórico
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl md:w-[80vw] md:max-w-[1200px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span>{selectedPassageiro ? "Editar Perfil do Passageiro" : "Registrar Novo Passageiro"}</span>
              </h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  stopCamera();
                }}
                className="text-slate-400 hover:text-white transition text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden h-full">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Picture Capturing block */}
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200/60">
                  <div className="relative w-28 h-28 rounded-full border-2 border-slate-200 bg-white overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                    {fotoUrl ? (
                      <img src={fotoUrl} alt="Foto de Perfil" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Users className="w-12 h-12 text-slate-300" />
                    )}
                    {fotoUrl && (
                      <button
                        type="button"
                        onClick={() => setFotoUrl("")}
                        className="absolute inset-0 bg-black/40 text-white font-bold text-[10px] flex items-center justify-center opacity-0 hover:opacity-100 transition"
                      >
                        Remover foto
                      </button>
                    )}
                  </div>

                  <div className="space-y-3.5 flex-1 w-full text-center sm:text-left">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Foto do Passageiro</h4>
                    <p className="text-xs text-slate-400">Capture uma foto com a câmera do dispositivo ou carregue uma image JPG/PNG.</p>
                    
                    <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Usar Câmera</span>
                      </button>

                      <label className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Carregar Arquivo</span>
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "foto")} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Webcam feed modal state */}
                {useWebcam && (
                  <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3 flex flex-col items-center">
                    <video ref={videoRef} autoPlay className="rounded-lg border border-slate-700 w-[320px] h-[240px] bg-black" />
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center space-x-1.5"
                      >
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        <span>Bater Foto</span>
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-semibold"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {/* Fields block */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Nome Completo *</label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                      autoFocus
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">CPF *</label>
                    <input
                      type="text"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      required
                      placeholder="000.000.000-00"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">RG</label>
                    <input
                      type="text"
                      value={rg}
                      onChange={(e) => setRg(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Data de Nascimento</label>
                    <input
                      type="date"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Telefone de Contato</label>
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
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Endereço Residencial</label>
                    <input
                      type="text"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-blue-500 transition"
                    />
                  </div>

                  {/* File Attachment */}
                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide flex items-center justify-between">
                      <span>Anexar Documentos CPF/RG/Residência</span>
                      {anexoDocumento && <span className="text-emerald-600 font-bold text-[10px]">✓ Documento Carregado</span>}
                    </label>
                    <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 hover:bg-slate-100/60 transition flex flex-col items-center text-center">
                      <FileText className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-xs text-slate-500 mb-2 font-medium">Selecione arquivos PDF ou fotos dos documentos pessoais.</p>
                      <label className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer shadow-xs inline-block">
                        <span>Procurar Documento</span>
                        <input type="file" onChange={(e) => handleFileChange(e, "anexo")} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Observações do Cadastro</label>
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
                  onClick={() => {
                    setIsModalOpen(false);
                    stopCamera();
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/10 transition"
                >
                  {loading ? "Salvando..." : "Salvar Passageiro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
