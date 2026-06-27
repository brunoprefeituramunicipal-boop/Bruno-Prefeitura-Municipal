import React, { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc,
  query,
  where
} from "firebase/firestore";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from "firebase/auth";
import { initializeApp, getApp, getApps } from "firebase/app";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import firebaseConfig from "../../firebase-applet-config.json";
import { User, UserPerfil, UserStatus } from "../types";
import { 
  Users, 
  UserPlus, 
  Edit2, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw,
  Mail,
  User as UserIcon,
  Shield,
  Activity
} from "lucide-react";
import { logAction } from "../services/dbService";

// Safe initialization of secondary Firebase app for creating users
const getSecondaryAuth = () => {
  const appName = "SecondaryUserCreatorApp";
  let secondaryApp;
  if (getApps().some(app => app.name === appName)) {
    secondaryApp = getApp(appName);
  } else {
    secondaryApp = initializeApp(firebaseConfig, appName);
  }
  return getAuth(secondaryApp);
};

interface UsuariosProps {
  currentUser: User;
  onRefresh?: () => void;
}

export default function Usuarios({ currentUser, onRefresh }: UsuariosProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Tabs: "manage" (only for Admin) or "profile" (any logged in user)
  const isAdmin = currentUser.perfil === "Administrador";
  const [activeTab, setActiveTab] = useState<"manage" | "profile">(isAdmin ? "manage" : "profile");

  // Add/Edit User states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Form Fields
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<UserPerfil>("Operador");
  const [status, setStatus] = useState<UserStatus>("Ativo");

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

  // Personal Password Change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const snap = await getDocs(collection(db, "users"));
      const userList = snap.docs.map(d => d.data() as User);
      // Sort users: Admin first, then alphabetical
      userList.sort((a, b) => {
        if (a.perfil === "Administrador" && b.perfil !== "Administrador") return -1;
        if (a.perfil !== "Administrador" && b.perfil === "Administrador") return 1;
        return a.nome.localeCompare(b.nome);
      });
      setUsers(userList);
    } catch (err) {
      console.error("Error loading users:", err);
      setError("Não foi possível carregar os usuários.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const openAddModal = () => {
    setEditingUser(null);
    setNome("");
    setEmail("");
    setSenha("");
    setPerfil("Operador");
    setStatus("Ativo");
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setNome(user.nome);
    setEmail(user.email);
    setSenha(""); // passwords can't be fetched
    setPerfil(user.perfil);
    setStatus(user.status);
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email || (!editingUser && !senha)) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      let userId = editingUser?.id;

      if (!editingUser) {
        // CREATING NEW USER
        if (senha.length < 6) {
          setError("A senha deve ter pelo menos 6 caracteres.");
          setSubmitting(false);
          return;
        }

        // 1. Create in Firebase Auth using the secondary auth instance
        const secAuth = getSecondaryAuth();
        try {
          const cred = await createUserWithEmailAndPassword(secAuth, email.trim(), senha);
          userId = cred.user.uid;
        } catch (authErr: any) {
          console.error("Error creating Auth user:", authErr);
          if (authErr.code === "auth/email-already-in-use") {
            throw new Error("Este endereço de e-mail já está sendo utilizado.");
          } else if (authErr.code === "auth/invalid-email") {
            throw new Error("Formato de e-mail inválido.");
          } else {
            throw new Error("Erro de autenticação: " + authErr.message);
          }
        }
      }

      if (!userId) {
        throw new Error("Não foi possível gerar um ID de usuário.");
      }

      // 2. Save/Update user document in Firestore users collection
      const finalUser: User = {
        id: userId,
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        perfil,
        status,
        primeiroAcesso: editingUser ? editingUser.primeiroAcesso : false,
        criadoEm: editingUser?.criadoEm || new Date().toISOString(),
        alteradoEm: new Date().toISOString(),
        ultimoLogin: editingUser?.ultimoLogin || ""
      };

      await setDoc(doc(db, "users", userId), finalUser);
      await logAction(
        currentUser.email,
        `${editingUser ? "Alterou" : "Cadastrou"} usuário: ${finalUser.email} (${finalUser.perfil})`
      );

      setSuccess(`Usuário ${editingUser ? "atualizado" : "criado"} com sucesso!`);
      setIsModalOpen(false);
      loadUsers();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error("Error saving user:", err);
      setError(err.message || "Falha ao salvar usuário no Firestore.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userToDelete: User) => {
    if (userToDelete.id === currentUser.id) {
      alert("Você não pode excluir sua própria conta.");
      return;
    }

    if (!confirm(`Deseja realmente excluir o usuário ${userToDelete.nome}?`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteDoc(doc(db, "users", userToDelete.id));
      await logAction(currentUser.email, `Excluiu usuário do Firestore: ${userToDelete.email}`);
      setSuccess("Usuário removido do Firestore com sucesso.");
      loadUsers();
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Falha ao excluir usuário do banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  const handlePersonalPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPwdError("Preencha todos os campos.");
      return;
    }
    if (newPassword.length < 6) {
      setPwdError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwdError("As senhas não coincidem.");
      return;
    }

    setPwdLoading(true);
    setPwdError("");
    setPwdSuccess("");

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error("Sessão do usuário não encontrada.");
      }

      // Re-authenticate user to prove identity and prevent auth/requires-recent-login errors
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      try {
        await reauthenticateWithCredential(user, credential);
      } catch (reauthErr) {
        throw new Error("Senha atual incorreta.");
      }

      // Update password
      await updatePassword(user, newPassword);
      await logAction(currentUser.email, "Alterou a própria senha de acesso");

      setPwdSuccess("Sua senha foi alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      console.error("Password change error:", err);
      setPwdError(err.message || "Erro ao alterar a senha.");
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-slate-950 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Configurações de Segurança
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gerenciamento de credenciais, permissões de acesso e segurança de perfil.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start">
          {isAdmin && (
            <button
              onClick={() => setActiveTab("manage")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === "manage"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Controle de Usuários</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === "profile"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Alterar Minha Senha</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start space-x-3 text-rose-800 text-xs">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start space-x-3 text-emerald-800 text-xs">
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <span className="flex-1">{success}</span>
        </div>
      )}

      {/* USER MANAGEMENT TAB */}
      {activeTab === "manage" && isAdmin && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900">Lista de Operadores e Administradores</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Configure perfis e habilite/desabilite contas instantaneamente.</p>
              </div>
            </div>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 shadow-md shadow-amber-600/10 transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Novo Usuário</span>
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-500">Buscando credenciais...</span>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-200">
                      <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nome / Email</th>
                      <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Perfil</th>
                      <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Último Acesso</th>
                      <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-slate-900">{u.nome}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{u.email}</div>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                            u.perfil === "Administrador"
                              ? "bg-purple-50 text-purple-700 border border-purple-100"
                              : u.perfil === "Operador"
                                ? "bg-blue-50 text-blue-700 border border-blue-100"
                                : "bg-slate-50 text-slate-600 border border-slate-150"
                          }`}>
                            {u.perfil === "Administrador" ? <ShieldCheck className="w-3 h-3 mr-0.5" /> : null}
                            <span>{u.perfil}</span>
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            u.status === "Ativo"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-rose-50 text-rose-700 border border-rose-150"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${u.status === "Ativo" ? "bg-emerald-500" : "bg-rose-500"}`} />
                            {u.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 font-mono text-[10px]">
                          {u.ultimoLogin ? new Date(u.ultimoLogin).toLocaleString("pt-BR") : "Nunca acessou"}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end space-x-1.5">
                            <button
                              onClick={() => openEditModal(u)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md border border-slate-200/60 transition cursor-pointer"
                              title="Editar Perfil"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={u.id === currentUser.id}
                              className={`p-1.5 text-slate-500 rounded-md border border-slate-200/60 transition cursor-pointer ${
                                u.id === currentUser.id
                                  ? "opacity-40 cursor-not-allowed"
                                  : "hover:text-rose-600 hover:bg-rose-50"
                              }`}
                              title={u.id === currentUser.id ? "Sua própria conta" : "Remover Usuário"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CHANGE PASSWORD TAB */}
      {activeTab === "profile" && (
        <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-blue-600" />
              Alteração de Senha
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">
              Altere sua senha de acesso ao sistema de forma rápida e segura.
            </p>
          </div>

          <form onSubmit={handlePersonalPasswordChange} className="p-6 space-y-4">
            {pwdError && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start space-x-2 text-rose-800 text-xs animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{pwdError}</span>
              </div>
            )}

            {pwdSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start space-x-2 text-emerald-800 text-xs animate-fadeIn">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{pwdSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">
                Senha Atual
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Informe sua senha atual"
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">
                Nova Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={pwdLoading}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <span>{pwdLoading ? "Alterando..." : "Alterar Senha"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD/EDIT USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md md:w-[80vw] md:max-w-[600px] border border-slate-200 shadow-xl overflow-hidden transform transition-all flex flex-col max-h-[90vh] animate-fadeIn">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-blue-600" />
                {editingUser ? "Editar Usuário" : "Novo Usuário"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 text-base"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="flex flex-col overflow-hidden h-full">
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                <div>
                  <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Nome do colaborador"
                      autoFocus
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">
                    E-mail institucional
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="type"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@segaf.portel.pa.gov.br"
                      disabled={!!editingUser}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-blue-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      required
                    />
                  </div>
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">
                      Senha de Acesso Inicial
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-blue-500 transition-all"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">
                      Perfil
                    </label>
                    <select
                      value={perfil}
                      onChange={(e) => setPerfil(e.target.value as UserPerfil)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-blue-500 transition-all"
                    >
                      <option value="Administrador">Administrador</option>
                      <option value="Operador">Operador</option>
                      <option value="Consulta">Consulta</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-500 text-[10px] font-bold mb-1.5 uppercase tracking-wider">
                      Status da Conta
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as UserStatus)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:border-blue-500 transition-all"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold uppercase transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold uppercase transition disabled:opacity-50"
                >
                  {submitting ? "Gravando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
