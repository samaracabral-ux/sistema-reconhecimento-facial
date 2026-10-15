<?php
require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $conn = openDatabase();
    $result = $conn->query('SELECT * FROM pessoas ORDER BY criadoEm DESC');
    $lista = [];

    while ($row = $result->fetch_assoc()) {
        $lista[] = [
            'id' => $row['id'],
            'nome' => $row['nome'],
            'identificador' => $row['identificador'],
            'setor' => $row['setor'],
            'cargo' => $row['cargo'],
            'foto' => $row['foto'],
            'descritor' => json_decode($row['descritor'], true) ?: [],
            'criadoEm' => $row['criadoEm']
        ];
    }

    jsonResponse(200, $lista);
}

if ($method === 'POST') {
    $dados = readJsonBody();
    $nome = trim((string)($dados['nome'] ?? ''));
    $identificador = trim((string)($dados['identificador'] ?? ''));
    $setor = trim((string)($dados['setor'] ?? ''));
    $cargo = trim((string)($dados['cargo'] ?? ''));
    $foto = $dados['foto'] ?? null;
    $descritor = $dados['descritor'] ?? null;

    if ($nome === '' || $identificador === '') {
        jsonResponse(400, ['erro' => 'Nome e identificador são obrigatórios.']);
    }

    if (!is_string($foto) || !preg_match('/^data:image\/(jpeg|jpg|png|webp);base64,/', $foto)) {
        jsonResponse(400, ['erro' => 'A foto enviada é inválida.']);
    }

    if (!is_array($descritor) || count($descritor) !== 128 || array_reduce($descritor, static fn($carry, $valor) => $carry && is_numeric($valor), true) === false) {
        jsonResponse(400, ['erro' => 'Descritor facial inválido.']);
    }

    $conn = openDatabase();
    $verifica = $conn->prepare('SELECT id FROM pessoas WHERE identificador = ? LIMIT 1');
    $verifica->bind_param('s', $identificador);
    $verifica->execute();
    $existe = $verifica->get_result()->fetch_assoc();

    if ($existe) {
        jsonResponse(409, ['erro' => 'Este identificador já está cadastrado.']);
    }

    $id = (string) bin2hex(random_bytes(8));
    $descritorJson = json_encode(array_map('floatval', $descritor), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    $stmt = $conn->prepare('INSERT INTO pessoas (id, nome, identificador, setor, cargo, foto, descritor, criadoEm) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())');
    $stmt->bind_param('sssssss', $id, $nome, $identificador, $setor, $cargo, $foto, $descritorJson);

    if (!$stmt->execute()) {
        jsonResponse(500, ['erro' => 'Erro ao cadastrar pessoa no banco.']);
    }

    jsonResponse(201, [
        'sucesso' => true,
        'mensagem' => 'Cadastro realizado com sucesso.',
        'pessoa' => [
            'id' => $id,
            'nome' => $nome,
            'identificador' => $identificador
        ]
    ]);
}

if ($method === 'DELETE') {
    $identificador = trim((string)($_GET['identificador'] ?? ''));

    if ($identificador === '') {
        jsonResponse(400, ['erro' => 'Identificador obrigatório.']);
    }

    $conn = openDatabase();
    $stmt = $conn->prepare('DELETE FROM pessoas WHERE identificador = ?');
    $stmt->bind_param('s', $identificador);
    $stmt->execute();

    if ($stmt->affected_rows <= 0) {
        jsonResponse(404, ['erro' => 'Pessoa não encontrada.']);
    }

    jsonResponse(200, ['sucesso' => true, 'mensagem' => 'Cadastro excluído com sucesso.']);
}

jsonResponse(405, ['erro' => 'Método não permitido.']);
