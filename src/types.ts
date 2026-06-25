export type UserPerfil = "Administrador" | "Operador" | "Consulta";
export type UserStatus = "Ativo" | "Inativo";

export interface User {
  id: string;
  nome: string;
  email: string;
  perfil: UserPerfil;
  status: UserStatus;
  primeiroAcesso?: boolean;
  ultimoLogin?: string;
  criadoEm?: string;
  alteradoEm?: string;
  login?: string;
  senha?: string;
}

export interface Passageiro {
  id: string;
  nome: string;
  cpf: string;
  rg?: string;
  dataNascimento?: string;
  sexo?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  endereco?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  nomeMae?: string;
  nomePai?: string;
  cartaoSus?: string;
  observacoes?: string;
  foto?: string; 
  fotoUrl?: string; // Optional Base64 representation of picture
  anexoDocumento?: string; // Optional PDF or doc base64
  createdAt?: string;
}

export interface Empresa {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  inscricaoEstadual?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  endereco?: string;
  responsavel?: string;
  observacoes?: string;
  status: "Ativo" | "Inativo";
}

export type EmbarcacaoTipo = "Navio" | "Balsa" | "Lancha" | "Ferry Boat";

export interface Embarcacao {
  id: string;
  nome: string;
  tipo: EmbarcacaoTipo;
  empresaId: string;
  capacidade?: number;
  status: "Ativo" | "Inativo";
}

export interface Acomodacao {
  id: string;
  nome: string;
  descricao?: string;
  status: "Ativo" | "Inativo";
}

export interface Motivo {
  id: string;
  nome: string;
  descricao?: string;
  status?: "Ativo" | "Inativo";
}

export interface Autorizador {
  id: string;
  nome: string;
  cargo: string;
  orgao?: string;
  setor?: string;
  assinaturaDigital?: string; // Base64 signature
  status: "Ativo" | "Inativo";
}

export type PassagemStatus = "Solicitada" | "Aprovada" | "Emitida" | "Confirmada" | "Realizada" | "Cancelada";
export type TipoViagem = "Ida" | "Volta" | "Ida e Volta" | "Retorno" | "Ida e Retorno";

export interface Passagem {
  id: string;
  passageiroId: string;
  empresaId: string;
  embarcacaoId: string;
  acomodacaoId: string;
  motivoId: string;
  autorizadorId: string;
  dataViagem: string;
  tipoViagem: TipoViagem;
  destino: string;
  valorOriginal?: number;
  desconto: number; 
  valorFinal: number;
  status: PassagemStatus;
  observacoes?: string;
  createdAt?: string;
  dataLancamento?: string;
  usuarioResponsavel?: string;
  valor?: number;
}

export interface AuditLog {
  id: string;
  usuario: string;
  acao: string;
  timestamp?: string;
  detalhes?: string;
  dataHora?: string;
}



export type Log = AuditLog;


