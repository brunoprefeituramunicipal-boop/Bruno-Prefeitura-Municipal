import React, { useState } from "react";
import { 
  signInWithEmailAndPassword, 
  updatePassword, 
  sendPasswordResetEmail,
  signOut 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { logAction } from "../services/dbService";
import { User } from "../types";
import { 
  Anchor,
  Shield, 
  KeyRound, 
  Mail, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft,
  MessageCircle
} from "lucide-react";

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

type LoginMode = "login" | "firstAccess" | "recovery";

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<LoginMode>("login");

  // State for password change (First Access)
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor, preencha o e-mail e a senha.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // 1. Authenticate with Firebase Auth using email and password
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const uid = cred.user.uid;

      // 2. Fetch user profile from Firestore users collection
      const userDocRef = doc(db, "users", uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        setError("Perfil de usuário não encontrado no sistema.");
        await signOut(auth);
        setLoading(false);
        return;
      }

      const userData = userSnap.data() as User;

      // 3. Verify status
      if (userData.status !== "Ativo") {
        setError("Esta conta está inativa. Entre em contato com o administrador.");
        await signOut(auth);
        setLoading(false);
        return;
      }

      // 4. Check if it's the first login / needs mandatory password change
      if (userData.primeiroAcesso) {
        setTargetUser(userData);
        setMode("firstAccess");
        setLoading(false);
      } else {
        // Update last login timestamp in Firestore
        const now = new Date().toISOString();
        await setDoc(userDocRef, {
          ...userData,
          ultimoLogin: now,
          alteradoEm: now
        });

        await logAction(userData.email, "Efetuou login no sistema");
        onLoginSuccess({
          ...userData,
          ultimoLogin: now,
          alteradoEm: now
        });
      }
    } catch (err: any) {
      console.error("Login error:", err);
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("E-mail ou senha incorretos, ou conta inativa.");
      } else if (err.code === "auth/invalid-email") {
        setError("Formato de e-mail inválido.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Muitas tentativas malsucedidas. Tente novamente mais tarde.");
      } else {
        setError("Falha na autenticação: " + (err.message || err));
      }
      setLoading(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError("Preencha todos os campos de senha.");
      return;
    }
    if (newPassword.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (auth.currentUser && targetUser) {
        // Update password in Firebase Authentication
        await updatePassword(auth.currentUser, newPassword);

        // Update profile in Firestore
        const now = new Date().toISOString();
        const updatedUser: User = {
          ...targetUser,
          primeiroAcesso: false,
          ultimoLogin: now,
          alteradoEm: now
        };

        await setDoc(doc(db, "users", targetUser.id), updatedUser);
        await logAction(updatedUser.email, "Alterou a senha obrigatória no primeiro acesso");

        onLoginSuccess(updatedUser);
      } else {
        throw new Error("Usuário não autenticado ou registro ausente.");
      }
    } catch (err: any) {
      console.error("Password change error:", err);
      if (err.code === "auth/requires-recent-login") {
        setError("Sessão expirou. Por favor, faça login novamente para alterar a senha.");
        setMode("login");
      } else {
        setError("Falha ao atualizar senha: " + (err.message || err));
      }
      setLoading(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Por favor, informe seu e-mail.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess("E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada.");
      setEmail("");
    } catch (err: any) {
      console.error("Recovery error:", err);
      if (err.code === "auth/user-not-found") {
        setError("Este e-mail não está cadastrado no sistema.");
      } else if (err.code === "auth/invalid-email") {
        setError("Formato de e-mail inválido.");
      } else {
        setError("Falha ao enviar e-mail de recuperação: " + (err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Lado Esquerdo - Banner de Destaque (Estilo Instagram Premium) */}
      <div className="hidden md:block md:w-1/2 relative bg-slate-900 overflow-hidden h-screen sticky top-0">
        <img 
          src="https://i.postimg.cc/QCPVr7yK/Chat-GPT-Image-25-06-2026-17-16-37.png" 
          alt="Prefeitura de Portel - Gestão Municipal SEGAF" 
          className="w-full h-full object-cover opacity-90 transition-opacity duration-300 select-none pointer-events-none"
          referrerPolicy="no-referrer"
        />
        {/* Subtle, premium gradient shadow layer with brand messaging */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex flex-col justify-end p-12 text-white">
          <div className="space-y-3">
            <span className="text-[10px] font-bold tracking-widest uppercase bg-blue-600 px-3 py-1 rounded-md inline-block shadow-xs">
              Portal do Servidor
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight uppercase">SISTEMA SEGAF</h2>
            <p className="text-slate-300 text-sm max-w-md font-medium leading-relaxed">
              Secretaria de Gestão Administrativa e Financeira de Portel. Integrando processos, simplificando emissões de passagens sociais e garantindo total transparência pública.
            </p>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário de Login */}
      <div className="w-full md:w-1/2 min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-50 relative overflow-y-auto">
        {/* Background decoration bubbles */}
        <div className="absolute w-[400px] h-[400px] rounded-full bg-blue-100/40 top-10 right-10 blur-3xl pointer-events-none" />
        <div className="absolute w-[300px] h-[300px] rounded-full bg-cyan-100/30 bottom-10 left-10 blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden z-10 transition-all duration-300 my-auto">
          <div className="p-8 text-center bg-white border-b border-slate-100 relative">
            <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 mb-4">
              <Anchor className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              SISTEMA SEGAF
            </h1>
            <p className="text-slate-500 text-xs mt-1">
              Secretaria de Gestão Administrativa e Financeira
            </p>
            <div className="text-blue-600 font-bold text-[10px] mt-2.5 uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full inline-block border border-blue-100/60">
              Prefeitura de Portel
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start space-x-3 text-rose-700 text-sm animate-fadeIn">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start space-x-3 text-emerald-700 text-sm animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="flex-1">{success}</span>
              </div>
            )}

            {mode === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold mb-2 uppercase tracking-wider">
                    E-mail institucional
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemplo@segaf.portel.pa.gov.br"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-sm transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold mb-2 uppercase tracking-wider">
                    Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-sm transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setSuccess("");
                      setMode("recovery");
                    }}
                    className="text-blue-600 hover:text-blue-500 font-semibold"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all focus:outline-none disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {loading ? "Autenticando..." : "Entrar no Sistema"}
                  </button>
                </div>

                <div className="text-center mt-4 border-t border-slate-100 pt-4">
                  <p className="text-slate-400 text-[10px] font-bold tracking-wide leading-relaxed">
                    Empresa DUO Digital – Portel/PA<br />
                    Desenvolvedor: C A R Fontes – Tel.: (91) 99148-3436
                    <a
                      href="https://wa.me/5591991483436?text=Ol%C3%A1%21%20Conheci%20o%20Sistema%20SEGAF%20e%20gostaria%20de%20conhecer%20os%20servi%C3%A7os%20da%20DUO%20Digital.%20Tenho%20interesse%20em%20desenvolvimento%20de%20sites%2C%20landing%20pages%20e%20sistemas%20personalizados.%20Poder%C3%ADamos%20conversar%3F"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center ml-1.5 text-emerald-600 hover:text-emerald-500 transition-colors align-middle"
                      title="Conversar no WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-emerald-500 text-white" />
                    </a>
                  </p>
                </div>
              </form>
            )}

            {mode === "firstAccess" && (
              <form onSubmit={handlePasswordChangeSubmit} className="space-y-5">
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-800 text-xs mb-4">
                  <p className="font-bold mb-1 uppercase tracking-wider flex items-center">
                    <Shield className="w-4 h-4 mr-1.5 text-amber-600" /> Alteração de Senha Obrigatória
                  </p>
                  Este é o seu primeiro acesso ao sistema. Por razões de segurança, altere sua senha temporária por uma nova senha pessoal para continuar.
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold mb-2 uppercase tracking-wider">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo de 6 caracteres"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-sm transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold mb-2 uppercase tracking-wider">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-sm transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all focus:outline-none disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? "Salvando..." : "Salvar Senha e Entrar"}
                  </button>
                </div>
              </form>
            )}

            {mode === "recovery" && (
              <form onSubmit={handleRecoverySubmit} className="space-y-5">
                <div className="text-slate-600 text-xs mb-4">
                  Informe o seu e-mail cadastrado para receber um link de recuperação e redefinição de senha.
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold mb-2 uppercase tracking-wider">
                    E-mail cadastrado
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemplo@segaf.portel.pa.gov.br"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 text-sm transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-850 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all focus:outline-none disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? "Enviando..." : "Enviar E-mail de Recuperação"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setSuccess("");
                      setMode("login");
                    }}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold tracking-wider uppercase transition-all focus:outline-none flex items-center justify-center space-x-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar ao Login</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
