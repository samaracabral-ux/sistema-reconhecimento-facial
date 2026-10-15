<?php
$config = [
    'host' => '127.0.0.1',
    'port' => 3306,
    'user' => 'root',
    'pass' => '',
    'dbname' => 'faceid'
];

$mysqli = @new mysqli($config['host'], $config['user'], $config['pass'], '', $config['port']);
if ($mysqli->connect_errno) {
    die("Erro ao conectar ao MySQL: " . $mysqli->connect_error . PHP_EOL);
}

$mysqli->query('CREATE DATABASE IF NOT EXISTS `' . $config['dbname'] . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
$mysqli->select_db($config['dbname']);

$sql = file_get_contents(__DIR__ . '/database/schema.sql');
if ($sql === false) {
    die("Arquivo de schema não encontrado em database/schema.sql" . PHP_EOL);
}

$statements = preg_split('/;\s*(?:\r?\n|$)/', $sql);
foreach ($statements as $statement) {
    $statement = trim($statement);
    if ($statement === '') {
        continue;
    }

    if (!$mysqli->query($statement)) {
        die("Erro ao executar query: " . $mysqli->error . PHP_EOL . "Query: " . $statement . PHP_EOL);
    }
}

echo "Banco faceid criado com sucesso!\n";
echo "Usuário padrão: admin / 1234\n";
