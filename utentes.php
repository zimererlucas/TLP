<?php
require_once '../includes/db.php';
require_once '../includes/functions.php';

$pageTitle = "Gestão de Usuários - Biblioteca Escolar";
include '../includes/header.php';

// Processar ações
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['action'])) {
        switch ($_POST['action']) {
            case 'adicionar':
                // Adicionar novo utente
                $nome = sanitize($_POST['ut_nome']);
                $email = sanitize($_POST['ut_email']);
                $telefone = sanitize($_POST['ut_tlm']);
                $morada = sanitize($_POST['ut_morada']);
                $codigoPostal = sanitize($_POST['ut_cod_postal']);
                
                // Validações
                $errors = [];
                if (empty($nome)) $errors[] = 'Nome é obrigatório';
                if (!empty($email) && !isValidEmail($email)) $errors[] = 'Email inválido';
                
                if (empty($errors)) {
                    try {
                        $sql = "INSERT INTO utente (ut_nome, ut_email, ut_tlm, ut_morada, ut_cod_postal) 
                                VALUES (?, ?, ?, ?, ?)";
                        $stmt = $mysqli->prepare($sql);
                        $stmt->bind_param("sssss", $nome, $email, $telefone, $morada, $codigoPostal);
                        $stmt->execute();
                        
                        $_SESSION['success_message'] = 'Usuário adicionado com sucesso!';
                        header('Location: utentes.php');
                        exit;
                        
                    } catch (Exception $e) {
                        if (strpos($e->getMessage(), 'uk_utente_email') !== false) {
                            $_SESSION['error_message'] = 'Este email já está cadastrado.';
                        } else {
                            $_SESSION['error_message'] = 'Erro ao adicionar usuário: ' . $e->getMessage();
                        }
                    }
                } else {
                    $_SESSION['error_message'] = implode('<br>', $errors);
                }
                break;
                
            case 'editar':
                // Editar utente existente
                $utenteId = (int)$_POST['utente_id'];
                $nome = sanitize($_POST['ut_nome']);
                $email = sanitize($_POST['ut_email']);
                $telefone = sanitize($_POST['ut_tlm']);
                $morada = sanitize($_POST['ut_morada']);
                $codigoPostal = sanitize($_POST['ut_cod_postal']);
                
                // Validações
                $errors = [];
                if (empty($nome)) $errors[] = 'Nome é obrigatório';
                if (!empty($email) && !isValidEmail($email)) $errors[] = 'Email inválido';
                
                if (empty($errors)) {
                    try {
                        $sql = "UPDATE utente 
                                SET ut_nome = ?, ut_email = ?, ut_tlm = ?, ut_morada = ?, ut_cod_postal = ?
                                WHERE ut_cod = ?";
                        $stmt = $mysqli->prepare($sql);
                        $stmt->bind_param("sssssi", $nome, $email, $telefone, $morada, $codigoPostal, $utenteId);
                        $stmt->execute();
                        
                        $_SESSION['success_message'] = 'Usuário atualizado com sucesso!';
                        header('Location: utentes.php');
                        exit;
                        
                    } catch (Exception $e) {
                        if (strpos($e->getMessage(), 'uk_utente_email') !== false) {
                            $_SESSION['error_message'] = 'Este email já está cadastrado.';
                        } else {
                            $_SESSION['error_message'] = 'Erro ao atualizar usuário: ' . $e->getMessage();
                        }
                    }
                } else {
                    $_SESSION['error_message'] = implode('<br>', $errors);
                }
                break;
        }
    }
}

// Buscar todos os utentes
$sql = "SELECT u.*, 
               COUNT(r.re_cod) as total_emprestimos,
               COUNT(CASE WHEN r.re_data_devolucao IS NULL THEN 1 END) as emprestimos_ativos,
               COUNT(CASE WHEN r.re_data_devolucao IS NULL AND r.re_data_prevista < CURDATE() THEN 1 END) as emprestimos_atraso
        FROM utente u
        LEFT JOIN requisicao r ON u.ut_cod = r.re_ut_cod
        GROUP BY u.ut_cod
        ORDER BY u.ut_nome";

$result = $mysqli->query($sql);
$utentes = [];

while ($row = $result->fetch_assoc()) {
    $utentes[] = $row;
}

// Buscar códigos postais disponíveis
$sql = "SELECT DISTINCT cod_postal, cod_localidade FROM codigo_postal ORDER BY cod_localidade";
$codigosPostaisResult = $mysqli->query($sql);
$codigosPostais = [];

while ($row = $codigosPostaisResult->fetch_assoc()) {
    $codigosPostais[] = $row;
}
?>

<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <h1 class="page-title">Gestão de Usuários</h1>
            <p class="page-subtitle">Cadastre e gerencie usuários da biblioteca</p>
        </div>
    </div>

    <!-- Estatísticas -->
    <div class="row mt-4">
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <h3 class="text-primary"><?php echo count($utentes); ?></h3>
                    <p class="card-text">Total de Usuários</p>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <h3 class="text-success">
                        <?php 
                        $utentesComEmprestimos = array_filter($utentes, function($u) { return $u['emprestimos_ativos'] > 0; });
                        echo count($utentesComEmprestimos); 
                        ?>
                    </h3>
                    <p class="card-text">Com Empréstimos Ativos</p>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <h3 class="text-warning">
                        <?php 
                        $utentesEmAtraso = array_filter($utentes, function($u) { return $u['emprestimos_atraso'] > 0; });
                        echo count($utentesEmAtraso); 
                        ?>
                    </h3>
                    <p class="card-text">Com Empréstimos em Atraso</p>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <h3 class="text-info">
                        <?php 
                        $utentesSemEmprestimos = array_filter($utentes, function($u) { return $u['total_emprestimos'] == 0; });
                        echo count($utentesSemEmprestimos); 
                        ?>
                    </h3>
                    <p class="card-text">Sem Empréstimos</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Adicionar Novo Usuário -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h3><i class="fas fa-user-plus me-2"></i>Adicionar Novo Usuário</h3>
                    <button type="button" class="btn btn-primary" data-bs-toggle="collapse" data-bs-target="#novoUtenteForm" aria-expanded="false">
                        <i class="fas fa-plus me-2"></i>Novo Usuário
                    </button>
                </div>
                <div class="collapse" id="novoUtenteForm">
                    <div class="card-body">
                        <form method="POST" action="" id="adicionarUtenteForm">
                            <input type="hidden" name="action" value="adicionar">
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="ut_nome" class="form-label required">Nome Completo</label>
                                        <input type="text" class="form-control" id="ut_nome" name="ut_nome" required>
                                        <div class="form-text">Digite o nome completo do usuário</div>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="ut_email" class="form-label">Email</label>
                                        <input type="email" class="form-control" id="ut_email" name="ut_email">
                                        <div class="form-text">Email único para identificação do usuário</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="ut_tlm" class="form-label">Telefone</label>
                                        <input type="tel" class="form-control" id="ut_tlm" name="ut_tlm">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="ut_cod_postal" class="form-label">Código Postal</label>
                                        <select class="form-control" id="ut_cod_postal" name="ut_cod_postal">
                                            <option value="">Selecione...</option>
                                            <?php foreach ($codigosPostais as $cp): ?>
                                                <option value="<?php echo $cp['cod_postal']; ?>">
                                                    <?php echo htmlspecialchars($cp['cod_postal'] . ' - ' . $cp['cod_localidade']); ?>
                                                </option>
                                            <?php endforeach; ?>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-12">
                                    <div class="mb-3">
                                        <label for="ut_morada" class="form-label">Morada</label>
                                        <input type="text" class="form-control" id="ut_morada" name="ut_morada">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="d-grid">
                                <button type="submit" class="btn btn-success btn-lg">
                                    <i class="fas fa-check me-2"></i>Adicionar Usuário
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Lista de Usuários -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-users me-2"></i>Lista de Usuários</h3>
                </div>
                <div class="card-body">
                    <?php if (empty($utentes)): ?>
                        <div class="alert alert-info" role="alert">
                            <i class="fas fa-info-circle me-2"></i>
                            Não há usuários cadastrados no sistema.
                        </div>
                    <?php else: ?>
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Nome Completo</th>
                                        <th>Email</th>
                                        <th>Telefone</th>
                                        <th>Morada</th>
                                        <th>Empréstimos</th>
                                        <th>Status</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($utentes as $utente): ?>
                                    <tr>
                                        <td>
                                            <strong><?php echo htmlspecialchars($utente['ut_nome']); ?></strong>
                                        </td>
                                        <td>
                                            <?php if (!empty($utente['ut_email'])): ?>
                                                <a href="mailto:<?php echo htmlspecialchars($utente['ut_email']); ?>">
                                                    <?php echo htmlspecialchars($utente['ut_email']); ?>
                                                </a>
                                            <?php else: ?>
                                                <span class="text-muted">Não informado</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <?php if (!empty($utente['ut_tlm'])): ?>
                                                <a href="tel:<?php echo htmlspecialchars($utente['ut_tlm']); ?>">
                                                    <?php echo htmlspecialchars($utente['ut_tlm']); ?>
                                                </a>
                                            <?php else: ?>
                                                <span class="text-muted">Não informado</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <?php if (!empty($utente['ut_morada'])): ?>
                                                <?php echo htmlspecialchars($utente['ut_morada']); ?>
                                            <?php else: ?>
                                                <span class="text-muted">Não informado</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <span class="badge bg-primary"><?php echo $utente['total_emprestimos']; ?> total</span>
                                            <?php if ($utente['emprestimos_ativos'] > 0): ?>
                                                <span class="badge bg-success"><?php echo $utente['emprestimos_ativos']; ?> ativo(s)</span>
                                            <?php endif; ?>
                                            <?php if ($utente['emprestimos_atraso'] > 0): ?>
                                                <span class="badge bg-danger"><?php echo $utente['emprestimos_atraso']; ?> atraso</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <?php if ($utente['emprestimos_atraso'] > 0): ?>
                                                <span class="badge bg-danger">Em Atraso</span>
                                            <?php elseif ($utente['emprestimos_ativos'] > 0): ?>
                                                <span class="badge bg-success">Ativo</span>
                                            <?php else: ?>
                                                <span class="badge bg-secondary">Inativo</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <button type="button" 
                                                    class="btn btn-primary btn-sm" 
                                                    data-bs-toggle="modal" 
                                                    data-bs-target="#editarUtenteModal"
                                                    onclick="editarUtente(<?php echo htmlspecialchars(json_encode($utente)); ?>)">
                                                <i class="fas fa-edit me-1"></i>Editar
                                            </button>
                                            <a href="relatorios.php?utente_id=<?php echo $utente['ut_cod']; ?>" 
                                               class="btn btn-info btn-sm">
                                                <i class="fas fa-chart-line me-1"></i>Histórico
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

<!-- Modal de Edição -->
<div class="modal fade" id="editarUtenteModal" tabindex="-1" aria-labelledby="editarUtenteModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="editarUtenteModalLabel">
                    <i class="fas fa-edit me-2"></i>Editar Usuário
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
            </div>
            <form method="POST" action="" id="editarUtenteForm">
                <div class="modal-body">
                    <input type="hidden" name="action" value="editar">
                    <input type="hidden" id="modal_utente_id" name="utente_id">
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="modal_ut_nome" class="form-label required">Nome Completo</label>
                                <input type="text" class="form-control" id="modal_ut_nome" name="ut_nome" required>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="modal_ut_email" class="form-label">Email</label>
                                <input type="email" class="form-control" id="modal_ut_email" name="ut_email">
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="modal_ut_tlm" class="form-label">Telefone</label>
                                <input type="tel" class="form-control" id="modal_ut_tlm" name="ut_tlm">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label for="modal_ut_cod_postal" class="form-label">Código Postal</label>
                                <select class="form-control" id="modal_ut_cod_postal" name="ut_cod_postal">
                                    <option value="">Selecione...</option>
                                    <?php foreach ($codigosPostais as $cp): ?>
                                        <option value="<?php echo $cp['cod_postal']; ?>">
                                            <?php echo htmlspecialchars($cp['cod_postal'] . ' - ' . $cp['cod_localidade']); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-12">
                            <div class="mb-3">
                                <label for="modal_ut_morada" class="form-label">Morada</label>
                                <input type="text" class="form-control" id="modal_ut_morada" name="ut_morada">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save me-2"></i>Salvar Alterações
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
// Focar no primeiro campo quando o formulário de novo usuário for expandido
document.getElementById('novoUtenteForm').addEventListener('shown.bs.collapse', function () {
    document.getElementById('ut_nome').focus();
});

// Função para editar utente
function editarUtente(utente) {
    document.getElementById('modal_utente_id').value = utente.ut_cod;
    document.getElementById('modal_ut_nome').value = utente.ut_nome;
    document.getElementById('modal_ut_email').value = utente.ut_email || '';
    document.getElementById('modal_ut_tlm').value = utente.ut_tlm || '';
    document.getElementById('modal_ut_morada').value = utente.ut_morada || '';
    document.getElementById('modal_ut_cod_postal').value = utente.ut_cod_postal || '';
}

// Validação do formulário
document.getElementById('adicionarUtenteForm').addEventListener('submit', function(e) {
    if (!validateUtenteForm(this)) {
        e.preventDefault();
    }
});

document.getElementById('editarUtenteForm').addEventListener('submit', function(e) {
    if (!validateUtenteForm(this)) {
        e.preventDefault();
    }
});

function validateUtenteForm(form) {
    const nome = form.querySelector('input[name="ut_nome"]').value.trim();
    const email = form.querySelector('input[name="ut_email"]').value.trim();
    
    if (!nome) {
        alert('Nome é obrigatório.');
        form.querySelector('input[name="ut_nome"]').focus();
        return false;
    }
    
    if (email && !isValidEmail(email)) {
        alert('Email inválido.');
        form.querySelector('input[name="ut_email"]').focus();
        return false;
    }
    
    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
</script>

<?php include '../includes/footer.php'; ?>