<?php
require_once '../includes/db.php';
require_once '../includes/functions.php';

$pageTitle = "Biblioteca Escolar - Página Inicial";
include '../includes/header.php';
?>

<div class="container-fluid">
    <div class="row">
        <div class="col-12">
            <h1 class="page-title">Biblioteca Escolar</h1>
            <p class="page-subtitle">Sistema de Gestão de Biblioteca</p>
        </div>
    </div>

    <!-- Painel de Atalhos -->
    <div class="row mt-4">
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card shortcut-card">
                <div class="card-body text-center">
                    <div class="shortcut-icon">📚</div>
                    <h3 class="card-title">Buscar Livros</h3>
                    <p class="card-text">Pesquise livros por título, autor ou ISBN</p>
                    <a href="livros.php" class="btn btn-primary btn-lg">Buscar</a>
                </div>
            </div>
        </div>

        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card shortcut-card">
                <div class="card-body text-center">
                    <div class="shortcut-icon">📖</div>
                    <h3 class="card-title">Registrar Empréstimo</h3>
                    <p class="card-text">Registre um novo empréstimo de livro</p>
                    <a href="emprestimos.php" class="btn btn-success btn-lg">Emprestar</a>
                </div>
            </div>
        </div>

        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card shortcut-card">
                <div class="card-body text-center">
                    <div class="shortcut-icon">↩️</div>
                    <h3 class="card-title">Registrar Devolução</h3>
                    <p class="card-text">Registre a devolução de um livro</p>
                    <a href="devolucoes.php" class="btn btn-warning btn-lg">Devolver</a>
                </div>
            </div>
        </div>

        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card shortcut-card">
                <div class="card-body text-center">
                    <div class="shortcut-icon">👥</div>
                    <h3 class="card-title">Gestão de Usuários</h3>
                    <p class="card-text">Cadastre e gerencie usuários da biblioteca</p>
                    <a href="utentes.php" class="btn btn-info btn-lg">Usuários</a>
                </div>
            </div>
        </div>

        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card shortcut-card">
                <div class="card-body text-center">
                    <div class="shortcut-icon">📊</div>
                    <h3 class="card-title">Relatórios</h3>
                    <p class="card-text">Visualize relatórios da biblioteca</p>
                    <a href="relatorios.php" class="btn btn-secondary btn-lg">Relatórios</a>
                </div>
            </div>
        </div>

        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card shortcut-card">
                <div class="card-body text-center">
                    <div class="shortcut-icon">⚙️</div>
                    <h3 class="card-title">Administração</h3>
                    <p class="card-text">Gerencie livros, autores e editoras</p>
                    <a href="admin/" class="btn btn-dark btn-lg">Admin</a>
                </div>
            </div>
        </div>
    </div>

    <!-- Avisos -->
    <?php
    // Buscar empréstimos em atraso
    $sql = "SELECT r.*, l.li_titulo, u.ut_nome
            FROM requisicao r
            INNER JOIN livro_exemplar le ON r.re_lex_cod = le.lex_cod
            INNER JOIN livro l ON le.lex_li_cod = l.li_cod
            INNER JOIN utente u ON r.re_ut_cod = u.ut_cod
            WHERE r.re_data_devolucao IS NULL 
            AND r.re_data_prevista < CURDATE()";
    
    $result = $mysqli->query($sql);
    
    if ($result && $result->num_rows > 0) {
        echo '<div class="row mt-4">';
        echo '<div class="col-12">';
        echo '<div class="alert alert-danger" role="alert">';
        echo '<h4 class="alert-heading">⚠️ Avisos Importantes</h4>';
        echo '<p>Os seguintes empréstimos estão em atraso:</p>';
        echo '<ul class="mb-0">';
        
        while ($row = $result->fetch_assoc()) {
            $nomeCompleto = htmlspecialchars($row['ut_nome']);
            $titulo = htmlspecialchars($row['li_titulo']);
            $dataPrevista = formatDate($row['re_data_prevista']);
            
            echo "<li><strong>{$nomeCompleto}</strong> - \"{$titulo}\" (Vencimento: {$dataPrevista})</li>";
        }
        
        echo '</ul>';
        echo '</div>';
        echo '</div>';
        echo '</div>';
    }
    ?>
</div>

<?php include '../includes/footer.php'; ?>