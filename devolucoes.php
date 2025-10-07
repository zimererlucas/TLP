<?php
require_once '../includes/db.php';
require_once '../includes/functions.php';

$pageTitle = "Gestão de Devoluções - Biblioteca Escolar";
include '../includes/header.php';

// Processar devolução
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'devolver') {
    $emprestimoId = (int)$_POST['emprestimo_id'];
    $dataDevolucao = date('Y-m-d');
    
    // Realizar devolução
    $mysqli->begin_transaction();
    
    try {
        // Buscar informações do empréstimo
        $sql = "SELECT r.*, le.lex_cod 
                FROM requisicao r
                INNER JOIN livro_exemplar le ON r.re_lex_cod = le.lex_cod
                WHERE r.re_cod = ? AND r.re_data_devolucao IS NULL";
        
        $stmt = $mysqli->prepare($sql);
        $stmt->bind_param("i", $emprestimoId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($emprestimo = $result->fetch_assoc()) {
            // Atualizar requisição com data de devolução
            $sql = "UPDATE requisicao SET re_data_devolucao = ? WHERE re_cod = ?";
            $stmt = $mysqli->prepare($sql);
            $stmt->bind_param("si", $dataDevolucao, $emprestimoId);
            $stmt->execute();
            
            // Atualizar exemplar como disponível
            $sql = "UPDATE livro_exemplar SET lex_disponivel = 1 WHERE lex_cod = ?";
            $stmt = $mysqli->prepare($sql);
            $stmt->bind_param("i", $emprestimo['lex_cod']);
            $stmt->execute();
            
            $mysqli->commit();
            $_SESSION['success_message'] = 'Devolução registrada com sucesso!';
            
            // Recarregar página para atualizar dados
            header('Location: devolucoes.php');
            exit;
        } else {
            throw new Exception('Empréstimo não encontrado ou já devolvido.');
        }
        
    } catch (Exception $e) {
        $mysqli->rollback();
        $_SESSION['error_message'] = 'Erro ao registrar devolução: ' . $e->getMessage();
    }
}

// Buscar empréstimos ativos
$sql = "SELECT r.*, l.li_titulo, a.au_nome, u.ut_nome, u.ut_email,
               le.lex_cod as exemplar_cod,
               CASE WHEN r.re_data_prevista < CURDATE() THEN 1 ELSE 0 END as em_atraso,
               DATEDIFF(CURDATE(), r.re_data_prevista) as dias_atraso
        FROM requisicao r
        INNER JOIN livro_exemplar le ON r.re_lex_cod = le.lex_cod
        INNER JOIN livro l ON le.lex_li_cod = l.li_cod
        LEFT JOIN autor a ON l.li_autor = a.au_cod
        INNER JOIN utente u ON r.re_ut_cod = u.ut_cod
        WHERE r.re_data_devolucao IS NULL
        ORDER BY r.re_data_prevista ASC, l.li_titulo";

$result = $mysqli->query($sql);
$emprestimos = [];

while ($row = $result->fetch_assoc()) {
    $emprestimos[] = $row;
}

// Filtrar por usuário se especificado
$filtroUtente = '';
if (isset($_GET['utente_id']) && is_numeric($_GET['utente_id'])) {
    $utenteId = (int)$_GET['utente_id'];
    $emprestimos = array_filter($emprestimos, function($e) use ($utenteId) {
        return $e['re_ut_cod'] == $utenteId;
    });
    $filtroUtente = $utenteId;
}
?>

<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <h1 class="page-title">Gestão de Devoluções</h1>
            <p class="page-subtitle">Registre devoluções de livros emprestados</p>
        </div>
    </div>

    <!-- Estatísticas -->
    <div class="row mt-4">
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <h3 class="text-primary"><?php echo count($emprestimos); ?></h3>
                    <p class="card-text">Empréstimos Ativos</p>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <h3 class="text-danger">
                        <?php 
                        $emprestimosAtraso = array_filter($emprestimos, function($e) { return $e['em_atraso'] == 1; });
                        echo count($emprestimosAtraso); 
                        ?>
                    </h3>
                    <p class="card-text">Em Atraso</p>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <h3 class="text-warning">
                        <?php 
                        $emprestimosHoje = array_filter($emprestimos, function($e) { 
                            return $e['re_data_prevista'] == date('Y-m-d'); 
                        });
                        echo count($emprestimosHoje); 
                        ?>
                    </h3>
                    <p class="card-text">Vencem Hoje</p>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <h3 class="text-info">
                        <?php 
                        $emprestimosProximos = array_filter($emprestimos, function($e) { 
                            $dataVencimento = new DateTime($e['re_data_prevista']);
                            $hoje = new DateTime();
                            $diferenca = $hoje->diff($dataVencimento)->days;
                            return $diferenca <= 3 && $diferenca >= 0;
                        });
                        echo count($emprestimosProximos); 
                        ?>
                    </h3>
                    <p class="card-text">Vencem em 3 dias</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Filtros -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-filter me-2"></i>Filtros</h3>
                </div>
                <div class="card-body">
                    <form method="GET" action="devolucoes.php" class="row g-3">
                        <div class="col-md-8">
                            <label for="utente_search" class="form-label">Buscar por Usuário</label>
                            <input type="text" 
                                   class="form-control" 
                                   id="utente_search" 
                                   placeholder="Digite o nome ou email do usuário"
                                   autocomplete="off">
                            <div id="utente_results" class="mt-2" style="display: none;"></div>
                            <input type="hidden" id="utente_id" name="utente_id">
                            <div id="selected_utente" class="mt-2" style="display: none;"></div>
                        </div>
                        <div class="col-md-4 d-flex align-items-end">
                            <div class="btn-group w-100" role="group">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-search me-2"></i>Filtrar
                                </button>
                                <a href="devolucoes.php" class="btn btn-secondary">
                                    <i class="fas fa-times me-2"></i>Limpar
                                </a>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Lista de Empréstimos para Devolução -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-list me-2"></i>Empréstimos para Devolução</h3>
                </div>
                <div class="card-body">
                    <?php if (empty($emprestimos)): ?>
                        <div class="alert alert-info" role="alert">
                            <i class="fas fa-info-circle me-2"></i>
                            <?php if ($filtroUtente): ?>
                                Não há empréstimos ativos para este usuário.
                            <?php else: ?>
                                Não há empréstimos ativos no momento.
                            <?php endif; ?>
                        </div>
                    <?php else: ?>
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Livro</th>
                                        <th>Exemplar</th>
                                        <th>Usuário</th>
                                        <th>Data do Empréstimo</th>
                                        <th>Data Prevista</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($emprestimos as $emprestimo): ?>
                                    <tr class="<?php echo $emprestimo['em_atraso'] ? 'table-danger' : ''; ?>">
                                        <td>
                                            <strong><?php echo htmlspecialchars($emprestimo['li_titulo']); ?></strong>
                                            <?php if (!empty($emprestimo['au_nome'])): ?>
                                                <br><small class="text-muted"><?php echo htmlspecialchars($emprestimo['au_nome']); ?></small>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <span class="badge bg-secondary">
                                                <?php echo htmlspecialchars($emprestimo['exemplar_cod']); ?>
                                            </span>
                                        </td>
                                        <td>
                                            <?php echo htmlspecialchars($emprestimo['ut_nome']); ?>
                                            <?php if (!empty($emprestimo['ut_email'])): ?>
                                                <br><small class="text-muted"><?php echo htmlspecialchars($emprestimo['ut_email']); ?></small>
                                            <?php endif; ?>
                                        </td>
                                        <td><?php echo formatDate($emprestimo['re_data_requisicao']); ?></td>
                                        <td>
                                            <?php if ($emprestimo['em_atraso']): ?>
                                                <span class="text-danger">
                                                    <?php echo formatDate($emprestimo['re_data_prevista']); ?>
                                                    <i class="fas fa-exclamation-triangle ms-1"></i>
                                                    <?php if ($emprestimo['dias_atraso'] > 0): ?>
                                                        <br><small class="text-danger"><?php echo $emprestimo['dias_atraso']; ?> dia(s) em atraso</small>
                                                    <?php endif; ?>
                                                </span>
                                            <?php else: ?>
                                                <?php echo formatDate($emprestimo['re_data_prevista']); ?>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <?php if ($emprestimo['em_atraso']): ?>
                                                <span class="badge bg-danger">Em Atraso</span>
                                            <?php else: ?>
                                                <span class="badge bg-success">No Prazo</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <button type="button" 
                                                    class="btn btn-warning btn-sm" 
                                                    data-bs-toggle="modal" 
                                                    data-bs-target="#devolverModal"
                                                    onclick="prepararDevolucao(<?php echo $emprestimo['re_cod']; ?>, '<?php echo htmlspecialchars($emprestimo['li_titulo']); ?>', '<?php echo htmlspecialchars($emprestimo['ut_nome']); ?>', '<?php echo $emprestimo['exemplar_cod']; ?>')">
                                                <i class="fas fa-undo me-1"></i>Devolver
                                            </button>
                                        </td>
                                    </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Modal de Devolução -->
<div class="modal fade" id="devolverModal" tabindex="-1" aria-labelledby="devolverModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="devolverModalLabel">
                    <i class="fas fa-undo me-2"></i>Registrar Devolução
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <form method="POST" action="">
                <div class="modal-body">
                    <input type="hidden" name="action" value="devolver">
                    <input type="hidden" id="modal_emprestimo_id" name="emprestimo_id">
                    
                    <div class="alert alert-info">
                        <h6><i class="fas fa-info-circle me-2"></i>Confirmação de Devolução</h6>
                        <p class="mb-0">Você está prestes a registrar a devolução do seguinte empréstimo:</p>
                    </div>
                    
                    <div class="row">
                        <div class="col-12">
                            <table class="table table-borderless">
                                <tr>
                                    <td><strong>Livro:</strong></td>
                                    <td id="modal_livro_titulo"></td>
                                </tr>
                                <tr>
                                    <td><strong>Exemplar:</strong></td>
                                    <td id="modal_exemplar_cod"></td>
                                </tr>
                                <tr>
                                    <td><strong>Usuário:</strong></td>
                                    <td id="modal_utente_nome"></td>
                                </tr>
                                <tr>
                                    <td><strong>Data de Devolução:</strong></td>
                                    <td id="modal_data_devolucao"></td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Atenção:</strong> Esta ação irá marcar o exemplar como disponível para novos empréstimos.
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-warning">
                        <i class="fas fa-check me-2"></i>Confirmar Devolução
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
// Buscar utentes em tempo real
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('utente_search');
    const resultsDiv = document.getElementById('utente_results');
    const selectedDiv = document.getElementById('selected_utente');
    const hiddenInput = document.getElementById('utente_id');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.trim();
            
            if (query.length < 2) {
                resultsDiv.style.display = 'none';
                return;
            }
            
            // Simular busca de utentes (implementar AJAX real)
            fetch(`../api/search_utentes.php?q=${encodeURIComponent(query)}`)
                .then(response => response.json())
                .then(data => {
                    displayUtenteResults(data);
                })
                .catch(error => {
                    console.error('Erro na busca:', error);
                });
        });
    }
    
    function displayUtenteResults(results) {
        if (!results || results.length === 0) {
            resultsDiv.innerHTML = '<div class="text-muted">Nenhum usuário encontrado</div>';
            resultsDiv.style.display = 'block';
            return;
        }
        
        const html = results.map(utente => `
            <div class="search-result-item border p-2 mb-2 cursor-pointer" 
                 onclick="selectUtente('${utente.ut_cod}', '${utente.ut_nome}', '${utente.ut_email || ''}')">
                <strong>${utente.ut_nome}</strong>
                <br>
                <small class="text-muted">${utente.ut_email || 'Sem email'}</small>
            </div>
        `).join('');
        
        resultsDiv.innerHTML = html;
        resultsDiv.style.display = 'block';
    }
    
    window.selectUtente = function(utenteId, nomeCompleto, email) {
        hiddenInput.value = utenteId;
        searchInput.value = '';
        resultsDiv.style.display = 'none';
        
        selectedDiv.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-check-circle me-2"></i>
                <strong>Usuário selecionado:</strong> ${nomeCompleto}
                ${email ? `<br><small>${email}</small>` : ''}
                <button type="button" class="btn btn-sm btn-outline-secondary ms-2" onclick="clearUtente()">
                    Alterar
                </button>
            </div>
        `;
        selectedDiv.style.display = 'block';
    };
    
    window.clearUtente = function() {
        hiddenInput.value = '';
        selectedDiv.style.display = 'none';
        searchInput.focus();
    };
});

// Preparar dados para o modal de devolução
function prepararDevolucao(emprestimoId, livroTitulo, utenteNome, exemplarCod) {
    document.getElementById('modal_emprestimo_id').value = emprestimoId;
    document.getElementById('modal_livro_titulo').textContent = livroTitulo;
    document.getElementById('modal_exemplar_cod').textContent = exemplarCod;
    document.getElementById('modal_utente_nome').textContent = utenteNome;
    document.getElementById('modal_data_devolucao').textContent = new Date().toLocaleDateString('pt-BR');
}

// Adicionar estilo para cursor pointer
const style = document.createElement('style');
style.textContent = '.cursor-pointer { cursor: pointer; }';
document.head.appendChild(style);
</script>

<?php include '../includes/footer.php'; ?>