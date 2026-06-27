import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Server-side Gemini intelligence endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, contextData } = req.body;
    if (!message) {
      res.status(400).json({ error: "Mensagem é obrigatória." });
      return;
    }

    // Build grounding context from actual database state sent securely from client
    const contextStr = contextData 
      ? `\nCONTEXTO DO SISTEMA (DADOS REAIS DO FIRESTORE):\n${JSON.stringify(contextData, null, 2)}`
      : "";

    const systemInstruction = `Você é o assistente inteligente da SEGAF (Secretaria de Gestão Administrativa e Financeira - Prefeitura Municipal de Portel).
Seu objetivo é auxiliar os operadores e administradores a entenderem os dados de passagens fluviais e marítimas.

Regras de comportamento:
1. Responda de forma clara, amigável e profissional.
2. Utilize os dados reais fornecidos no CONTEXTO DO SISTEMA para responder dúvidas sobre gastos, viagens, destinos, empresas e passageiros.
3. Se o usuário perguntar sobre gastos deste mês, viagens hoje, viagens amanhã ou empresas mais utilizadas, calcule os valores com base no contexto fornecido.
4. Sugira oportunidades de economia de custos com base nas empresas que cobram mais caro ou destinos mais caros.
5. Se os dados necessários não estiverem no contexto, informe educadamente que precisa de mais dados ou que o registro correspondente não foi encontrado.
6. Nunca invente dados que não existem no contexto real de passagens. Use sempre os dados fornecidos.`;

    // Enforce a 15-second timeout on the Gemini API call to guarantee responsiveness
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout de conexão: O motor do Gemini demorou muito para responder. Tente novamente.")), 15000)
    );

    const apiCallPromise = ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { text: message + contextStr }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const response = await Promise.race([apiCallPromise, timeoutPromise]) as any;

    const responseText = response.text || "Desculpe, não consegui processar sua solicitação.";
    res.json({ text: responseText });
  } catch (error: any) {
    console.error("Erro no chat inteligente:", error);
    res.status(500).json({ error: error?.message || "Erro interno do servidor ao consultar o Gemini." });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
