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

// Função auxiliar para remover acentos na busca
const normalizar = (texto: string) =>
    texto
        .normalize("NFD")
        .toLowerCase();

app.get("/chamados", (req: Request, res: Response) => {
    try {
        const data: string = fs.readFileSync(FILE, "utf-8");
        let chamados: Chamado[] = JSON.parse(data);

        const { status, prioridade, cliente, equipamento } = req.query;

        if (status) {
            chamados = chamados.filter(
                (item) => normalizar(item.status) === normalizar(String(status))
            );
        }

        if (prioridade) {
            chamados = chamados.filter(
                (item) => normalizar(item.prioridade) === normalizar(String(prioridade))
            );
        }

        if (cliente) {
            chamados = chamados.filter((item) =>
                normalizar(item.nomeCliente).includes(normalizar(String(cliente)))
            );
        }

        if (equipamento) {
            chamados = chamados.filter((item) =>
                normalizar(item.equipamento).includes(normalizar(String(equipamento)))
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

        if (isNaN(id)) {
            return res.status(400).json({ erro: "ID informado é inválido." });
        }

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
            erro: "Erro interno no servidor ao tentar buscar chamado!",
        });
    }
});

const createChamadoSchema = z.object({
    nomeCliente: z
        .string()
        .min(3, "O nome deve ter pelo menos 3 caracteres")
        .max(100, "O nome deve ter no máximo 100 caracteres"),

    equipamento: z
        .string()
        .min(2, "O equipamento deve ter pelo menos 2 caracteres")
        .max(100, "O equipamento deve ter no máximo 100 caracteres"),

    descricaoProblema: z
        .string()
        .min(10, "A descrição deve ter pelo menos 10 caracteres")
        .max(500, "A descrição deve ter no máximo 500 caracteres"),

    prioridade: z.enum(["Baixa", "Média", "Alta"]),

    status: z
        .enum(["Aberto", "Em atendimento", "Concluído"])
        .default("Aberto") 
});

app.post("/chamados", (req: Request, res: Response) => {
    try {
        const dados = createChamadoSchema.parse(req.body);

        const data: string = fs.readFileSync(FILE, "utf-8");
        const chamados: Chamado[] = JSON.parse(data);

       
        const novoId: number =
            chamados.reduce((max, item) => Math.max(max, item.id), 0) + 1;

        const novoChamado: Chamado = {
            id: novoId,
            ...dados
        };

        chamados.push(novoChamado);

        fs.writeFileSync(
            FILE,
            JSON.stringify(chamados, null, 4),
            "utf-8"
        );

        res.status(201).json(novoChamado);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                erro: "Os parâmetros enviados são inválidos.",
                detalhes: error.issues
            });
        }

        console.error("Erro ao salvar chamado:", error);
        res.status(500).json({
            erro: "Erro interno no servidor ao cadastrar chamado."
        });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});