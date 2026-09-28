import express from "express";
import type { Express, Request, Response } from "express";
import fs from "fs";
import crypto from "crypto";
import { z } from "zod";

const PORT: number = 8081;
const app: Express = express();

const DIR = "./dados";
const FILE = `${DIR}/produtos.json`;

if (!fs.existsSync(DIR)) {
    fs.mkdirSync(DIR, { recursive: true });
}

if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, "[]", "utf-8");
}

//middleware para interpretar JSON no corpo da requisição
app.use(express.json());

const createProdutoSchema = z.object({
    nomeProduto: z.string().min(3),
    precoProduto: z.coerce.number().positive()
});

type Produto = {
    id: string, // UUID -> string
    nome: string,
    preco: number
}

app.post("/produtos", (req: Request, res: Response) => {
    try {
        const { nomeProduto, precoProduto } = createProdutoSchema.parse(req.body);

        const data: string = fs.readFileSync(FILE, "utf-8");
        let produtos: Produto[] = JSON.parse(data);

        let NovoProduto: Produto = {
            id: crypto.randomUUID(),
            nome: nomeProduto,
            preco: precoProduto
        };

        produtos.push(NovoProduto);

        fs.writeFileSync(FILE, JSON.stringify(produtos, null, 4), "utf-8");

        res.status(201).json({
            message: `Produto ${nomeProduto} - R$ ${precoProduto} foi criado com sucesso!`
        });

    } catch (error) {

        if (error instanceof z.ZodError) {
            return res.status(400).json({
                erro: "Os parâmetros enviados são inválidos."
            });
        }

        console.error("erro ao salvar produto:", error);
        res.status(500).json({
            erro: "Erro interno no servidor ao cadastrar produto."
        });

    }
});

app.listen(PORT, () => {
    console.log(`servidor rodando em http://localhost:${PORT}`);
});