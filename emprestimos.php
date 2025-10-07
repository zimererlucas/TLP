<?php
require_once '../includes/db.php';
require_once '../includes/functions.php';

$pageTitle = "Gestão de Empréstimos - Biblioteca Escolar";
include '../includes/header.php';

// Processar novo empréstimo
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'novo_emprestimo') {
    $utenteId = (int)$_POST['utente_id'];
    $exemplarId = (int)$_POST['exemplar_id'];
    $diasEmprestimo = (int)$_POST['dias_emprestimo'];
    
    // Verificar se exemplar está disponível
    if (isExemplarDisponivel($mysqli, $exemplarId)) {
        // Verificar se utente tem empréstimos em atraso
        if (hasOverdueLoans($mysqli, $utenteId)) {
            $_SESSION['error_message'] = 'Este usuário possui empréstimos em atraso e não pode fazer novos empréstimos.';
        } else {
            // Realizar empréstimo
            $mysqli->begin_transaction();
            
            try {
                // Inserir requisição
                $dataRequisicao = date('Y-m-d');
                $dataPrevista = calculateDueDate($diasEmprestimo);
                
                $sql = "INSERT INTO requisicao (re_ut_cod, re_lex_cod, re_data_requisicao, re_data_prevista) 
                        VALUES (?, ?, ?, ?)";
                $stmt = $mysqli->prepare($sql);
                $stmt->bind_param("iiss", $utenteId, $exemplarId, $dataRequisicao, $dataPrevista);
                $stmt->execute();
                
                // Atualizar exemplar como indisponível
                $sql = "UPDATE livro_exemplar SET lex_disponivel = 0 WHERE lex_cod = ?";
                $stmt = $mysqli->prepare($sql);
                $stmt->bind_param("i", $exemplarId);
                $stmt->execute();
                
                $mysqli->commit();
                $_SESSION['success_message'] = 'Empréstimo registrado com sucesso! Data de devolução: ' . formatDate($dataPrevista);
                
                // Recarregar página para atualizar dados
                header('Location: emprestimos.php');
                exit;
                
            } catch (Exception $e) {
                $mysqli->rollback();
                $_SESSION['error_message'] = 'Erro ao registrar empréstimo: ' . $e->getMessage();
            }
        }
    } else {
        $_SESSION['error_message'] = 'Este exemplar não está disponível para empréstimo.';
    }
}

// Buscar empréstimos ativos
$sql = "SELECT r.*, l.li_titulo, a.au_nome, u.ut_nome, u.ut_email,
               le.lex_cod as exemplar_cod,
               CASE WHEN r.re_data_prevista < CURDATE() THEN 1 ELSE 0 END as em_atraso
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

// Buscar exemplares disponíveis
$sql = "SELECT le.lex_cod, l.li_titulo, a.au_nome, le.lex_estado
        FROM livro_exemplar le
        INNER JOIN livro l ON le.lex_li_cod = l.li_cod
        LEFT JOIN autor a ON l.li_autor = a.au_cod
        WHERE le.lex_disponivel = 1
        ORDER BY l.li_titulo";

$exemplaresResult = $mysqli->query($sql);
$exemplaresDisponiveis = [];

while ($row = $exemplaresResult->fetch_assoc()) {
    $exemplaresDisponiveis[] = $row;
}
?>

<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <h1 class="page-title">Gestão de Empréstimos</h1>
            <p class="page-subtitle">Registre novos empréstimos e visualize empréstimos ativos</p>
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
                    <h3 class="text-warning">
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
                    <h3 class="text-success"><?php echo count($exemplaresDisponiveis); ?></h3>
                    <p class="card-text">Exemplares Disponíveis</p>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <h3 class="text-info">
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
    </div>

    <!-- Novo Empréstimo -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-plus me-2"></i>Registrar Novo Empréstimo</h3>
                </div>
                <div class="card-body">
                    <form method="POST" action="" id="novoEmprestimoForm">
                        <input type="hidden" name="action" value="novo_emprestimo">
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="utente_search" class="form-label required">Buscar Usuário</label>
                                    <input type="text" 
                                           class="form-control" 
                                           id="utente_search" 
                                           placeholder="Digite o nome ou email do usuário"
                                           autocomplete="off">
                                    <div id="utente_results" class="mt-2" style="display: none;"></div>
                                    <input type="hidden" id="utente_id" name="utente_id" required>
                                    <div id="selected_utente" class="mt-2" style="display: none;"></div>
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="exemplar_id" class="form-label required">Exemplar</label>
                                    <select class="form-control" id="exemplar_id" name="exemplar_id" required>
                                        <option value="">Selecione um exemplar disponível</option>
                                        <?php foreach ($exemplaresDisponiveis as $exemplar): ?>
                                            <option value="<?php echo $exemplar['lex_cod']; ?>">
                                                <?php echo htmlspecialchars($exemplar['lex_cod']); ?> - 
                                                "<?php echo htmlspecialchars($exemplar['li_titulo']); ?>"
                                                <?php if (!empty($exemplar['au_nome'])): ?>
                                                    - <?php echo htmlspecialchars($exemplar['au_nome']); ?>
                                                <?php endif; ?>
                                                (<?php echo htmlspecialchars($exemplar['lex_estado'] ?? 'Bom'); ?>)
                                            </option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="dias_emprestimo" class="form-label required">Prazo do Empréstimo (dias)</label>
                                    <select class="form-control" id="dias_emprestimo" name="dias_emprestimo" required>
                                        <option value="7">7 dias</option>
                                        <option value="14" selected>14 dias (padrão)</option>
                                        <option value="21">21 dias</option>
                                        <option value="30">30 dias</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Data Prevista de Devolução</label>
                                    <input type="text" class="form-control" id="data_prevista" readonly>
                                    <div class="form-text">Calculada automaticamente baseada no prazo selecionado</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="d-grid">
                            <button type="submit" class="btn btn-success btn-lg">
                                <i class="fas fa-check me-2"></i>Registrar Empréstimo
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Lista de Empréstimos Ativos -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-list me-2"></i>Empréstimos Ativos</h3>
                </div>
                <div class="card-body">
                    <?php if (empty($emprestimos)): ?>
                        <div class="alert alert-info" role="alert">
                            <i class="fas fa-info-circle me-2"></i>
                            Não há empréstimos ativos no momento.
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
                                            <a href="devolucoes.php?emprestimo_id=<?php echo $emprestimo['re_cod']; ?>" 
                                               class="btn btn-warning btn-sm">
                                                <i class="fas fa-undo me-1"></i>Registrar Devolução
                                            </a>
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

<script>
// Buscar utentes em tempo real
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('utente_search');
    const resultsDiv = document.getElementById('utente_results');
    const selectedDiv = document.getElementById('selected_utente');
    const hiddenInput = document.getElementById('utente_id');
    const diasSelect = document.getElementById('dias_emprestimo');
    const dataPrevistaInput = document.getElementById('data_prevista');
    
    // Atualizar data prevista quando dias mudarem
    diasSelect.addEventListener('change', updateDataPrevista);
    updateDataPrevista();
    
    function updateDataPrevista() {
        const dias = parseInt(diasSelect.value);
        const hoje = new Date();
        const dataPrevista = new Date(hoje.getTime() + (dias * 24 * 60 * 60 * 1000));
        dataPrevistaInput.value = dataPrevista.toLocaleDateString('pt-BR');
    }
    
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
    
    // Validação do formulário
    const form = document.getElementById('novoEmprestimoForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            if (!hiddenInput.value) {
                e.preventDefault();
                alert('Por favor, selecione um usuário.');
                searchInput.focus();
                return false;
            }
            
            if (!document.getElementById('exemplar_id').value) {
                e.preventDefault();
                alert('Por favor, selecione um exemplar.');
                document.getElementById('exemplar_id').focus();
                return false;
            }
        });
    }
});

// Adicionar estilo para cursor pointer
const style = document.createElement('style');
style.textContent = '.cursor-pointer { cursor: pointer; }';
document.head.appendChild(style);
</script>

<?php include '../includes/footer.php'; ?>