<?php
// Configurações do banco de dados para XAMPP
$host = '127.0.0.1';
$username = 'root';
$password = '';
$database = 'gm_biblioteca';

// Estabelecer conexão
$mysqli = new mysqli($host, $username, $password, $database);

// Verificar conexão
if ($mysqli->connect_error) {
    die('Erro de conexão: ' . $mysqli->connect_error);
}

// Definir charset para UTF-8
$mysqli->set_charset("utf8");

// Função para fechar conexão
function closeConnection() {
    global $mysqli;
    if (isset($mysqli)) {
        $mysqli->close();
    }
}

// Registrar função para fechar conexão automaticamente
register_shutdown_function('closeConnection');
?>
