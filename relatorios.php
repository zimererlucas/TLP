<?php
require_once '../includes/db.php';
require_once '../includes/functions.php';

$pageTitle = "Relatórios - Biblioteca Escolar";
include '../includes/header.php';

// Buscar parâmetros de filtro
$filtroUtente = isset($_GET['utente_id']) ? (int)$_GET['utente_id'] : null;
$filtroPeriodo = isset($_GET['periodo']) ? sanitize($_GET['periodo']) : 'mes_atual';
$filtroStatus = isset($_GET['status']) ? sanitize($_GET['status']) : 'todos';

// Buscar livros disponíveis
$sql = "SELECT l.*, a.au_nome, e.ed_nome, g.ge_genero,
               COUNT(le.lex_cod) as total_exemplares,
               SUM(CASE WHEN le.lex_disponivel = 1 THEN 1 ELSE 0 END) as exemplares_disponiveis
        FROM livro l
        LEFT JOIN autor a ON l.li_autor = a.au_cod
        LEFT JOIN editora e ON l.li_editora = e.ed_cod
        LEFT JOIN genero g ON l.li_genero = g.ge_genero
        LEFT JOIN livro_exemplar le ON l.li_cod = le.lex_li_cod
        GROUP BY l.li_cod
        ORDER BY l.li_titulo";

$livrosDisponiveis = [];
$result = $mysqli->query($sql);
while ($row = $result->fetch_assoc()) {
    $livrosDisponiveis[] = $row;
}

// Buscar livros atualmente emprestados
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

$emprestimosAtivos = [];
$result = $mysqli->query($sql);
while ($row = $result->fetch_assoc()) {
    $emprestimosAtivos[] = $row;
}

// Buscar histórico de empréstimos
$whereConditions = ["1=1"];
$params = [];

if ($filtroUtente) {
    $whereConditions[] = "r.re_ut_cod = ?";
    $params[] = $filtroUtente;
}

if ($filtroPeriodo !== 'todos') {
    switch ($filtroPeriodo) {
        case 'mes_atual':
            $whereConditions[] = "r.re_data_requisicao >= DATE_SUB(CURDATE(), INTERVAL DAY(CURDATE())-1 DAY)";
            break;
        case 'ultimo_mes':
            $whereConditions[] = "r.re_data_requisicao >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)";
            break;
        case 'ultimos_3_meses':
            $whereConditions[] = "r.re_data_requisicao >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)";
            break;
        case 'ultimos_6_meses':
            $whereConditions[] = "r.re_data_requisicao >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)";
            break;
        case 'ultimo_ano':
            $whereConditions[] = "r.re_data_requisicao >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)";
            break;
    }
}

if ($filtroStatus !== 'todos') {
    switch ($filtroStatus) {
        case 'ativos':
            $whereConditions[] = "r.re_data_devolucao IS NULL";
            break;
        case 'devolvidos':
            $whereConditions[] = "r.re_data_devolucao IS NOT NULL";
            break;
        case 'atraso':
            $whereConditions[] = "r.re_data_devolucao IS NULL AND r.re_data_prevista < CURDATE()";
            break;
    }
}

$sql = "SELECT r.*, l.li_titulo, a.au_nome, u.ut_nome, u.ut_email,
               le.lex_cod as exemplar_cod,
               CASE WHEN r.re_data_devolucao IS NULL THEN 'Ativo' ELSE 'Devolvido' END as status_emprestimo,
               CASE WHEN r.re_data_devolucao IS NULL AND r.re_data_prevista < CURDATE() THEN 1 ELSE 0 END as em_atraso
        FROM requisicao r
        INNER JOIN livro_exemplar le ON r.re_lex_cod = le.lex_cod
        INNER JOIN livro l ON le.lex_li_cod = l.li_cod
        LEFT JOIN autor a ON l.li_autor = a.au_cod
        INNER JOIN utente u ON r.re_ut_cod = u.ut_cod
        WHERE " . implode(' AND ', $whereConditions) . "
        ORDER BY r.re_data_requisicao DESC, l.li_titulo";

$stmt = $mysqli->prepare($sql);
if (!empty($params)) {
    $types = str_repeat('i', count($params));
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();

$historicoEmprestimos = [];
while ($row = $result->fetch_assoc()) {
    $historicoEmprestimos[] = $row;
}

// Buscar todos os utentes para filtro
$sql = "SELECT ut_cod, ut_nome FROM utente ORDER BY ut_nome";
$utentesResult = $mysqli->query($sql);
$utentes = [];

while ($row = $utentesResult->fetch_assoc()) {
    $utentes[] = $row;
}

// Estatísticas gerais
$totalLivros = count($livrosDisponiveis);
$totalExemplares = array_sum(array_column($livrosDisponiveis, 'total_exemplares'));
$exemplaresDisponiveis = array_sum(array_column($livrosDisponiveis, 'exemplares_disponiveis'));
$exemplaresEmprestados = $totalExemplares - $exemplaresDisponiveis;
$emprestimosAtraso = array_filter($emprestimosAtivos, function($e) { return $e['em_atraso'] == 1; });
?>

<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <h1 class="page-title">Relatórios da Biblioteca</h1>
            <p class="page-subtitle">Visualize estatísticas e relatórios detalhados</p>
        </div>
    </div>

    <!-- Estatísticas Gerais -->
    <div class="row mt-4">
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <h3 class="text-primary"><?php echo $totalLivros; ?></h3>
                    <p class="card-text">Títulos de Livros</p>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <h3 class="text-info"><?php echo $totalExemplares; ?></h3>
                    <p class="card-text">Total de Exemplares</p>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <h3 class="text-success"><?php echo $exemplaresDisponiveis; ?></h3>
                    <p class="card-text">Disponíveis</p>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <h3 class="text-warning"><?php echo $exemplaresEmprestados; ?></h3>
                    <p class="card-text">Emprestados</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Filtros -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-filter me-2"></i>Filtros para Histórico</h3>
                </div>
                <div class="card-body">
                    <form method="GET" action="relatorios.php" class="row g-3">
                        <div class="col-md-3">
                            <label for="utente_id" class="form-label">Usuário</label>
                            <select class="form-control" id="utente_id" name="utente_id">
                                <option value="">Todos os usuários</option>
                                <?php foreach ($utentes as $utente): ?>
                                    <option value="<?php echo $utente['ut_cod']; ?>" <?php echo $filtroUtente == $utente['ut_cod'] ? 'selected' : ''; ?>>
                                        <?php echo htmlspecialchars($utente['ut_nome']); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label for="periodo" class="form-label">Período</label>
                            <select class="form-control" id="periodo" name="periodo">
                                <option value="todos" <?php echo $filtroPeriodo == 'todos' ? 'selected' : ''; ?>>Todos os períodos</option>
                                <option value="mes_atual" <?php echo $filtroPeriodo == 'mes_atual' ? 'selected' : ''; ?>>Mês atual</option>
                                <option value="ultimo_mes" <?php echo $filtroPeriodo == 'ultimo_mes' ? 'selected' : ''; ?>>Último mês</option>
                                <option value="ultimos_3_meses" <?php echo $filtroPeriodo == 'ultimos_3_meses' ? 'selected' : ''; ?>>Últimos 3 meses</option>
                                <option value="ultimos_6_meses" <?php echo $filtroPeriodo == 'ultimos_6_meses' ? 'selected' : ''; ?>>Últimos 6 meses</option>
                                <option value="ultimo_ano" <?php echo $filtroPeriodo == 'ultimo_ano' ? 'selected' : ''; ?>>Último ano</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label for="status" class="form-label">Status</label>
                            <select class="form-control" id="status" name="status">
                                <option value="todos" <?php echo $filtroStatus == 'todos' ? 'selected' : ''; ?>>Todos</option>
                                <option value="ativos" <?php echo $filtroStatus == 'ativos' ? 'selected' : ''; ?>>Ativos</option>
                                <option value="devolvidos" <?php echo $filtroStatus == 'devolvidos' ? 'selected' : ''; ?>>Devolvidos</option>
                                <option value="atraso" <?php echo $filtroStatus == 'atraso' ? 'selected' : ''; ?>>Em Atraso</option>
                            </select>
                        </div>
                        <div class="col-md-3 d-flex align-items-end">
                            <div class="btn-group w-100" role="group">
                                <button type="submit" class="btn btn-primary">
                                    <i class="fas fa-search me-2"></i>Filtrar
                                </button>
                                <a href="relatorios.php" class="btn btn-secondary">
                                    <i class="fas fa-times me-2"></i>Limpar
                                </a>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Livros Disponíveis -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-book me-2"></i>Livros Disponíveis</h3>
                </div>
                <div class="card-body">
                    <?php if (empty($livrosDisponiveis)): ?>
                        <div class="alert alert-info" role="alert">
                            <i class="fas fa-info-circle me-2"></i>
                            Não há livros cadastrados no sistema.
                        </div>
                    <?php else: ?>
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Título</th>
                                        <th>Autor</th>
                                        <th>Editora</th>
                                        <th>Ano</th>
                                        <th>Gênero</th>
                                        <th>Total Exemplares</th>
                                        <th>Disponíveis</th>
                                        <th>Emprestados</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($livrosDisponiveis as $livro): ?>
                                    <tr>
                                        <td>
                                            <strong><?php echo htmlspecialchars($livro['li_titulo']); ?></strong>
                                            <?php if (!empty($livro['li_isbn'])): ?>
                                                <br><small class="text-muted">ISBN: <?php echo htmlspecialchars($livro['li_isbn']); ?></small>
                                            <?php endif; ?>
                                        </td>
                                        <td><?php echo htmlspecialchars($livro['au_nome'] ?? 'N/A'); ?></td>
                                        <td><?php echo htmlspecialchars($livro['ed_nome'] ?? 'N/A'); ?></td>
                                        <td><?php echo htmlspecialchars($livro['li_ano'] ?? 'N/A'); ?></td>
                                        <td><?php echo htmlspecialchars($livro['ge_genero'] ?? 'N/A'); ?></td>
                                        <td>
                                            <span class="badge bg-primary"><?php echo $livro['total_exemplares']; ?></span>
                                        </td>
                                        <td>
                                            <span class="badge bg-success"><?php echo $livro['exemplares_disponiveis']; ?></span>
                                        </td>
                                        <td>
                                            <?php $emprestados = $livro['total_exemplares'] - $livro['exemplares_disponiveis']; ?>
                                            <?php if ($emprestados > 0): ?>
                                                <span class="badge bg-warning"><?php echo $emprestados; ?></span>
                                            <?php else: ?>
                                                <span class="badge bg-secondary">0</span>
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

    <!-- Empréstimos Ativos -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-hand-holding me-2"></i>Empréstimos Ativos</h3>
                    <?php if (count($emprestimosAtraso) > 0): ?>
                        <span class="badge bg-danger ms-2"><?php echo count($emprestimosAtraso); ?> em atraso</span>
                    <?php endif; ?>
                </div>
                <div class="card-body">
                    <?php if (empty($emprestimosAtivos)): ?>
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
                                    <?php foreach ($emprestimosAtivos as $emprestimo): ?>
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
                                                <i class="fas fa-undo me-1"></i>Devolver
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

    <!-- Histórico de Empréstimos -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-history me-2"></i>Histórico de Empréstimos</h3>
                    <small class="text-muted"><?php echo count($historicoEmprestimos); ?> registro(s) encontrado(s)</small>
                </div>
                <div class="card-body">
                    <?php if (empty($historicoEmprestimos)): ?>
                        <div class="alert alert-info" role="alert">
                            <i class="fas fa-info-circle me-2"></i>
                            Nenhum empréstimo encontrado com os filtros aplicados.
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
                                        <th>Data Devolução</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($historicoEmprestimos as $emprestimo): ?>
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
                                        <td><?php echo formatDate($emprestimo['re_data_prevista']); ?></td>
                                        <td>
                                            <?php if ($emprestimo['re_data_devolucao']): ?>
                                                <?php echo formatDate($emprestimo['re_data_devolucao']); ?>
                                            <?php else: ?>
                                                <span class="text-muted">-</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <?php if ($emprestimo['status_emprestimo'] == 'Ativo'): ?>
                                                <?php if ($emprestimo['em_atraso']): ?>
                                                    <span class="badge bg-danger">Em Atraso</span>
                                                <?php else: ?>
                                                    <span class="badge bg-success">Ativo</span>
                                                <?php endif; ?>
                                            <?php else: ?>
                                                <span class="badge bg-secondary">Devolvido</span>
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

<?php include '../includes/footer.php'; ?>