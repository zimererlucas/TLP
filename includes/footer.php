        </div>
    </main>

    <!-- Rodapé -->
    <footer class="footer bg-light mt-5">
        <div class="container">
            <div class="row">
                <div class="col-md-6">
                    <h5>Sistema de Biblioteca Escolar</h5>
                    <p>Desenvolvido para facilitar o acesso e gestão de livros na biblioteca.</p>
                </div>
                <div class="col-md-6 text-md-end">
                    <h6>Contato</h6>
                    <p>
                        <i class="fas fa-envelope me-1"></i> biblioteca@escola.edu<br>
                        <i class="fas fa-phone me-1"></i> (11) 1234-5678
                    </p>
                </div>
            </div>
            <hr>
            <div class="row">
                <div class="col-12 text-center">
                    <p class="mb-0">&copy; <?php echo date('Y'); ?> Biblioteca Escolar. Todos os direitos reservados.</p>
                </div>
            </div>
        </div>
    </footer>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Custom JS -->
    <script src="assets/js/main.js"></script>
    
    <!-- Script para atualizar horário -->
    <script>
        function updateTime() {
            const now = new Date();
            const timeString = now.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            document.getElementById('current-time').textContent = timeString;
        }
        
        // Atualizar horário a cada minuto
        updateTime();
        setInterval(updateTime, 60000);
    </script>
</body>
</html>
