<?php
function getDbConfig(): array
{
    return [
        'host' => '127.0.0.1',
        'port' => 3306,
        'user' => 'root',
        'pass' => '',
        'dbname' => 'faceid',
        'charset' => 'utf8mb4'
    ];
}

function openDatabase(): mysqli
{
    static $connection = null;

    if ($connection instanceof mysqli) {
        return $connection;
    }

    $config = getDbConfig();
    $connection = @new mysqli(
        $config['host'],
        $config['user'],
        $config['pass'],
        $config['dbname'],
        $config['port']
    );

    if ($connection->connect_errno) {
        http_response_code(500);
        echo json_encode([
            'erro' => 'Não foi possível conectar ao MySQL. Verifique o XAMPP e as credenciais do banco.'
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    $connection->set_charset($config['charset']);
    return $connection;
}

function jsonResponse(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function readJsonBody(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}
