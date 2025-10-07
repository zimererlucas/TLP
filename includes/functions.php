<?php
/**
 * Funções auxiliares para o sistema de biblioteca
 */

/**
 * Formatar data para exibição
 */
function formatDate($date, $format = 'd/m/Y') {
    if (empty($date) || $date === null) {
        return 'N/A';
    }
    
    try {
        $dateObj = new DateTime($date);
        return $dateObj->format($format);
    } catch (Exception $e) {
        return 'Data inválida';
    }
}

/**
 * Sanitizar entrada do usuário
 */
function sanitize($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

/**
 * Calcular data de vencimento do empréstimo
 */
function calculateDueDate($days = 14) {
    $date = new DateTime();
    $date->add(new DateInterval("P{$days}D"));
    return $date->format('Y-m-d');
}

/**
 * Validar email
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Verificar se um exemplar está disponível
 */
function isExemplarDisponivel($mysqli, $exemplarId) {
    $sql = "SELECT lex_disponivel FROM livro_exemplar WHERE lex_cod = ?";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("i", $exemplarId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        return $row['lex_disponivel'] == 1;
    }
    
    return false;
}

/**
 * Obter informações do utente por código
 */
function getUtenteInfo($mysqli, $utenteId) {
    $sql = "SELECT ut_nome, ut_email FROM utente WHERE ut_cod = ?";
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("i", $utenteId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        return $row;
    }
    
    return null;
}

/**
 * Obter informações do livro por código
 */
function getLivroInfo($mysqli, $livroId) {
    $sql = "SELECT l.*, a.au_nome, e.ed_nome, g.ge_genero
            FROM livro l
            LEFT JOIN autor a ON l.li_autor = a.au_cod
            LEFT JOIN editora e ON l.li_editora = e.ed_cod
            LEFT JOIN genero g ON l.li_genero = g.ge_genero
            WHERE l.li_cod = ?";
    
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("i", $livroId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        return $row;
    }
    
    return null;
}

/**
 * Gerar mensagem de sucesso
 */
function showSuccessMessage($message) {
    return '<div class="alert alert-success alert-dismissible fade show" role="alert">
                ' . htmlspecialchars($message) . '
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>';
}

/**
 * Gerar mensagem de erro
 */
function showErrorMessage($message) {
    return '<div class="alert alert-danger alert-dismissible fade show" role="alert">
                ' . htmlspecialchars($message) . '
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>';
}

/**
 * Gerar mensagem de aviso
 */
function showWarningMessage($message) {
    return '<div class="alert alert-warning alert-dismissible fade show" role="alert">
                ' . htmlspecialchars($message) . '
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>';
}

/**
 * Verificar se um utente tem empréstimos em atraso
 */
function hasOverdueLoans($mysqli, $utenteId) {
    $sql = "SELECT COUNT(*) as count 
            FROM requisicao 
            WHERE re_ut_cod = ? 
            AND re_data_devolucao IS NULL 
            AND re_data_prevista < CURDATE()";
    
    $stmt = $mysqli->prepare($sql);
    $stmt->bind_param("i", $utenteId);
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    
    return $row['count'] > 0;
}
?>