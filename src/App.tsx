import React, { useState, useEffect } from "react";
import { User, Passagem, Passageiro, Empresa, Embarcacao, Acomodacao, Motivo, Autorizador } from "./types";
import { 
  seedDatabaseIfEmpty, 
  getEmpresas, 
  getEmbarcacoes, 
  getAcomodacoes, 
  getMotivos, 
  getPassageiros, 
  getAutorizadores, 
  getPassagens,
  logAction
} from "./services/dbService";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

// Import modules
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Empresas from "./components/Empresas";
import Embarcacoes from "./components/Embarcacoes";
import Acomodacoes from "./components/Acomodacoes";
import Motivos from "./components/Motivos";
import Passageiros from "./components/Passageiros";
import Autorizadores from "./components/Autorizadores";
import EmissaoPassagens from "./components/EmissaoPassagens";
import RelatoriosFinanceiro from "./components/RelatoriosFinanceiro";
import GeminiAssistant from "./components/GeminiAssistant";
import Usuarios from "./components/Usuarios";
import Configuracoes from "./components/Configuracoes";

// Icons
import { 
  Anchor,
  LayoutDashboard, 
  FileText, 
  Users, 
  Building2, 
  Ship, 
  Bed, 
  ClipboardList, 
  Award, 
  BarChart3, 
  LogOut, 
  User as UserIcon,
  Menu,
  X,
  UserCog,
  Settings
} from "lucide-react";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Database lists state
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [embarcacoes, setEmbarcacoes] = useState<Embarcacao[]>([]);
  const [acomodacoes, setAcomodacoes] = useState<Acomodacao[]>([]);
  const [motivos, setMotivos] = useState<Motivo[]>([]);
  const [passageiros, setPassageiros] = useState<Passageiro[]>([]);
  const [autorizadores, setAutorizadores] = useState<Autorizador[]>([]);
  const [passagens, setPassagens] = useState<Passagem[]>([]);

  // State loading spinner
  const [dbLoading, setDbLoading] = useState(true);

  // Outer pass-through state for dashboard alert editing shortcut
  const [externalEditingTicket, setExternalEditingTicket] = useState<Passagem | null>(null);

  // Trigger loading and database seeding on boot
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await seedDatabaseIfEmpty();
      } catch (err) {
        console.error("Erro ao inicializar banco de dados:", err);
      }
    };
    initializeApp();
  }, []);

  // Listen to Firebase Auth state change for login persistence & session control
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            // Only allow if active and not pending first access password change
            if (userData.status === "Ativo" && !userData.primeiroAcesso) {
              const userObj: User = {
                ...userData,
                login: userData.login || userData.email
              };
              setCurrentUser(userObj);
            } else {
              // Gated / First access password change required or user is inactive
              setCurrentUser(null);
              await signOut(auth);
            }
          } else {
            setCurrentUser(null);
            await signOut(auth);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (err) {
        console.error("Erro ao carregar perfil do usuário:", err);
        setCurrentUser(null);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load all operational data once currentUser is successfully identified
  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser]);

  const loadAllData = async () => {
    setDbLoading(true);
    try {
      const [
        listEmpresas,
        listEmbarcacoes,
        listAcomodacoes,
        listMotivos,
        listPassageiros,
        listAutorizadores,
        listPassagens
      ] = await Promise.all([
        getEmpresas(),
        getEmbarcacoes(),
        getAcomodacoes(),
        getMotivos(),
        getPassageiros(),
        getAutorizadores(),
        getPassagens()
      ]);

      setEmpresas(listEmpresas);
      setEmbarcacoes(listEmbarcacoes);
      setAcomodacoes(listAcomodacoes);
      setMotivos(listMotivos);
      setPassageiros(listPassageiros);
      setAutorizadores(listAutorizadores);
      setPassagens(listPassagens);
      setInitialDataLoaded(true);
    } catch (err) {
      console.error("Erro ao carregar dados do Firestore:", err);
    } finally {
      setDbLoading(false);
    }
  };

  const handleLoginSuccess = (user: User) => {
    const userObj: User = {
      ...user,
      login: user.login || user.email
    };
    setCurrentUser(userObj);
    setActiveMenu("dashboard");
  };

  const handleLogout = async () => {
    if (currentUser) {
      await logAction(currentUser.login || currentUser.email, "Efetuou logout do sistema");
    }
    await signOut(auth);
    setCurrentUser(null);
    setInitialDataLoaded(false);
  };

  const handleNavigateToTicketsFromDashboard = () => {
    setActiveMenu("passagens");
  };

  const handleEditTicketFromDashboardAlert = (ticket: Passagem) => {
    setExternalEditingTicket(ticket);
    setActiveMenu("passagens");
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold tracking-wider uppercase">SEGAF</h2>
          <p className="text-xs text-slate-400 font-semibold">Verificando autenticação de segurança...</p>
        </div>
      </div>
    );
  }

  if (currentUser && !initialDataLoaded) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-900 text-white space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold tracking-wider uppercase">SEGAF - Portel</h2>
          <p className="text-xs text-slate-400 font-semibold">Sincronizando dados operacionais...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Sidebar navigation options
  const menuItems = [
    { id: "dashboard", label: "Painel Geral", icon: LayoutDashboard },
    { id: "passagens", label: "Conceder Passagem", icon: FileText },
    { id: "passageiros", label: "Passageiros", icon: Users },
    { id: "empresas", label: "Linhas de Navegação", icon: Building2 },
    { id: "embarcacoes", label: "Embarcações", icon: Ship },
    { id: "acomodacoes", label: "Acomodações", icon: Bed },
    { id: "motivos", label: "Motivos Legais", icon: ClipboardList },
    { id: "autorizadores", label: "Autorizadores", icon: Award },
    { id: "relatorios", label: "Prestação de Contas", icon: BarChart3 },
    { id: "usuarios", label: "Usuários & Segurança", icon: UserCog },
    ...(currentUser && currentUser.perfil === "Administrador" ? [
      { id: "configuracoes", label: "Configurações", icon: Settings }
    ] : [])
  ];

  const getHeaderTitle = () => {
    switch (activeMenu) {
      case "dashboard": return "Painel Executivo";
      case "passagens": return "Emissão & Concessão";
      case "passageiros": return "Passageiros Beneficiários";
      case "empresas": return "Linhas de Navegação";
      case "embarcacoes": return "Embarcações";
      case "acomodacoes": return "Acomodações";
      case "motivos": return "Motivos Legais";
      case "autorizadores": return "Autorizadores Deferentes";
      case "relatorios": return "Relatórios & Prestação de Contas";
      case "usuarios": return "Usuários & Segurança";
      case "configuracoes": return "Configurações do Sistema";
      default: return "SEGAF";
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-50 text-slate-900 font-sans flex flex-row overflow-hidden relative">
      
      {/* Navigation Sidebar (Desktop) */}
      <aside className={`hidden md:flex ${sidebarCollapsed ? "w-20" : "w-64"} bg-slate-900 flex-col border-r border-slate-800 shrink-0 z-20 no-print transition-all duration-300`}>
        <div className={`p-6 border-b border-slate-800 ${sidebarCollapsed ? "flex flex-col items-center justify-center" : ""}`}>
          <div className="text-white font-bold text-xl tracking-tight uppercase flex items-center space-x-2">
            <Anchor className="w-5 h-5 text-blue-500 shrink-0" />
            {!sidebarCollapsed && <span>SEGAF</span>}
          </div>
          {!sidebarCollapsed && <div className="text-blue-400 text-xs font-semibold">Prefeitura de Portel</div>}
        </div>

        <nav className="flex-1 py-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`w-full flex items-center ${sidebarCollapsed ? "justify-center px-2 py-4" : "px-6 py-3"} text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                  isSelected 
                    ? "bg-blue-600 text-white" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 ${sidebarCollapsed ? "" : "mr-3"} ${isSelected ? "text-white" : "text-slate-400"}`} />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User Info / Logout Footer */}
        <div className={`p-6 border-t border-slate-800 flex ${sidebarCollapsed ? "flex-col items-center space-y-4 justify-center" : "items-center justify-between"}`}>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
              {currentUser.nome.substring(0, 2)}
            </div>
            {!sidebarCollapsed && (
              <div className="ml-3">
                <div className="text-white text-xs font-semibold truncate max-w-[110px]">{currentUser.nome}</div>
                <div className="text-slate-500 text-[10px] uppercase tracking-wider">{currentUser.perfil}</div>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer shrink-0"
            title="Sair do Sistema"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Menu Trigger & Header overlay */}
      <div className="md:hidden absolute top-4 left-4 z-40 no-print">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-slate-900 text-white rounded-xl shadow-md border border-slate-800"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Navigation Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs flex md:hidden no-print">
          <div className="w-64 bg-slate-900 flex flex-col h-full">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-white font-bold text-xl tracking-tight uppercase">SEGAF</div>
                <div className="text-blue-400 text-xs font-semibold">Prefeitura de Portel</div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white text-lg">&times;</button>
            </div>
            
            <nav className="flex-1 py-4 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isSelected = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveMenu(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center px-6 py-3 text-xs font-semibold tracking-wide transition-colors cursor-pointer ${
                      isSelected 
                        ? "bg-blue-600 text-white" 
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="p-6 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold uppercase">
                  {currentUser.nome.substring(0, 2)}
                </div>
                <div className="ml-3">
                  <div className="text-white text-xs font-semibold">{currentUser.nome}</div>
                  <div className="text-slate-500 text-[10px] uppercase tracking-wider">{currentUser.perfil}</div>
                </div>
              </div>
              <button onClick={handleLogout} className="text-slate-400 hover:text-rose-400 p-1">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Main Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-8 shrink-0 no-print">
          <div className="flex items-center space-x-3">
            {/* Left margin for mobile button */}
            <div className="w-8 md:hidden" />
            
            {/* Toggle Collapse Sidebar (Desktop) */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer mr-1"
              title={sidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
            >
              <Menu className="w-5 h-5" />
            </button>

            <h1 className="text-base md:text-lg font-bold text-slate-800 tracking-tight">{getHeaderTitle()}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-xs text-slate-400 font-medium">
              Gestão de Passagens Fluviais de Portel
            </div>
            
            <button 
              onClick={() => {
                const copilotBtn = document.getElementById("toggle-copilot-btn");
                if (copilotBtn) copilotBtn.click();
              }}
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold px-4 py-1.5 rounded-lg text-xs border border-blue-100 transition flex items-center space-x-1"
            >
              <span>✨ IA Assistente</span>
            </button>
          </div>
        </header>

        {/* Content Viewport */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-slate-50 relative">
          {dbLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3.5">
              <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              <p className="text-slate-500 text-xs font-semibold">Sincronizando dados com o Firestore de Portel...</p>
            </div>
          ) : (
            <div className="mx-auto max-w-7xl animate-fade-in pb-16">
              {activeMenu === "dashboard" && (
                <Dashboard 
                  passagens={passagens}
                  passageiros={passageiros}
                  empresas={empresas}
                  embarcacoes={embarcacoes}
                  acomodacoes={acomodacoes}
                  motivos={motivos}
                  autorizadores={autorizadores}
                  onNavigateToTickets={handleNavigateToTicketsFromDashboard}
                  onEditTicket={handleEditTicketFromDashboardAlert}
                />
              )}
              {activeMenu === "passagens" && (
                <EmissaoPassagens 
                  passagens={passagens}
                  passageiros={passageiros}
                  empresas={empresas}
                  embarcacoes={embarcacoes}
                  acomodacoes={acomodacoes}
                  motivos={motivos}
                  autorizadores={autorizadores}
                  userPerfil={currentUser.perfil}
                  userLogin={currentUser.login}
                  onRefresh={loadAllData}
                  externalEditingTicket={externalEditingTicket}
                  clearExternalEditingTicket={() => setExternalEditingTicket(null)}
                />
              )}
              {activeMenu === "passageiros" && (
                <Passageiros 
                  passageiros={passageiros}
                  passagens={passagens}
                  userPerfil={currentUser.perfil}
                  userLogin={currentUser.login}
                  onRefresh={loadAllData}
                />
              )}
              {activeMenu === "empresas" && (
                <Empresas 
                  empresas={empresas}
                  userPerfil={currentUser.perfil}
                  userLogin={currentUser.login}
                  onRefresh={loadAllData}
                />
              )}
              {activeMenu === "embarcacoes" && (
                <Embarcacoes 
                  embarcacoes={embarcacoes}
                  empresas={empresas}
                  userPerfil={currentUser.perfil}
                  userLogin={currentUser.login}
                  onRefresh={loadAllData}
                />
              )}
              {activeMenu === "acomodacoes" && (
                <Acomodacoes 
                  acomodacoes={acomodacoes}
                  userPerfil={currentUser.perfil}
                  userLogin={currentUser.login}
                  onRefresh={loadAllData}
                />
              )}
              {activeMenu === "motivos" && (
                <Motivos 
                  motivos={motivos}
                  userPerfil={currentUser.perfil}
                  userLogin={currentUser.login}
                  onRefresh={loadAllData}
                />
              )}
              {activeMenu === "autorizadores" && (
                <Autorizadores 
                  autorizadores={autorizadores}
                  userPerfil={currentUser.perfil}
                  userLogin={currentUser.login}
                  onRefresh={loadAllData}
                />
              )}
              {activeMenu === "relatorios" && (
                <RelatoriosFinanceiro 
                  passagens={passagens}
                  passageiros={passageiros}
                  empresas={empresas}
                  embarcacoes={embarcacoes}
                  acomodacoes={acomodacoes}
                  motivos={motivos}
                  autorizadores={autorizadores}
                  userPerfil={currentUser.perfil}
                  onRefresh={loadAllData}
                />
              )}
              {activeMenu === "usuarios" && (
                <Usuarios 
                  currentUser={currentUser}
                  onRefresh={loadAllData}
                />
              )}
              {activeMenu === "configuracoes" && (
                <Configuracoes 
                  currentUser={currentUser}
                  onDataCleared={loadAllData}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Integrated Floating Gemini Copilot Sidebar */}
      {!dbLoading && (
        <GeminiAssistant 
          passagens={passagens}
          passageiros={passageiros}
          empresas={empresas}
          currentUserEmail={currentUser?.email || currentUser?.login || "usuario"}
        />
      )}

    </div>
  );
}
