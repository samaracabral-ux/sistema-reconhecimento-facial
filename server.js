


const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Configuração de comunicação com o Live Server
app.use((req, res, next) => {
    const origin = req.headers.origin;

    const allowedOrigins = [
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ];

    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
    }

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, DELETE, OPTIONS"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

// Receber JSON com fotos em Base64
app.use(express.json({ limit: "20mb" }));

// Local dos arquivos de dados
const databaseDir = path.join(__dirname, "database");
const databaseFile = path.join(databaseDir, "pessoas.json");
const usuariosFile = path.join(databaseDir, "usuarios.json");

// Criar a pasta e os arquivos se necessário
if (!fs.existsSync(databaseDir)) {
    fs.mkdirSync(databaseDir, { recursive: true });
}

if (!fs.existsSync(databaseFile)) {
    fs.writeFileSync(databaseFile, "[]", "utf8");
}

if (!fs.existsSync(usuariosFile)) {
    fs.writeFileSync(
        usuariosFile,
        JSON.stringify([
            {
                usuario: "admin",
                senha: "1234",
                nome: "Administrador"
            }
        ], null, 2),
        "utf8"
    );
}

function lerArquivoJson(caminho, nome) {
    const conteudo = fs.readFileSync(caminho, "utf8");
    const dados = JSON.parse(conteudo);
    if (!Array.isArray(dados)) {
        throw new Error(`O arquivo ${nome} não contém uma lista válida.`);
    }
    return dados;
}

function escreverArquivoJson(caminho, dados) {
    const temporario = caminho + ".tmp";
    fs.writeFileSync(temporario, JSON.stringify(dados, null, 2), "utf8");
    fs.renameSync(temporario, caminho);
}

// Ler os cadastros
function lerPessoas() {
    return lerArquivoJson(databaseFile, "cadastros");
}

// Salvar os cadastros
function salvarPessoas(pessoas) {
    escreverArquivoJson(databaseFile, pessoas);
}

// Ler usuários
function lerUsuarios() {
    return lerArquivoJson(usuariosFile, "usuários");
}

// Servir arquivos estáticos do sistema
app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Consultar usuários
app.get("/api/usuarios", (req, res) => {
    try {
        const usuarios = lerUsuarios();
        res.status(200).json(usuarios);
    } catch (error) {
        console.error("Erro ao consultar usuários:", error);
        res.status(500).json({
            erro: "Não foi possível consultar os usuários."
        });
    }
});

app.post("/api/login", (req, res) => {
    try {
        const { usuario = "", senha = "" } = req.body || {};
        const usuarios = lerUsuarios();
        const usuarioEncontrado = usuarios.find(
            item =>
                String(item.usuario).trim().toLowerCase() ===
                    String(usuario).trim().toLowerCase() &&
                String(item.senha) === String(senha)
        );

        if (!usuarioEncontrado) {
            return res.status(401).json({
                erro: "Usuário ou senha inválidos."
            });
        }

        return res.status(200).json({
            sucesso: true,
            nome: usuarioEncontrado.nome || usuarioEncontrado.usuario,
            usuario: usuarioEncontrado.usuario
        });
    } catch (error) {
        console.error("Erro ao autenticar usuário:", error);
        return res.status(500).json({
            erro: "Não foi possível autenticar o usuário."
        });
    }
});

// Consultar pessoas
app.get("/api/pessoas", (req, res) => {
    try {
        const pessoas = lerPessoas();
        res.status(200).json(pessoas);
    } catch (error) {
        console.error("Erro ao consultar pessoas:", error);
        res.status(500).json({
            erro: "Não foi possível consultar os cadastros."
        });
    }
});

// Cadastrar pessoa
app.post("/api/pessoas", (req, res) => {
    try {
        const dados = req.body || {};

        const nome = String(dados.nome || "").trim();
        const identificador = String(
            dados.identificador || ""
        ).trim();
        const setor = String(dados.setor || "").trim();
        const cargo = String(dados.cargo || "").trim();
        const foto = dados.foto;
        const descritor = dados.descritor;

        // Validar campos
        if (!nome || !identificador) {
            return res.status(400).json({
                erro: "Nome e identificador são obrigatórios."
            });
        }

        if (
            typeof foto !== "string" ||
            !/^data:image\/(jpeg|jpg|png|webp);base64,/.test(foto)
        ) {
            return res.status(400).json({
                erro: "A foto enviada é inválida."
            });
        }

        if (
            !Array.isArray(descritor) ||
            descritor.length !== 128 ||
            !descritor.every(
                valor =>
                    typeof valor === "number" &&
                    Number.isFinite(valor)
            )
        ) {
            return res.status(400).json({
                erro: "Descritor facial inválido."
            });
        }

        const pessoas = lerPessoas();

        // Verificar identificador duplicado
        const existe = pessoas.some(
            pessoa =>
                String(pessoa.identificador).trim() === identificador
        );

        if (existe) {
            return res.status(409).json({
                erro: "Este identificador já está cadastrado."
            });
        }

        // Criar cadastro
        const novaPessoa = {
            id: Date.now().toString(),
            nome,
            identificador,
            setor,
            cargo,
            foto,
            descritor,
            criadoEm: new Date().toISOString()
        };

        pessoas.push(novaPessoa);
        salvarPessoas(pessoas);

        return res.status(201).json({
            sucesso: true,
            mensagem: "Cadastro realizado com sucesso.",
            pessoa: {
                id: novaPessoa.id,
                nome: novaPessoa.nome,
                identificador: novaPessoa.identificador
            }
        });
    } catch (error) {
        console.error("Erro ao cadastrar pessoa:", error);

        return res.status(500).json({
            erro: "Erro interno ao salvar o cadastro."
        });
    }
});

// Excluir cadastro pelo identificador
app.delete("/api/pessoas/:identificador", (req, res) => {
    try {
        const identificador = req.params.identificador;
        const pessoas = lerPessoas();

        const atualizadas = pessoas.filter(
            pessoa =>
                String(pessoa.identificador) !== identificador
        );

        if (atualizadas.length === pessoas.length) {
            return res.status(404).json({
                erro: "Pessoa não encontrada."
            });
        }

        salvarPessoas(atualizadas);

        return res.status(200).json({
            sucesso: true,
            mensagem: "Cadastro excluído com sucesso."
        });
    } catch (error) {
        console.error("Erro ao excluir pessoa:", error);

        return res.status(500).json({
            erro: "Não foi possível excluir o cadastro."
        });
    }
});

// Responder a erros de JSON inválido ou corpo muito grande
app.use((error, req, res, next) => {
    if (error.type === "entity.too.large") {
        return res.status(413).json({
            erro: "A imagem enviada é muito grande."
        });
    }

    if (error instanceof SyntaxError && error.status === 400) {
        return res.status(400).json({
            erro: "Os dados enviados estão em formato JSON inválido."
        });
    }

    console.error("Erro no servidor:", error);

    return res.status(500).json({
        erro: "Erro interno no servidor."
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`FaceID disponível em http://localhost:${PORT}`);
});
