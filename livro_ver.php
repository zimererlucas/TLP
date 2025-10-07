<?php
require_once '../includes/db.php';
require_once '../includes/functions.php';

$pageTitle = "Detalhes do Livro - Biblioteca Escolar";
include '../includes/header.php';

// Verificar se ID foi fornecido
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    $_SESSION['error_message'] = 'ID do livro inválido.';
    header('Location: livros.php');
    exit;
}

$livroId = (int)$_GET['id'];

// Buscar informações do livro
$livro = getLivroInfo($mysqli, $livroId);

if (!$livro) {
    $_SESSION['error_message'] = 'Livro não encontrado.';
    header('Location: livros.php');
    exit;
}

// Buscar exemplares do livro
$sql = "SELECT le.*, 
               CASE WHEN r.re_data_devolucao IS NULL THEN 'Emprestado' ELSE 'Disponível' END as status_texto,
               CASE WHEN r.re_data_devolucao IS NULL THEN 0 ELSE 1 END as lex_disponivel,
               r.re_data_requisicao,
               r.re_data_prevista,
               u.ut_nome
        FROM livro_exemplar le
        LEFT JOIN requisicao r ON le.lex_cod = r.re_lex_cod 
            AND r.re_data_devolucao IS NULL
        LEFT JOIN utente u ON r.re_ut_cod = u.ut_cod
        WHERE le.lex_li_cod = ?
        ORDER BY le.lex_cod";

$stmt = $mysqli->prepare($sql);
$stmt->bind_param("i", $livroId);
$stmt->execute();
$result = $stmt->get_result();

$exemplares = [];
$exemplaresDisponiveis = 0;
$exemplaresEmprestados = 0;

while ($row = $result->fetch_assoc()) {
    $exemplares[] = $row;
    if ($row['lex_disponivel'] == 1) {
        $exemplaresDisponiveis++;
    } else {
        $exemplaresEmprestados++;
    }
}

// Processar empréstimo se solicitado
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'emprestar') {
    $exemplarId = (int)$_POST['exemplar_id'];
    $utenteId = (int)$_POST['utente_id'];
    
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
                $dataPrevista = calculateDueDate(14); // 14 dias
                
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
                header('Location: livro_ver.php?id=' . $livroId);
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
?>

<div class="container-fluid">
    <!-- Breadcrumb -->
    <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
            <li class="breadcrumb-item"><a href="index.php">Início</a></li>
            <li class="breadcrumb-item"><a href="livros.php">Buscar Livros</a></li>
            <li class="breadcrumb-item active"><?php echo htmlspecialchars($livro['li_titulo']); ?></li>
        </ol>
    </nav>

    <div class="row">
        <div class="col-12">
            <h1 class="page-title"><?php echo htmlspecialchars($livro['li_titulo']); ?></h1>
        </div>
    </div>

    <div class="row mt-4">
        <!-- Informações do Livro -->
        <div class="col-lg-8">
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-book me-2"></i>Informações do Livro</h3>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <table class="table table-borderless">
                                <tr>
                                    <td><strong>Título:</strong></td>
                                    <td><?php echo htmlspecialchars($livro['li_titulo']); ?></td>
                                </tr>
                                <tr>
                                    <td><strong>Autor:</strong></td>
                                    <td><?php echo htmlspecialchars($livro['au_nome'] ?? 'N/A'); ?></td>
                                </tr>
                                <tr>
                                    <td><strong>Editora:</strong></td>
                                    <td><?php echo htmlspecialchars($livro['ed_nome'] ?? 'N/A'); ?></td>
                                </tr>
                                <tr>
                                    <td><strong>Ano de Publicação:</strong></td>
                                    <td><?php echo htmlspecialchars($livro['li_ano'] ?? 'N/A'); ?></td>
                                </tr>
                            </table>
                        </div>
                        <div class="col-md-6">
                            <table class="table table-borderless">
                                <tr>
                                    <td><strong>ISBN:</strong></td>
                                    <td><?php echo htmlspecialchars($livro['li_isbn'] ?? 'N/A'); ?></td>
                                </tr>
                                <tr>
                                    <td><strong>Gênero:</strong></td>
                                    <td><?php echo htmlspecialchars($livro['ge_genero'] ?? 'N/A'); ?></td>
                                </tr>
                                <tr>
                                    <td><strong>Total de Exemplares:</strong></td>
                                    <td><span class="badge bg-primary"><?php echo count($exemplares); ?></span></td>
                                </tr>
                                <tr>
                                    <td><strong>Disponíveis:</strong></td>
                                    <td>
                                        <span class="badge bg-success"><?php echo $exemplaresDisponiveis; ?></span>
                                        <?php if ($exemplaresEmprestados > 0): ?>
                                            <span class="badge bg-warning ms-2"><?php echo $exemplaresEmprestados; ?> emprestado(s)</span>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            </table>
                        </div>
                    </div>

                    <?php if (!empty($livro['li_descricao'])): ?>
                    <div class="mt-4">
                        <h5>Descrição</h5>
                        <p><?php echo nl2br(htmlspecialchars($livro['li_descricao'])); ?></p>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <!-- Ações -->
        <div class="col-lg-4">
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-tasks me-2"></i>Ações</h3>
                </div>
                <div class="card-body">
                    <?php if ($exemplaresDisponiveis > 0): ?>
                        <div class="d-grid gap-2">
                            <button type="button" class="btn btn-success btn-lg" data-bs-toggle="modal" data-bs-target="#emprestarModal">
                                <i class="fas fa-hand-holding me-2"></i>Emprestar Livro
                            </button>
                        </div>
                        <div class="mt-3 text-center">
                            <small class="text-success">
                                <i class="fas fa-check-circle me-1"></i>
                                <?php echo $exemplaresDisponiveis; ?> exemplar(es) disponível(is) para empréstimo
                            </small>
                        </div>
                    <?php else: ?>
                        <div class="alert alert-warning" role="alert">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            Todos os exemplares estão emprestados no momento.
                        </div>
                    <?php endif; ?>

                    <div class="mt-4">
                        <a href="livros.php" class="btn btn-secondary btn-lg w-100">
                            <i class="fas fa-arrow-left me-2"></i>Voltar à Busca
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Lista de Exemplares -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-list me-2"></i>Exemplares</h3>
                </div>
                <div class="card-body">
                    <?php if (empty($exemplares)): ?>
                        <div class="alert alert-info" role="alert">
                            <i class="fas fa-info-circle me-2"></i>
                            Nenhum exemplar cadastrado para este livro.
                        </div>
                    <?php else: ?>
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Código do Exemplar</th>
                                        <th>Estado</th>
                                        <th>Status</th>
                                        <th>Informações do Empréstimo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($exemplares as $exemplar): ?>
                                    <tr>
                                        <td>
                                            <strong><?php echo htmlspecialchars($exemplar['lex_cod']); ?></strong>
                                        </td>
                                        <td>
                                            <span class="badge bg-info">
                                                <?php echo htmlspecialchars($exemplar['lex_estado'] ?? 'Bom'); ?>
                                            </span>
                                        </td>
                                        <td>
                                            <?php if ($exemplar['lex_disponivel'] == 1): ?>
                                                <span class="status-disponivel">
                                                    <i class="fas fa-check-circle me-1"></i>Disponível
                                                </span>
                                            <?php else: ?>
                                                <span class="status-indisponivel">
                                                    <i class="fas fa-times-circle me-1"></i>Emprestado
                                                </span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <?php if ($exemplar['lex_disponivel'] == 0 && !empty($exemplar['ut_nome'])): ?>
                                                <strong>Emprestado para:</strong> <?php echo htmlspecialchars($exemplar['ut_nome']); ?><br>
                                                <strong>Data do empréstimo:</strong> <?php echo formatDate($exemplar['re_data_requisicao']); ?><br>
                                                <strong>Data prevista de devolução:</strong> 
                                                <?php 
                                                $dataPrevista = $exemplar['re_data_prevista'];
                                                $hoje = new DateTime();
                                                $vencimento = new DateTime($dataPrevista);
                                                
                                                if ($hoje > $vencimento) {
                                                    echo '<span class="text-danger">' . formatDate($dataPrevista) . ' (Em atraso)</span>';
                                                } else {
                                                    echo formatDate($dataPrevista);
                                                }
                                                ?>
                                            <?php else: ?>
                                                <span class="text-muted">Disponível para empréstimo</span>
                                            <?php endif; ?>
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

<!-- Modal de Empréstimo -->
<div class="modal fade" id="emprestarModal" tabindex="-1" aria-labelledby="emprestarModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="emprestarModalLabel">
                    <i class="fas fa-hand-holding me-2"></i>Emprestar Livro
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <form method="POST" action="">
                <div class="modal-body">
                    <input type="hidden" name="action" value="emprestar">
                    <input type="hidden" name="livro_id" value="<?php echo $livroId; ?>">
                    
                    <div class="mb-3">
                        <label for="exemplar_id" class="form-label required">Exemplar</label>
                        <select class="form-control" id="exemplar_id" name="exemplar_id" required>
                            <option value="">Selecione um exemplar disponível</option>
                            <?php foreach ($exemplares as $exemplar): ?>
                                <?php if ($exemplar['lex_disponivel'] == 1): ?>
                                    <option value="<?php echo $exemplar['lex_cod']; ?>">
                                        <?php echo htmlspecialchars($exemplar['lex_cod']); ?> - 
                                        <?php echo htmlspecialchars($exemplar['lex_estado'] ?? 'Bom'); ?>
                                    </option>
                                <?php endif; ?>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
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
                    
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        <strong>Informações:</strong>
                        <ul class="mb-0 mt-2">
                            <li>O prazo de empréstimo é de 14 dias</li>
                            <li>Data de devolução prevista: <strong><?php echo formatDate(calculateDueDate(14)); ?></strong></li>
                            <li>Usuários com empréstimos em atraso não podem fazer novos empréstimos</li>
                        </ul>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-success">
                        <i class="fas fa-check me-2"></i>Confirmar Empréstimo
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
                 onclick="selectUtente('${utente.ut_cod}', '${utente.ut_nome}')">
                <strong>${utente.ut_nome}</strong>
                <br>
                <small class="text-muted">${utente.ut_email || 'Sem email'}</small>
            </div>
        `).join('');
        
        resultsDiv.innerHTML = html;
        resultsDiv.style.display = 'block';
    }
    
    window.selectUtente = function(utenteId, nomeCompleto) {
        hiddenInput.value = utenteId;
        searchInput.value = '';
        resultsDiv.style.display = 'none';
        
        selectedDiv.innerHTML = `
            <div class="alert alert-success">
                <i class="fas fa-check-circle me-2"></i>
                <strong>Usuário selecionado:</strong> ${nomeCompleto}
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

// Adicionar estilo para cursor pointer
const style = document.createElement('style');
style.textContent = '.cursor-pointer { cursor: pointer; }';
document.head.appendChild(style);
</script>

<?php include '../includes/footer.php'; ?>