/**
 * JavaScript para Biblioteca Escolar - Funcionalidades de Acessibilidade
 */

// Variáveis globais para controle de acessibilidade
let currentFontSize = 18;
let isHighContrast = false;

/**
 * Aumentar tamanho da fonte
 */
function increaseFontSize() {
    currentFontSize = Math.min(currentFontSize + 2, 24);
    document.documentElement.style.setProperty('--font-size-base', currentFontSize + 'px');
    updateFontSizeButtons();
    showNotification('Tamanho da fonte aumentado', 'success');
}

/**
 * Diminuir tamanho da fonte
 */
function decreaseFontSize() {
    currentFontSize = Math.max(currentFontSize - 2, 14);
    document.documentElement.style.setProperty('--font-size-base', currentFontSize + 'px');
    updateFontSizeButtons();
    showNotification('Tamanho da fonte diminuído', 'success');
}

/**
 * Atualizar estado dos botões de fonte
 */
function updateFontSizeButtons() {
    const increaseBtn = document.querySelector('[aria-label*="Aumentar"]');
    const decreaseBtn = document.querySelector('[aria-label*="Diminuir"]');
    
    if (increaseBtn) {
        increaseBtn.disabled = currentFontSize >= 24;
    }
    if (decreaseBtn) {
        decreaseBtn.disabled = currentFontSize <= 14;
    }
}

/**
 * Alternar modo alto contraste
 */
function toggleHighContrast() {
    isHighContrast = !isHighContrast;
    document.body.classList.toggle('high-contrast', isHighContrast);
    
    const btn = document.querySelector('[aria-label*="Contraste"]');
    if (btn) {
        btn.textContent = isHighContrast ? '☀️ Normal' : '🌙 Contraste';
    }
    
    showNotification(
        isHighContrast ? 'Modo alto contraste ativado' : 'Modo alto contraste desativado',
        'success'
    );
}

/**
 * Mostrar notificação
 */
function showNotification(message, type = 'info') {
    // Remover notificações existentes
    const existingNotifications = document.querySelectorAll('.accessibility-notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `accessibility-notification alert alert-${type} alert-dismissible fade show`;
    notification.style.position = 'fixed';
    notification.style.top = '80px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.style.minWidth = '300px';
    
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Remover automaticamente após 3 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

/**
 * Focar automaticamente no primeiro campo do formulário
 */
function focusFirstField(formId) {
    const form = document.getElementById(formId);
    if (form) {
        const firstInput = form.querySelector('input, select, textarea');
        if (firstInput && firstInput.type !== 'hidden') {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

/**
 * Validar formulário em tempo real
 */
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    
    requiredFields.forEach(field => {
        const fieldContainer = field.closest('.form-group, .mb-3');
        const errorElement = fieldContainer?.querySelector('.field-error');
        
        if (errorElement) {
            errorElement.remove();
        }
        
        if (!field.value.trim()) {
            isValid = false;
            field.classList.add('is-invalid');
            
            if (fieldContainer) {
                const error = document.createElement('div');
                error.className = 'field-error text-danger mt-1';
                error.textContent = 'Este campo é obrigatório';
                fieldContainer.appendChild(error);
            }
        } else {
            field.classList.remove('is-invalid');
            field.classList.add('is-valid');
        }
    });
    
    return isValid;
}

/**
 * Confirmar ação
 */
function confirmAction(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

/**
 * Mostrar ajuda contextual
 */
function showHelp() {
    const helpContent = `
        <h4>Ajuda - Biblioteca Escolar</h4>
        <p><strong>Navegação:</strong></p>
        <ul>
            <li>Use os botões grandes para navegar entre as seções</li>
            <li>Use os controles no topo para ajustar fonte e contraste</li>
            <li>Pressione Tab para navegar pelos elementos</li>
        </ul>
        <p><strong>Funcionalidades:</strong></p>
        <ul>
            <li><strong>Buscar Livros:</strong> Digite o título, autor ou ISBN</li>
            <li><strong>Empréstimos:</strong> Selecione usuário e exemplar disponível</li>
            <li><strong>Devoluções:</strong> Encontre o empréstimo e registre a devolução</li>
        </ul>
        <p><strong>Dicas:</strong></p>
        <ul>
            <li>Livros disponíveis aparecem em verde</li>
            <li>Livros emprestados aparecem em vermelho</li>
            <li>Empréstimos em atraso são destacados na página inicial</li>
        </ul>
    `;
    
    // Criar modal de ajuda
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Ajuda</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    ${helpContent}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Fechar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Remover modal do DOM após fechar
    modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
    });
}

/**
 * Buscar utentes em tempo real
 */
function searchUtentes(inputId, resultsId) {
    const input = document.getElementById(inputId);
    const results = document.getElementById(resultsId);
    
    if (!input || !results) return;
    
    input.addEventListener('input', function() {
        const query = this.value.trim();
        
        if (query.length < 2) {
            results.innerHTML = '';
            results.style.display = 'none';
            return;
        }
        
        // Buscar utentes usando a nova API JavaScript
        fetch(`/api/utentes/search?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                displaySearchResults(results, data);
            })
            .catch(error => {
                console.error('Erro na busca:', error);
            });
    });
}

/**
 * Exibir resultados de busca
 */
function displaySearchResults(container, results) {
    if (!results || results.length === 0) {
        container.innerHTML = '<div class="text-muted">Nenhum usuário encontrado</div>';
        container.style.display = 'block';
        return;
    }
    
    const html = results.map(utente => `
        <div class="search-result-item" onclick="selectUtente('${utente.ut_cod}', '${utente.nome_completo}')">
            <strong>${utente.nome_completo}</strong>
            <br>
            <small class="text-muted">${utente.ut_email || 'Sem email'}</small>
        </div>
    `).join('');
    
    container.innerHTML = html;
    container.style.display = 'block';
}

/**
 * Selecionar utente
 */
function selectUtente(utenteId, nomeCompleto) {
    // Implementar lógica para selecionar utente
    console.log('Utente selecionado:', utenteId, nomeCompleto);
}

/**
 * Inicializar funcionalidades quando o DOM estiver carregado
 */
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar controles de acessibilidade
    updateFontSizeButtons();
    
    // Adicionar animação de fade-in aos cards
    const cards = document.querySelectorAll('.shortcut-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
    
    // Adicionar tooltips aos botões
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Melhorar navegação por teclado
    document.addEventListener('keydown', function(e) {
        // Ctrl + + para aumentar fonte
        if (e.ctrlKey && e.key === '=') {
            e.preventDefault();
            increaseFontSize();
        }
        
        // Ctrl + - para diminuir fonte
        if (e.ctrlKey && e.key === '-') {
            e.preventDefault();
            decreaseFontSize();
        }
        
        // Ctrl + Shift + C para alternar contraste
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            e.preventDefault();
            toggleHighContrast();
        }
    });
});

/**
 * Função para exibir loading
 */
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="loading"></div> Carregando...';
    }
}

/**
 * Função para esconder loading
 */
function hideLoading(elementId, originalContent) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = originalContent;
    }
}
