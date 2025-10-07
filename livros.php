<?php
require_once '../includes/db.php';
require_once '../includes/functions.php';

$pageTitle = "Buscar Livros - Biblioteca Escolar";
include '../includes/header.php';

// Processar busca
$searchTerm = '';
$searchResults = [];
$currentPage = 1;
$resultsPerPage = 10;

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['search'])) {
    $searchTerm = sanitize($_GET['search']);
    $currentPage = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    
    if (!empty($searchTerm)) {
        // Buscar livros
        $offset = ($currentPage - 1) * $resultsPerPage;
        $term = "%{$searchTerm}%";
        
        $sql = "SELECT l.*, a.au_nome, e.ed_nome, g.ge_genero,
                       COUNT(le.lex_cod) as total_exemplares,
                       SUM(CASE WHEN le.lex_disponivel = 1 THEN 1 ELSE 0 END) as exemplares_disponiveis
                FROM livro l
                LEFT JOIN autor a ON l.li_autor = a.au_cod
                LEFT JOIN editora e ON l.li_editora = e.ed_cod
                LEFT JOIN genero g ON l.li_genero = g.ge_genero
                LEFT JOIN livro_exemplar le ON l.li_cod = le.lex_li_cod
                WHERE l.li_titulo LIKE ? 
                   OR a.au_nome LIKE ? 
                   OR l.li_isbn LIKE ?
                   OR e.ed_nome LIKE ?
                   OR g.ge_genero LIKE ?
                GROUP BY l.li_cod
                ORDER BY l.li_titulo
                LIMIT ? OFFSET ?";
        
        $stmt = $mysqli->prepare($sql);
        $stmt->bind_param("sssssii", $term, $term, $term, $term, $term, $resultsPerPage, $offset);
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($row = $result->fetch_assoc()) {
            $searchResults[] = $row;
        }
        
        // Contar total de resultados para paginação
        $countSql = "SELECT COUNT(DISTINCT l.li_cod) as total
                     FROM livro l
                     LEFT JOIN autor a ON l.li_autor = a.au_cod
                     LEFT JOIN editora e ON l.li_editora = e.ed_cod
                     LEFT JOIN genero g ON l.li_genero = g.ge_genero
                     WHERE l.li_titulo LIKE ? 
                        OR a.au_nome LIKE ? 
                        OR l.li_isbn LIKE ?
                        OR e.ed_nome LIKE ?
                        OR g.ge_genero LIKE ?";
        
        $countStmt = $mysqli->prepare($countSql);
        $countStmt->bind_param("sssss", $term, $term, $term, $term, $term);
        $countStmt->execute();
        $countResult = $countStmt->get_result();
        $totalResults = $countResult->fetch_assoc()['total'];
        $totalPages = ceil($totalResults / $resultsPerPage);
    }
}
?>

<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <h1 class="page-title">Buscar Livros</h1>
            <p class="page-subtitle">Encontre o livro que você está procurando</p>
        </div>
    </div>

    <!-- Formulário de Busca -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="card">
                <div class="card-body">
                    <form method="GET" action="livros.php" class="row g-3">
                        <div class="col-md-8">
                            <label for="search" class="form-label">Termo de busca</label>
                            <input type="text" 
                                   class="form-control" 
                                   id="search" 
                                   name="search" 
                                   value="<?php echo htmlspecialchars($searchTerm); ?>"
                                   placeholder="Digite o título, autor, ISBN, editora ou gênero do livro"
                                   aria-describedby="searchHelp"
                                   required>
                            <div id="searchHelp" class="form-text">
                                Você pode buscar por título do livro, nome do autor, ISBN, nome da editora ou gênero.
                            </div>
                        </div>
                        <div class="col-md-4 d-flex align-items-end">
                            <button type="submit" class="btn btn-primary btn-lg w-100">
                                <i class="fas fa-search me-2"></i>Buscar Livros
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <?php if (!empty($searchTerm)): ?>
    <!-- Resultados da Busca -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h3 class="mb-0">
                        Resultados para "<?php echo htmlspecialchars($searchTerm); ?>"
                        <?php if (isset($totalResults)): ?>
                            <small class="text-muted">(<?php echo $totalResults; ?> livro(s) encontrado(s))</small>
                        <?php endif; ?>
                    </h3>
                </div>
                <div class="card-body">
                    <?php if (empty($searchResults)): ?>
                        <div class="alert alert-info" role="alert">
                            <i class="fas fa-info-circle me-2"></i>
                            Nenhum livro encontrado para o termo "<?php echo htmlspecialchars($searchTerm); ?>".
                            Tente buscar com outros termos ou verifique a ortografia.
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
                                        <th>Exemplares</th>
                                        <th>Disponíveis</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($searchResults as $livro): ?>
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
                                            <span class="badge bg-secondary">
                                                <?php echo $livro['total_exemplares']; ?>
                                            </span>
                                        </td>
                                        <td>
                                            <?php if ($livro['exemplares_disponiveis'] > 0): ?>
                                                <span class="badge bg-success">
                                                    <?php echo $livro['exemplares_disponiveis']; ?> Disponível(is)
                                                </span>
                                            <?php else: ?>
                                                <span class="badge bg-danger">Indisponível</span>
                                            <?php endif; ?>
                                        </td>
                                        <td>
                                            <a href="livro_ver.php?id=<?php echo $livro['li_cod']; ?>" 
                                               class="btn btn-primary btn-sm">
                                                <i class="fas fa-eye me-1"></i>Ver Detalhes
                                            </a>
                                        </td>
                                    </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>

                        <!-- Paginação -->
                        <?php if (isset($totalPages) && $totalPages > 1): ?>
                        <nav aria-label="Navegação de páginas">
                            <ul class="pagination justify-content-center">
                                <?php if ($currentPage > 1): ?>
                                    <li class="page-item">
                                        <a class="page-link" href="?search=<?php echo urlencode($searchTerm); ?>&page=<?php echo $currentPage - 1; ?>">
                                            <i class="fas fa-chevron-left"></i> Anterior
                                        </a>
                                    </li>
                                <?php endif; ?>

                                <?php
                                $startPage = max(1, $currentPage - 2);
                                $endPage = min($totalPages, $currentPage + 2);
                                
                                for ($i = $startPage; $i <= $endPage; $i++):
                                ?>
                                    <li class="page-item <?php echo $i === $currentPage ? 'active' : ''; ?>">
                                        <a class="page-link" href="?search=<?php echo urlencode($searchTerm); ?>&page=<?php echo $i; ?>">
                                            <?php echo $i; ?>
                                        </a>
                                    </li>
                                <?php endfor; ?>

                                <?php if ($currentPage < $totalPages): ?>
                                    <li class="page-item">
                                        <a class="page-link" href="?search=<?php echo urlencode($searchTerm); ?>&page=<?php echo $currentPage + 1; ?>">
                                            Próximo <i class="fas fa-chevron-right"></i>
                                        </a>
                                    </li>
                                <?php endif; ?>
                            </ul>
                        </nav>
                        <?php endif; ?>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
    <?php endif; ?>

    <!-- Dicas de Busca -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="card bg-light">
                <div class="card-body">
                    <h5><i class="fas fa-lightbulb me-2"></i>Dicas para uma busca mais eficiente:</h5>
                    <ul class="mb-0">
                        <li>Use palavras-chave do título do livro</li>
                        <li>Digite o nome completo ou sobrenome do autor</li>
                        <li>Para ISBN, digite apenas os números</li>
                        <li>Busque por gênero: Romance, Ficção, História, etc.</li>
                        <li>Use o nome da editora se souber</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
// Focar no campo de busca quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.focus();
    }
});
</script>

<?php include '../includes/footer.php'; ?>