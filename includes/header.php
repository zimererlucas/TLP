<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($pageTitle) ? htmlspecialchars($pageTitle) : 'Biblioteca Escolar'; ?></title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    
    <!-- Custom CSS -->
    <link href="assets/css/style.css" rel="stylesheet">
    
    <!-- Font Awesome para ícones -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <!-- Barra de Acessibilidade -->
    <div class="accessibility-bar">
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="accessibility-controls">
                            <button type="button" class="btn btn-sm btn-outline-primary me-2" onclick="increaseFontSize()" aria-label="Aumentar tamanho da fonte">
                                <i class="fas fa-plus"></i> A+
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-primary me-2" onclick="decreaseFontSize()" aria-label="Diminuir tamanho da fonte">
                                <i class="fas fa-minus"></i> A-
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-secondary" onclick="toggleHighContrast()" aria-label="Alternar alto contraste">
                                <i class="fas fa-adjust"></i> Contraste
                            </button>
                        </div>
                        <div class="current-time">
                            <span id="current-time"></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Navegação Principal -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary main-nav">
        <div class="container">
            <a class="navbar-brand" href="index.php">
                <i class="fas fa-book me-2"></i>
                Biblioteca Escolar
            </a>
            
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" 
                    aria-controls="navbarNav" aria-expanded="false" aria-label="Alternar navegação">
                <span class="navbar-toggler-icon"></span>
            </button>
            
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="index.php">
                            <i class="fas fa-home me-1"></i> Início
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="livros.php">
                            <i class="fas fa-search me-1"></i> Buscar Livros
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="emprestimos.php">
                            <i class="fas fa-hand-holding me-1"></i> Empréstimos
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="devolucoes.php">
                            <i class="fas fa-undo me-1"></i> Devoluções
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="utentes.php">
                            <i class="fas fa-users me-1"></i> Usuários
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="relatorios.php">
                            <i class="fas fa-chart-bar me-1"></i> Relatórios
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="admin/">
                            <i class="fas fa-cog me-1"></i> Administração
                        </a>
                    </li>
                </ul>
                
                <ul class="navbar-nav">
                    <li class="nav-item">
                        <a class="nav-link" href="#" onclick="showHelp()" title="Ajuda">
                            <i class="fas fa-question-circle me-1"></i> Ajuda
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Container Principal -->
    <main class="main-content">
        <div class="container-fluid py-4">
            <?php
            // Exibir mensagens de sessão se existirem
            if (session_status() == PHP_SESSION_NONE) {
                session_start();
            }
            
            if (isset($_SESSION['success_message'])) {
                echo showSuccessMessage($_SESSION['success_message']);
                unset($_SESSION['success_message']);
            }
            
            if (isset($_SESSION['error_message'])) {
                echo showErrorMessage($_SESSION['error_message']);
                unset($_SESSION['error_message']);
            }
            
            if (isset($_SESSION['warning_message'])) {
                echo showWarningMessage($_SESSION['warning_message']);
                unset($_SESSION['warning_message']);
            }
            ?>
