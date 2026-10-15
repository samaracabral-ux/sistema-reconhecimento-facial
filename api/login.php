<?php
require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');

$data = readJsonBody();
$usuario = trim((string)($data['usuario'] ?? ''));
$senha = (string)($data['senha'] ?? '');

if ($usuario === '' || $senha === '') {
    jsonResponse(400, ['erro' => 'Informe usuário e senha.']);
}

$conn = openDatabase();
$stmt = $conn->prepare('SELECT usuario, nome FROM usuarios WHERE usuario = ? AND senha = ? LIMIT 1');
$stmt->bind_param('ss', $usuario, $senha);
$stmt->execute();
$result = $stmt->get_result();
$usuarioEncontrado = $result->fetch_assoc();

if (!$usuarioEncontrado) {
    jsonResponse(401, ['erro' => 'Usuário ou senha inválidos.']);
}

jsonResponse(200, [
    'sucesso' => true,
    'nome' => $usuarioEncontrado['nome'] ?? $usuarioEncontrado['usuario'],
    'usuario' => $usuarioEncontrado['usuario']
]);
