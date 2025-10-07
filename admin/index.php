<?php
require_once '../../includes/db.php';
require_once '../../includes/functions.php';

$pageTitle = "Administração - Biblioteca Escolar";
include '../../includes/header.php';
?>

<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <h1 class="page-title">Área Administrativa</h1>
            <p class="page-subtitle">Gerencie livros, autores, editoras e gêneros</p>
        </div>
    </div>

    <!-- Estatísticas Administrativas -->
    <div class="row mt-4">
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <?php
                    $sql = "SELECT COUNT(*) as total FROM livro";
                    $result = $mysqli->query($sql);
                    $totalLivros = $result->fetch_assoc()['total'];
                    ?>
                    <h3 class="text-primary"><?php echo $totalLivros; ?></h3>
                    <p class="card-text">Livros Cadastrados</p>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <?php
                    $sql = "SELECT COUNT(*) as total FROM autor";
                    $result = $mysqli->query($sql);
                    $totalAutores = $result->fetch_assoc()['total'];
                    ?>
                    <h3 class="text-info"><?php echo $totalAutores; ?></h3>
                    <p class="card-text">Autores</p>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <?php
                    $sql = "SELECT COUNT(*) as total FROM editora";
                    $result = $mysqli->query($sql);
                    $totalEditoras = $result->fetch_assoc()['total'];
                    ?>
                    <h3 class="text-success"><?php echo $totalEditoras; ?></h3>
                    <p class="card-text">Editoras</p>
                </div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card text-center">
                <div class="card-body">
                    <?php
                    $sql = "SELECT COUNT(*) as total FROM genero";
                    $result = $mysqli->query($sql);
                    $totalGeneros = $result->fetch_assoc()['total'];
                    ?>
                    <h3 class="text-warning"><?php echo $totalGeneros; ?></h3>
                    <p class="card-text">Gêneros</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Atalhos Administrativos -->
    <div class="row mt-4">
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card shortcut-card">
                <div class="card-body text-center">
                    <div class="shortcut-icon">📚</div>
                    <h3 class="card-title">Gestão de Livros</h3>
                    <p class="card-text">Adicione, edite ou remova livros do catálogo</p>
                    <a href="livros.php" class="btn btn-primary btn-lg">Gerenciar</a>
                </div>
            </div>
        </div>

        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card shortcut-card">
                <div class="card-body text-center">
                    <div class="shortcut-icon">✍️</div>
                    <h3 class="card-title">Gestão de Autores</h3>
                    <p class="card-text">Gerencie a lista de autores da biblioteca</p>
                    <a href="autores.php" class="btn btn-info btn-lg">Gerenciar</a>
                </div>
            </div>
        </div>

        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card shortcut-card">
                <div class="card-body text-center">
                    <div class="shortcut-icon">🏢</div>
                    <h3 class="card-title">Gestão de Editoras</h3>
                    <p class="card-text">Gerencie as editoras cadastradas</p>
                    <a href="editoras.php" class="btn btn-success btn-lg">Gerenciar</a>
                </div>
            </div>
        </div>

        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card shortcut-card">
                <div class="card-body text-center">
                    <div class="shortcut-icon">📖</div>
                    <h3 class="card-title">Gestão de Gêneros</h3>
                    <p class="card-text">Organize os gêneros literários</p>
                    <a href="generos.php" class="btn btn-warning btn-lg">Gerenciar</a>
                </div>
            </div>
        </div>

        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card shortcut-card">
                <div class="card-body text-center">
                    <div class="shortcut-icon">📋</div>
                    <h3 class="card-title">Gestão de Exemplares</h3>
                    <p class="card-text">Gerencie os exemplares físicos dos livros</p>
                    <a href="exemplares.php" class="btn btn-secondary btn-lg">Gerenciar</a>
                </div>
            </div>
        </div>

        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card shortcut-card">
                <div class="card-body text-center">
                    <div class="shortcut-icon">📊</div>
                    <h3 class="card-title">Relatórios Avançados</h3>
                    <p class="card-text">Relatórios detalhados e estatísticas</p>
                    <a href="../relatorios.php" class="btn btn-dark btn-lg">Visualizar</a>
                </div>
            </div>
        </div>
    </div>

    <!-- Avisos Administrativos -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-exclamation-triangle me-2"></i>Avisos Administrativos</h3>
                </div>
                <div class="card-body">
                    <?php
                    // Verificar livros sem exemplares
                    $sql = "SELECT l.li_cod, l.li_titulo 
                            FROM livro l 
                            LEFT JOIN livro_exemplar le ON l.li_cod = le.lex_livro 
                            WHERE le.lex_cod IS NULL";
                    $result = $mysqli->query($sql);
                    
                    if ($result && $result->num_rows > 0) {
                        echo '<div class="alert alert-warning" role="alert">';
                        echo '<h5><i class="fas fa-exclamation-triangle me-2"></i>Livros sem exemplares</h5>';
                        echo '<p>Os seguintes livros não possuem exemplares cadastrados:</p>';
                        echo '<ul>';
                        while ($row = $result->fetch_assoc()) {
                            echo '<li><strong>' . htmlspecialchars($row['li_titulo']) . '</strong> (ID: ' . $row['li_cod'] . ')</li>';
                        }
                        echo '</ul>';
                        echo '</div>';
                    }

                    // Verificar exemplares sem livro
                    $sql = "SELECT le.lex_cod, le.lex_livro 
                            FROM livro_exemplar le 
                            LEFT JOIN livro l ON le.lex_livro = l.li_cod 
                            WHERE l.li_cod IS NULL";
                    $result = $mysqli->query($sql);
                    
                    if ($result && $result->num_rows > 0) {
                        echo '<div class="alert alert-danger" role="alert">';
                        echo '<h5><i class="fas fa-exclamation-triangle me-2"></i>Exemplares órfãos</h5>';
                        echo '<p>Os seguintes exemplares não possuem livro associado:</p>';
                        echo '<ul>';
                        while ($row = $result->fetch_assoc()) {
                            echo '<li>Exemplar ID: <strong>' . $row['lex_cod'] . '</strong> (Livro ID: ' . $row['lex_livro'] . ')</li>';
                        }
                        echo '</ul>';
                        echo '</div>';
                    }

                    // Verificar livros sem autor
                    $sql = "SELECT li_cod, li_titulo FROM livro WHERE li_autor IS NULL";
                    $result = $mysqli->query($sql);
                    
                    if ($result && $result->num_rows > 0) {
                        echo '<div class="alert alert-info" role="alert">';
                        echo '<h5><i class="fas fa-info-circle me-2"></i>Livros sem autor</h5>';
                        echo '<p>Os seguintes livros não possuem autor cadastrado:</p>';
                        echo '<ul>';
                        while ($row = $result->fetch_assoc()) {
                            echo '<li><strong>' . htmlspecialchars($row['li_titulo']) . '</strong> (ID: ' . $row['li_cod'] . ')</li>';
                        }
                        echo '</ul>';
                        echo '</div>';
                    }

                    // Se não há avisos
                    if (!isset($result) || $result->num_rows == 0) {
                        echo '<div class="alert alert-success" role="alert">';
                        echo '<i class="fas fa-check-circle me-2"></i>';
                        echo '<strong>Parabéns!</strong> Não há problemas administrativos detectados.';
                        echo '</div>';
                    }
                    ?>
                </div>
            </div>
        </div>
    </div>

    <!-- Ações Rápidas -->
    <div class="row mt-4">
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-bolt me-2"></i>Ações Rápidas</h3>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4">
                            <a href="../emprestimos.php" class="btn btn-success btn-lg w-100 mb-3">
                                <i class="fas fa-plus me-2"></i>Novo Empréstimo
                            </a>
                        </div>
                        <div class="col-md-4">
                            <a href="../devolucoes.php" class="btn btn-warning btn-lg w-100 mb-3">
                                <i class="fas fa-undo me-2"></i>Registrar Devolução
                            </a>
                        </div>
                        <div class="col-md-4">
                            <a href="../utentes.php" class="btn btn-info btn-lg w-100 mb-3">
                                <i class="fas fa-user-plus me-2"></i>Novo Usuário
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include '../../includes/footer.php'; ?>
