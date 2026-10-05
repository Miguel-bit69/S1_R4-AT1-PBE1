import express from "express";
import type { Express, Request, Response } from "express";
import fs from "fs";
import { z } from "zod";

const PORT: number = 8081;
const app: Express = express();

const DIR = "./dados";
const FILE = `${DIR}/chamados.json`;

if (!fs.existsSync(DIR)) {
  fs.mkdirSync(DIR, { recursive: true });
}

if (!fs.existsSync(FILE)) {
  fs.writeFileSync(FILE, "[]", "utf-8");
}

app.use(express.json());

type Chamado = {
  id: number;
  nomeCliente: string;
  equipamento: string;
  descricaoProblema: string;
  prioridade: "Baixa" | "Média" | "Alta";
  status: "Aberto" | "Em atendimento" | "Concluído";
};

app.get("/chamados", (req: Request, res: Response) => {
  try {
    const data: string = fs.readFileSync(FILE, "utf-8");
    let chamados: Chamado[] = JSON.parse(data);

    const { status, prioridade, cliente, equipamento } = req.query;

    if (status) {
      chamados = chamados.filter(
        (item) => item.status.toLowerCase() === String(status).toLowerCase()
      );
    }

    if (prioridade) {
      chamados = chamados.filter(
        (item) => item.prioridade.toLowerCase() === String(prioridade).toLowerCase()
      );
    }

    if (cliente) {
      chamados = chamados.filter((item) =>
        item.nomeCliente.toLowerCase().includes(String(cliente).toLowerCase())
      );
    }

    if (equipamento) {
      chamados = chamados.filter((item) =>
        item.equipamento.toLowerCase().includes(String(equipamento).toLowerCase())
      );
    }

    res.status(200).json(chamados);
  } catch (error) {
    console.error("Erro ao buscar chamados:", error);
    res.status(500).json({
      erro: "Erro interno no servidor ao tentar buscar chamados!",
    });
  }
});

app.get("/chamados/:id", (req: Request, res: Response) => {
  try {
    const data: string = fs.readFileSync(FILE, "utf-8");
    const chamados: Chamado[] = JSON.parse(data);

    const id: number = Number(req.params.id);
    const chamado = chamados.find((item: Chamado) => item.id === id);

    if (!chamado) {
      return res.status(404).json({
        erro: "Chamado não encontrado.",
      });
    }

    res.status(200).json(chamado);
  } catch (error) {
    console.error("Erro ao buscar chamado:", error);
    res.status(500).json({
      erro: "Erro interno no servidor ao tentar buscar chamados!",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});