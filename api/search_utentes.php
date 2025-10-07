<?php
require_once '../../includes/db.php';
require_once '../../includes/functions.php';

// Configurar headers para API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Verificar se é uma requisição GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Método não permitido']);
    exit;
}

// Verificar se o parâmetro de busca foi fornecido
if (!isset($_GET['q']) || empty(trim($_GET['q']))) {
    echo json_encode([]);
    exit;
}

$searchTerm = sanitize($_GET['q']);

// Buscar utentes que correspondem ao termo de busca
$sql = "SELECT ut_cod, ut_nome, ut_email, ut_tlm
        FROM utente 
        WHERE ut_nome LIKE ? 
           OR ut_email LIKE ?
        ORDER BY ut_nome
        LIMIT 10";

$term = "%{$searchTerm}%";
$stmt = $mysqli->prepare($sql);
$stmt->bind_param("ss", $term, $term);
$stmt->execute();
$result = $stmt->get_result();

$utentes = [];
while ($row = $result->fetch_assoc()) {
    $utentes[] = [
        'ut_cod' => $row['ut_cod'],
        'ut_nome' => $row['ut_nome'],
        'ut_email' => $row['ut_email'],
        'ut_tlm' => $row['ut_tlm']
    ];
}

echo json_encode($utentes);
?>