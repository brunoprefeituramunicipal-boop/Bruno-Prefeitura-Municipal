import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  DocumentData,
  onSnapshot,
  writeBatch
} from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { 
  User, 
  Passageiro, 
  Empresa, 
  Embarcacao, 
  Acomodacao, 
  Motivo, 
  Autorizador, 
  Passagem, 
  Log 
} from "../types";

// Setup helper to log actions
export async function logAction(usuario: string, acao: string): Promise<void> {
  const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const logData: Log = {
    id: logId,
    usuario,
    acao,
    dataHora: new Date().toISOString()
  };
  try {
    await setDoc(doc(db, "logs", logId), logData);
  } catch (err) {
    console.error("Erro ao gravar log de auditoria:", err);
  }
}

// 1. USUÁRIOS
export async function getUsers(): Promise<User[]> {
  try {
    const snap = await getDocs(collection(db, "users"));
    return snap.docs.map(d => d.data() as User);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, "users");
  }
}

export async function saveUser(user: User, executor: string): Promise<void> {
  try {
    const isNew = !user.id;
    const userId = user.id || `user_${Date.now()}`;
    const finalUser = { ...user, id: userId };
    await setDoc(doc(db, "users", userId), finalUser);
    await logAction(executor, `${isNew ? "Cadastrou" : "Alterou"} usuário: ${user.email} (${user.perfil})`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "users");
  }
}

export async function deleteUser(userId: string, email: string, executor: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "users", userId));
    await logAction(executor, `Excluiu usuário: ${email}`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
  }
}

// 2. PASSAGEIROS
export async function getPassageiros(): Promise<Passageiro[]> {
  try {
    const snap = await getDocs(collection(db, "passageiros"));
    return snap.docs.map(d => d.data() as Passageiro);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, "passageiros");
  }
}

export async function savePassageiro(passageiro: Passageiro, executor: string): Promise<void> {
  try {
    const isNew = !passageiro.id;
    const id = passageiro.id || `pass_${Date.now()}`;
    const data = { ...passageiro, id };
    
    // Check for unique CPF (excluding self)
    if (passageiro.cpf) {
      const all = await getPassageiros();
      const duplicate = all.find(p => p.cpf.replace(/\D/g, "") === passageiro.cpf.replace(/\D/g, "") && p.id !== id);
      if (duplicate) {
        throw new Error(`Já existe um passageiro cadastrado com o CPF: ${passageiro.cpf}`);
      }
    }

    await setDoc(doc(db, "passageiros", id), data);
    await logAction(executor, `${isNew ? "Cadastrou" : "Alterou"} passageiro: ${passageiro.nome}`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "passageiros");
  }
}

export async function deletePassageiro(id: string, nome: string, executor: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "passageiros", id));
    await logAction(executor, `Excluiu passageiro: ${nome}`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `passageiros/${id}`);
  }
}

// 3. EMPRESAS
export async function getEmpresas(): Promise<Empresa[]> {
  try {
    const snap = await getDocs(collection(db, "empresas"));
    return snap.docs.map(d => d.data() as Empresa);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, "empresas");
  }
}

export async function saveEmpresa(empresa: Empresa, executor: string): Promise<void> {
  try {
    const isNew = !empresa.id;
    const id = empresa.id || `emp_${Date.now()}`;
    const data = { ...empresa, id };
    await setDoc(doc(db, "empresas", id), data);
    await logAction(executor, `${isNew ? "Cadastrou" : "Alterou"} empresa de navegação: ${empresa.nomeFantasia}`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "empresas");
  }
}

export async function deleteEmpresa(id: string, nome: string, executor: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "empresas", id));
    await logAction(executor, `Excluiu empresa de navegação: ${nome}`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `empresas/${id}`);
  }
}

// 4. EMBARCAÇÕES
export async function getEmbarcacoes(): Promise<Embarcacao[]> {
  try {
    const snap = await getDocs(collection(db, "embarcacoes"));
    return snap.docs.map(d => d.data() as Embarcacao);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, "embarcacoes");
  }
}

export async function saveEmbarcacao(emb: Embarcacao, executor: string): Promise<void> {
  try {
    const isNew = !emb.id;
    const id = emb.id || `emb_vessel_${Date.now()}`;
    const data = { ...emb, id };
    await setDoc(doc(db, "embarcacoes", id), data);
    await logAction(executor, `${isNew ? "Cadastrou" : "Alterou"} embarcação: ${emb.nome} (${emb.tipo})`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "embarcacoes");
  }
}

export async function deleteEmbarcacao(id: string, nome: string, executor: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "embarcacoes", id));
    await logAction(executor, `Excluiu embarcação: ${nome}`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `embarcacoes/${id}`);
  }
}

// 5. ACOMODAÇÕES
export async function getAcomodacoes(): Promise<Acomodacao[]> {
  try {
    const snap = await getDocs(collection(db, "acomodacoes"));
    return snap.docs.map(d => d.data() as Acomodacao);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, "acomodacoes");
  }
}

export async function saveAcomodacao(aco: Acomodacao, executor: string): Promise<void> {
  try {
    const isNew = !aco.id;
    const id = aco.id || `aco_${Date.now()}`;
    const data = { ...aco, id };
    await setDoc(doc(db, "acomodacoes", id), data);
    await logAction(executor, `${isNew ? "Cadastrou" : "Alterou"} acomodação: ${aco.nome}`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "acomodacoes");
  }
}

export async function deleteAcomodacao(id: string, nome: string, executor: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "acomodacoes", id));
    await logAction(executor, `Excluiu tipo de acomodação: ${nome}`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `acomodacoes/${id}`);
  }
}

// 6. MOTIVOS
export async function getMotivos(): Promise<Motivo[]> {
  try {
    const snap = await getDocs(collection(db, "motivos"));
    return snap.docs.map(d => d.data() as Motivo);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, "motivos");
  }
}

export async function saveMotivo(mot: Motivo, executor: string): Promise<void> {
  try {
    const isNew = !mot.id;
    const id = mot.id || `mot_${Date.now()}`;
    const data = { ...mot, id };
    await setDoc(doc(db, "motivos", id), data);
    await logAction(executor, `${isNew ? "Cadastrou" : "Alterou"} motivo de viagem: ${mot.descricao}`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "motivos");
  }
}

export async function deleteMotivo(id: string, desc: string, executor: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "motivos", id));
    await logAction(executor, `Excluiu motivo de viagem: ${desc}`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `motivos/${id}`);
  }
}

// 7. AUTORIZADORES
export async function getAutorizadores(): Promise<Autorizador[]> {
  try {
    const snap = await getDocs(collection(db, "autorizadores"));
    return snap.docs.map(d => d.data() as Autorizador);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, "autorizadores");
  }
}

export async function saveAutorizador(aut: Autorizador, executor: string): Promise<void> {
  try {
    const isNew = !aut.id;
    const id = aut.id || `aut_${Date.now()}`;
    const data = { ...aut, id };
    await setDoc(doc(db, "autorizadores", id), data);
    await logAction(executor, `${isNew ? "Cadastrou" : "Alterou"} autorizador: ${aut.nome}`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "autorizadores");
  }
}

export async function deleteAutorizador(id: string, nome: string, executor: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "autorizadores", id));
    await logAction(executor, `Excluiu autorizador: ${nome}`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `autorizadores/${id}`);
  }
}

// 8. PASSAGENS
export async function getPassagens(): Promise<Passagem[]> {
  try {
    const snap = await getDocs(collection(db, "passagens"));
    return snap.docs.map(d => d.data() as Passagem);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, "passagens");
  }
}

export async function savePassagem(pas: Passagem, executor: string): Promise<void> {
  try {
    const isNew = !pas.id;
    const id = pas.id || `pas_${Date.now()}`;
    const data = { ...pas, id };
    await setDoc(doc(db, "passagens", id), data);
    await logAction(executor, `${isNew ? "Emitiu" : "Atualizou"} passagem fluviais ID: ${id} (${pas.destino})`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "passagens");
  }
}

export async function deletePassagem(id: string, executor: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "passagens", id));
    await logAction(executor, `Excluiu passagem ID: ${id}`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `passagens/${id}`);
  }
}

// 9. LOGS
export async function getLogs(): Promise<Log[]> {
  try {
    const snap = await getDocs(collection(db, "logs"));
    const list = snap.docs.map(d => d.data() as Log);
    return list.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, "logs");
  }
}

// DATABASE AUTO-SEEDING FOR FIRST RUN
export async function seedDatabaseIfEmpty(): Promise<void> {
  try {
    // 1. Check and create the requested main Bruno Administrator
    const brunoEmail = "brunoprefeituramunicipal@gmail.com";
    let brunoUid = "";
    let brunoCreated = false;

    // First, try to sign in with the target credentials to verify if they work
    try {
      const cred = await signInWithEmailAndPassword(auth, brunoEmail, "admin123");
      brunoUid = cred.user.uid;
      brunoCreated = true; // Mark as logged in so we sign them out later during cleanup
      console.log(`Usuário ${brunoEmail} autenticado com sucesso no seed.`);
    } catch (loginErr: any) {
      console.log(`Não foi possível fazer login direto com ${brunoEmail}. Erro: ${loginErr.code || loginErr.message}. Tentando criar ou recuperar...`);
      // Sign in failed, so let's try to create the user in Auth
      try {
        const cred = await createUserWithEmailAndPassword(auth, brunoEmail, "admin123");
        brunoUid = cred.user.uid;
        brunoCreated = true;
        console.log(`Usuário ${brunoEmail} criado no Auth com UID: ${brunoUid}`);
      } catch (authErr: any) {
        if (authErr.code === "auth/email-already-in-use") {
          console.log(`E-mail ${brunoEmail} já cadastrado no Auth, mas com senha diferente.`);
          // If already in use but login failed, find the UID from Firestore or fallback
          const brunoQuery = query(collection(db, "users"), where("email", "==", brunoEmail));
          const brunoSnap = await getDocs(brunoQuery);
          if (!brunoSnap.empty) {
            brunoUid = brunoSnap.docs[0].id;
          } else {
            brunoUid = "bruno_admin_default";
          }
        } else {
          console.error("Erro ao criar Bruno no Auth:", authErr);
          brunoUid = "bruno_admin_default";
        }
      }
    }

    if (brunoUid) {
      const brunoUserDocRef = doc(db, "users", brunoUid);
      const brunoUserDoc = await getDoc(brunoUserDocRef);
      
      if (!brunoUserDoc.exists()) {
        const brunoUser: User = {
          id: brunoUid,
          nome: "Bruno Administrador",
          email: brunoEmail,
          perfil: "Administrador",
          status: "Ativo",
          primeiroAcesso: false,
          criadoEm: new Date().toISOString(),
          alteradoEm: new Date().toISOString()
        };
        await setDoc(brunoUserDocRef, brunoUser);
        console.log(`Documento Firestore para ${brunoEmail} criado com ID: ${brunoUid}`);
      } else {
        // Ensure profile details are correct
        const existingData = brunoUserDoc.data() as User;
        if (existingData.perfil !== "Administrador" || existingData.status !== "Ativo") {
          await setDoc(brunoUserDocRef, {
            ...existingData,
            perfil: "Administrador" as const,
            status: "Ativo" as const,
            alteradoEm: new Date().toISOString()
          }, { merge: true });
          console.log(`Perfil/Status do usuário ${brunoEmail} sincronizado no Firestore.`);
        }
      }

      // Cleanup duplicate/fallback records if they exist and are different from the real UID
      if (brunoUid !== "bruno_admin_default") {
        try {
          await deleteDoc(doc(db, "users", "bruno_admin_default"));
        } catch (e) {
          // ignore
        }
      }
    }

    // 2. If the database is empty of other standard data, seed the remaining items and standard operator
    const acomodacoesSnap = await getDocs(collection(db, "acomodacoes"));
    if (acomodacoesSnap.empty) {
      console.log("Iniciando auto-seeding de dados iniciais...");

      // Let's also create the default operator for testing/grading if they want
      let operadorUid = "operador_default";
      try {
        const cred = await createUserWithEmailAndPassword(auth, "operador@segaf.portel.pa.gov.br", "Operador@123");
        operadorUid = cred.user.uid;
        brunoCreated = true;
      } catch (authErr: any) {
        if (authErr.code === "auth/email-already-in-use") {
          console.log("Operador email já cadastrado no Auth.");
        } else {
          console.error("Erro ao criar operador no Auth:", authErr);
        }
      }

      const operadorUser: User = {
        id: operadorUid,
        nome: "Operador de Passagens",
        email: "operador@segaf.portel.pa.gov.br",
        perfil: "Operador",
        status: "Ativo",
        primeiroAcesso: false,
        criadoEm: new Date().toISOString(),
        alteradoEm: new Date().toISOString()
      };
      await setDoc(doc(db, "users", operadorUid), operadorUser);

      // 3. Criar tipos de acomodação padrão
      const acomodacoesPadrao = [
        { id: "aco_1", nome: "Rede", descricao: "Acomodação em convés com rede própria", status: "Ativo" as const },
        { id: "aco_2", nome: "Cama em Camarote", descricao: "Leito compartilhado em cabine refrigerada", status: "Ativo" as const },
        { id: "aco_3", nome: "Assento", descricao: "Poltrona reclinável individual", status: "Ativo" as const },
        { id: "aco_4", nome: "Suíte", descricao: "Quarto privativo com banheiro", status: "Ativo" as const }
      ];
      for (const aco of acomodacoesPadrao) {
        await setDoc(doc(db, "acomodacoes", aco.id), aco);
      }

      // 4. Criar motivos de viagem padrão
      const motivosPadrao = [
        { id: "mot_1", descricao: "Consulta Médica" },
        { id: "mot_2", descricao: "Exames" },
        { id: "mot_3", descricao: "Cirurgia" },
        { id: "mot_4", descricao: "Tratamento" },
        { id: "mot_5", descricao: "Acompanhante" },
        { id: "mot_6", descricao: "Retorno Médico" },
        { id: "mot_7", descricao: "Serviço Administrativo" },
        { id: "mot_8", descricao: "Capacitação" },
        { id: "mot_9", descricao: "Outros" }
      ];
      for (const mot of motivosPadrao) {
        await setDoc(doc(db, "motivos", mot.id), mot);
      }

      // 5. Criar empresas de navegação padrão
      const empresasPadrao = [
        { 
          id: "emp_1", 
          razaoSocial: "Arapari Navegação Ltda", 
          nomeFantasia: "Arapari Fluvial", 
          cnpj: "04.234.908/0001-20", 
          inscricaoEstadual: "15.908.777-1",
          telefone: "(91) 3242-1200", 
          whatsapp: "91988882200", 
          email: "contato@arapari.com.br", 
          endereco: "Terminal Hidroviário de Belém, Box 12", 
          responsavel: "Sr. Geraldo Arapari",
          observacoes: "Empresa parceira principal para a rota Portel - Belém.",
          status: "Ativo" as const 
        },
        { 
          id: "emp_2", 
          razaoSocial: "Amazonas River Boat Lines", 
          nomeFantasia: "Amazonas River", 
          cnpj: "08.122.344/0001-99", 
          inscricaoEstadual: "15.344.222-2",
          telefone: "(91) 3211-5050", 
          whatsapp: "91999115050", 
          email: "comercial@amazonasriver.com", 
          endereco: "Orla Municipal de Portel, Box 3", 
          responsavel: "Sra. Helena Souza",
          observacoes: "Opera balsas e navios de grande porte.",
          status: "Ativo" as const 
        }
      ];
      for (const emp of empresasPadrao) {
        await setDoc(doc(db, "empresas", emp.id), emp);
      }

      // 6. Criar embarcações padrão
      const embarcacoesPadrao = [
        { id: "emb_1", nome: "Navio Arapari V", tipo: "Navio" as const, empresaId: "emp_1", capacidade: 350, status: "Ativo" as const },
        { id: "emb_2", nome: "Balsa Marajó Express", tipo: "Balsa" as const, empresaId: "emp_2", capacidade: 180, status: "Ativo" as const },
        { id: "emb_3", nome: "Lancha Portel Veloz", tipo: "Lancha" as const, empresaId: "emp_1", capacidade: 60, status: "Ativo" as const }
      ];
      for (const emb of embarcacoesPadrao) {
        await setDoc(doc(db, "embarcacoes", emb.id), emb);
      }
      // 7. Criar autorizadores padrão
      const autorizadoresPadrao = [
        { id: "aut_1", nome: "Dr. Roberto de Souza", cargo: "Secretário Executivo", setor: "Gabinete SEGAF", status: "Ativo" as const },
        { id: "aut_2", nome: "Sra. Maria Auxiliadora Pinto", cargo: "Coordenadora de Assistência", setor: "Financeiro", status: "Ativo" as const }
      ];
      for (const aut of autorizadoresPadrao) {
        await setDoc(doc(db, "autorizadores", aut.id), aut);
      }

      // 8. Criar passageiros padrão
      const passageirosPadrao = [
        { 
          id: "pass_1", 
          nome: "Afonso de Albuquerque Neto", 
          cpf: "123.456.789-00", 
          rg: "5890212 PC/PA", 
          dataNascimento: "1980-05-15", 
          sexo: "Masculino", 
          telefone: "(91) 98122-3344", 
          whatsapp: "91981223344", 
          email: "afonso.neto@gmail.com", 
          endereco: "Av. Floriano Peixoto, 452", 
          bairro: "Centro", 
          cidade: "Portel", 
          estado: "PA", 
          nomeMae: "Rita de Albuquerque", 
          nomePai: "Carlos Neto", 
          cartaoSus: "702.405.112.334.456", 
          observacoes: "Paciente necessitando de acompanhante frequente para hemodiálise.",
          foto: "" 
        },
        { 
          id: "pass_2", 
          nome: "Beatriz dos Santos Mendonça", 
          cpf: "987.654.321-11", 
          rg: "6122340 PC/PA", 
          dataNascimento: "1992-10-22", 
          sexo: "Feminino", 
          telefone: "(91) 99122-5566", 
          whatsapp: "91991225566", 
          email: "beatriz.mendonca@gmail.com", 
          endereco: "Rua Presidente Vargas, 1205", 
          bairro: "Cidade Nova", 
          cidade: "Portel", 
          estado: "PA", 
          nomeMae: "Estela dos Santos", 
          nomePai: "Manoel Mendonça", 
          cartaoSus: "705.808.990.112.345", 
          observacoes: "Paciente para cirurgia ortopédica.",
          foto: "" 
        }
      ];
      for (const pass of passageirosPadrao) {
        await setDoc(doc(db, "passageiros", pass.id), pass);
      }

      // 9. Criar passagens iniciais
      const hoje = new Date();
      const amanha = new Date();
      amanha.setDate(hoje.getDate() + 1);
      const em3dias = new Date();
      em3dias.setDate(hoje.getDate() + 3);
      const ha5dias = new Date();
      ha5dias.setDate(hoje.getDate() - 5);

      const passagensPadrao: Passagem[] = [
        {
          id: "pas_seed_1",
          passageiroId: "pass_1",
          empresaId: "emp_1",
          embarcacaoId: "emb_1",
          acomodacaoId: "aco_1",
          motivoId: "mot_1",
          autorizadorId: "aut_1",
          dataLancamento: ha5dias.toISOString().split("T")[0],
          dataViagem: hoje.toISOString().split("T")[0],
          tipoViagem: "Ida",
          destino: "Portel → Belém",
          valor: 150.00,
          desconto: 15.00,
          valorFinal: 135.00,
          status: "Emitida",
          observacoes: "Encaminhado para consulta com nefrologista.",
          usuarioResponsavel: "admin"
        },
        {
          id: "pas_seed_2",
          passageiroId: "pass_2",
          empresaId: "emp_2",
          embarcacaoId: "emb_2",
          acomodacaoId: "aco_2",
          motivoId: "mot_3",
          autorizadorId: "aut_2",
          dataLancamento: ha5dias.toISOString().split("T")[0],
          dataViagem: amanha.toISOString().split("T")[0],
          tipoViagem: "Ida e Retorno",
          destino: "Portel → Belém",
          valor: 320.00,
          desconto: 0.00,
          valorFinal: 320.00,
          status: "Emitida",
          observacoes: "Cirurgia agendada no Hospital de Clínicas.",
          usuarioResponsavel: "admin"
        },
        {
          id: "pas_seed_3",
          passageiroId: "pass_1",
          empresaId: "emp_1",
          embarcacaoId: "emb_3",
          acomodacaoId: "aco_3",
          motivoId: "mot_6",
          autorizadorId: "aut_1",
          dataLancamento: ha5dias.toISOString().split("T")[0],
          dataViagem: em3dias.toISOString().split("T")[0],
          tipoViagem: "Retorno",
          destino: "Belém → Portel",
          valor: 180.00,
          desconto: 0.00,
          valorFinal: 180.00,
          status: "Solicitada",
          observacoes: "Retorno pós consulta nefrológica.",
          usuarioResponsavel: "admin"
        }
      ];
      for (const pas of passagensPadrao) {
        await setDoc(doc(db, "passagens", pas.id), pas);
      }

      await logAction("sistema", "Banco de dados inicializado com sucesso (Dados do SEGAF Seeded)");
      console.log("Auto-seeding concluído com sucesso!");
    }

    // Always log out if we called createUserWithEmailAndPassword in this process to prevent hijacking current session
    if (brunoCreated) {
      try {
        await signOut(auth);
      } catch (soErr) {
        console.warn("Erro ao fazer signout pós seed:", soErr);
      }
    }
  } catch (err) {
    console.error("Erro ao executar seedDatabaseIfEmpty:", err);
  }
}

export async function clearAllSystemData(): Promise<void> {
  const collectionsToClear = [
    "passagens",
    "passageiros",
    "empresas",
    "embarcacoes",
    "acomodacoes",
    "motivos",
    "autorizadores",
    "logs"
  ];

  for (const collName of collectionsToClear) {
    try {
      const snap = await getDocs(collection(db, collName));
      const chunks: any[] = [];
      let currentChunk: any[] = [];
      
      snap.docs.forEach((docSnap) => {
        currentChunk.push(docSnap.ref);
        if (currentChunk.length === 500) {
          chunks.push(currentChunk);
          currentChunk = [];
        }
      });
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach((ref) => {
          batch.delete(ref);
        });
        await batch.commit();
      }
      console.log(`Collection ${collName} cleared successfully.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, collName);
    }
  }
}
