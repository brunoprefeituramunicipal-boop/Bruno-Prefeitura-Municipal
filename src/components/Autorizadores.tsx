import React, { useState, useRef } from "react";
import { Autorizador } from "../types";
import { saveAutorizador, deleteAutorizador } from "../services/dbService";
import { Award, Plus, Edit2, Trash2, ShieldAlert, PenTool, RotateCcw, Check } from "lucide-react";

interface AutorizadoresProps {
  autorizadores: Autorizador[];
  userPerfil: string;
  userLogin: string;
  onRefresh: () => void;
}

export default function Autorizadores({ autorizadores, userPerfil, userLogin, onRefresh }: AutorizadoresProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAut, setEditingAut] = useState<Autorizador | null>(null);

  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [orgao, setOrgao] = useState("");
  const [assinaturaDigital, setAssinaturaDigital] = useState("");
  const [status, setStatus] = useState<"Ativo" | "Inativo">("Ativo");

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

  // Canvas Drawing references for digital signature pad
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const openAddModal = () => {
    setEditingAut(null);
    setNome("");
    setCargo("");
    setOrgao("SEGAF");
    setAssinaturaDigital("");
    setStatus("Ativo");
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (aut: Autorizador) => {
    setEditingAut(aut);
    setNome(aut.nome || "");
    setCargo(aut.cargo || "");
    setOrgao(aut.orgao || "SEGAF");
    setAssinaturaDigital(aut.assinaturaDigital || "");
    setStatus(aut.status || "Ativo");
    setError("");
    setIsModalOpen(true);
  };

  // Drawing Canvas helpers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#1e3a8a"; // Deep blue ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setAssinaturaDigital("");
  };

  const saveSignatureFromCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataURL = canvas.toDataURL("image/png");
    setAssinaturaDigital(dataURL);
    alert("Assinatura gravada com sucesso!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !cargo || !orgao) {
      setError("Os campos Nome, Cargo e Órgão são obrigatórios.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload: Autorizador = {
        id: editingAut?.id || "",
        nome,
        cargo,
        orgao,
        assinaturaDigital,
        status
      };
      await saveAutorizador(payload, userLogin);
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar autorizador.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (aut: Autorizador) => {
    if (userPerfil !== "Administrador") {
      alert("Apenas administradores podem excluir registros.");
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o autorizador "${aut.nome}"?`)) {
      try {
        await deleteAutorizador(aut.id, aut.nome, userLogin);
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
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Quadro de Autorizadores</h2>
            <p className="text-xs text-slate-500">Membros oficiais habilitados a assinar e validar as requisições de passagens</p>
          </div>
        </div>

        {userPerfil === "Administrador" && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-md shadow-amber-600/10 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Autorizador</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {autorizadores.map((aut) => (
          <div key={aut.id} className="bg-white rounded-xl p-5 border border-slate-200/80 flex flex-col justify-between space-y-4 shadow-xs">
            <div className="space-y-3.5">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-sm">{aut.nome}</h3>
                  <p className="text-xs text-slate-500 font-medium">{aut.cargo} - {aut.orgao}</p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                  aut.status === "Ativo" 
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                    : "bg-slate-100 text-slate-500 border-slate-200"
                }`}>
                  {aut.status}
                </span>
              </div>

              {/* Signature representation */}
              <div className="border border-slate-100 bg-slate-50/50 rounded-xl p-3 h-20 flex items-center justify-center relative overflow-hidden">
                {aut.assinaturaDigital ? (
                  <img 
                    src={aut.assinaturaDigital} 
                    alt="Rubrica Digital" 
                    className="max-h-16 object-contain mix-blend-multiply"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono italic">Rubrica Digital não cadastrada</span>
                )}
                <span className="absolute bottom-1 right-2 text-[8px] text-slate-300 uppercase tracking-widest font-bold">Assinatura Habilitada</span>
              </div>
            </div>

            {userPerfil === "Administrador" && (
              <div className="flex justify-end space-x-1.5 pt-2 border-t border-slate-100">
                <button
                  onClick={() => openEditModal(aut)}
                  className="p-1.5 text-slate-500 hover:text-amber-600 rounded-md hover:bg-slate-50 border border-slate-200/60 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(aut)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md md:w-[80vw] md:max-w-[1200px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center shrink-0">
              <h3 className="text-sm font-bold flex items-center space-x-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>{editingAut ? "Editar Autorizador" : "Cadastrar Novo Autorizador"}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white text-lg">&times;</button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden h-full">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Nome Completo *</label>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      required
                      autoFocus
                      placeholder="Ex: Dr. Roberto Portel"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Cargo Oficial *</label>
                    <input
                      type="text"
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value)}
                      required
                      placeholder="Ex: Secretário Municipal"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide">Secretaria / Órgão *</label>
                    <input
                      type="text"
                      value={orgao}
                      onChange={(e) => setOrgao(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-amber-500 transition"
                    />
                  </div>

                  {/* Draw Canvas Block */}
                  <div>
                    <label className="block text-slate-600 text-xs font-semibold mb-1.5 uppercase tracking-wide flex items-center justify-between">
                      <span>Rubrica / Assinatura Digital</span>
                      <span className="text-[10px] text-slate-400 lowercase italic">Desenhe abaixo</span>
                    </label>
                    
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                      <canvas
                        ref={canvasRef}
                        width={380}
                        height={120}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-24 cursor-crosshair bg-slate-50 block touch-none"
                      />
                      
                      <div className="flex justify-between items-center bg-slate-100 px-3 py-2 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={clearCanvas}
                          className="text-[10px] text-slate-500 hover:text-slate-700 flex items-center space-x-1 font-semibold"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Limpar Canvas</span>
                        </button>

                        <button
                          type="button"
                          onClick={saveSignatureFromCanvas}
                          className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center space-x-1 font-bold"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Gravar Assinatura</span>
                        </button>
                      </div>
                    </div>

                    {assinaturaDigital && (
                      <div className="mt-2 text-center">
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1 inline-block">
                          ✓ Assinatura gravada com sucesso!
                        </span>
                      </div>
                    )}
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
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition"
                >
                  {loading ? "Salvando..." : "Salvar Autorizador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
