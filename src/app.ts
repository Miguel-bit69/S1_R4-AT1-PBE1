import express from "express";
import type { Express, Request, Response } from "express";
import fs from "fs";
import { z } from "zod";

const PORT: number = 8081;
const app: Express = express();

const DIR = "./dados";
const FILE = `${DIR}/chamados.json`;

// Garante a existência do diretório e do arquivo JSON inicial
if (!fs.existsSync(DIR)) {
    fs.mkdirSync(DIR, { recursive: true });
}

if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, "[]", "utf-8");
}

// Middleware para parsing de JSON
app.use(express.json());

// Modelo de dados
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
        const chamados: Chamado[] = JSON.parse(data);
        res.status(200).json(chamados);
    } catch (error) {
        console.error("Erro ao buscar chamados:", error);
        res.status(500).json({
            erro: "Erro interno no servidor ao buscar chamados."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});