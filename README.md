# Sistema de Biblioteca Escolar

Sistema completo de gestão de biblioteca desenvolvido especificamente para ser **acessível e fácil de usar por idosos**, com interface limpa, fontes grandes e navegação intuitiva.

## 🎯 Características Principais

### Acessibilidade e Usabilidade
- **Interface limpa** com fontes grandes (18px base)
- **Alto contraste** para melhor legibilidade
- **Botões grandes** com labels descritivos
- **Navegação simples** sem menus escondidos
- **Controles de acessibilidade** (aumentar/diminuir fonte, modo alto contraste)
- **Validação clara** de formulários
- **Mensagens de erro amigáveis**

### Funcionalidades
- ✅ **Busca de livros** por título, autor, ISBN, editora ou gênero
- ✅ **Gestão de empréstimos** com transações seguras
- ✅ **Registro de devoluções** com controle de atrasos
- ✅ **CRUD de usuários** com validação de email único
- ✅ **Relatórios detalhados** com filtros
- ✅ **Sistema de notificações** para empréstimos em atraso

## 🛠️ Tecnologias Utilizadas

- **Backend**: PHP 7.4+ com MySQLi
- **Frontend**: HTML5, CSS3, Bootstrap 5
- **JavaScript**: Vanilla JS (mínimo para acessibilidade)
- **Banco de Dados**: MySQL/MariaDB
- **Servidor**: Apache (XAMPP)

## 📁 Estrutura do Projeto

```
gm_biblioteca/
├── public/                    # Ponto de entrada para o navegador
│   ├── index.php             # Página inicial
│   ├── livros.php            # Busca de livros
│   ├── livro_ver.php         # Detalhes do livro
│   ├── emprestimos.php       # Gestão de empréstimos
│   ├── devolucoes.php        # Registro de devoluções
│   ├── utentes.php           # CRUD de usuários
│   ├── relatorios.php        # Relatórios da biblioteca
│   └── assets/
│       ├── css/
│       │   └── style.css     # Estilos personalizados
│       └── js/
│           └── main.js       # Funcionalidades JavaScript
├── includes/
│   ├── db.php               # Conexão com banco de dados
│   ├── header.php           # Cabeçalho comum
│   ├── footer.php           # Rodapé comum
│   └── functions.php        # Funções auxiliares
├── admin/                   # Área administrativa (futura)
├── sql/
│   └── sample_seed.sql      # Dados de exemplo
└── README.md               # Este arquivo
```

## 🚀 Instalação e Configuração

### Pré-requisitos
- **XAMPP** instalado e funcionando
- **PHP 7.4+**
- **MySQL/MariaDB**
- **Apache**

### Passo 1: Configurar o Banco de Dados

1. **Inicie o XAMPP** e certifique-se de que Apache e MySQL estão rodando

2. **Acesse o phpMyAdmin** (http://localhost/phpmyadmin)

3. **Importe o dump do banco de dados**:
   - Crie um novo banco chamado `gm_biblioteca`
   - Importe o arquivo SQL fornecido (dump principal)
   - Execute o arquivo `sql/sample_seed.sql` para popular com dados de exemplo

### Passo 2: Configurar o Projeto

1. **Copie os arquivos** para a pasta `htdocs` do XAMPP:
   ```
   C:\xampp\htdocs\gm_biblioteca\
   ```

2. **Verifique as configurações** do banco de dados em `includes/db.php`:
   ```php
   $host = '127.0.0.1';
   $username = 'root';
   $password = '';
   $database = 'gm_biblioteca';
   ```

3. **Ajuste as permissões** (se necessário):
   - Certifique-se de que o Apache tem permissão para ler os arquivos
   - Verifique se o PHP pode conectar ao MySQL

### Passo 3: Testar a Instalação

1. **Acesse o sistema** em: http://localhost/gm_biblioteca/

2. **Verifique se**:
   - A página inicial carrega corretamente
   - Os dados de exemplo estão visíveis
   - A busca de livros funciona
   - Os empréstimos podem ser registrados

## 📊 Schema do Banco de Dados

### Tabelas Principais

- **`livro`**: Informações dos livros (título, autor, editora, etc.)
- **`livro_exemplar`**: Exemplares físicos dos livros
- **`utente`**: Usuários da biblioteca
- **`requisicao`**: Empréstimos e devoluções
- **`autor`**: Autores dos livros
- **`editora`**: Editoras
- **`genero`**: Gêneros literários
- **`codigo_postal`**: Códigos postais

### Campos Importantes

- **`lex_disponivel`**: 1 = disponível, 0 = emprestado
- **`re_data_devolucao`**: NULL = empréstimo ativo, data = devolvido
- **`uk_utente_email`**: Chave única para email de usuário

## 🎮 Como Usar o Sistema

### Para Bibliotecários

1. **Página Inicial**: Acesse todos os atalhos principais
2. **Buscar Livros**: Digite título, autor ou ISBN
3. **Registrar Empréstimo**: Selecione usuário e exemplar disponível
4. **Registrar Devolução**: Encontre o empréstimo ativo e confirme
5. **Gerenciar Usuários**: Adicione, edite ou visualize usuários
6. **Relatórios**: Visualize estatísticas e históricos

### Funcionalidades de Acessibilidade

- **Controles de Fonte**: Use os botões A+ e A- no topo
- **Alto Contraste**: Ative o modo alto contraste
- **Navegação por Teclado**: Use Tab para navegar
- **Atalhos de Teclado**:
  - `Ctrl + +`: Aumentar fonte
  - `Ctrl + -`: Diminuir fonte
  - `Ctrl + Shift + C`: Alternar contraste

## 🔒 Segurança

### Implementações de Segurança

- **Prepared Statements**: Todas as queries usam prepared statements
- **Sanitização**: Todos os inputs são sanitizados com `htmlspecialchars`
- **Transações**: Operações críticas usam transações MySQL
- **Validação Server-side**: Validação obrigatória no servidor
- **Escape de Output**: Todo output é escapado

### Boas Práticas

- Sempre use HTTPS em produção
- Mantenha o PHP atualizado
- Configure corretamente as permissões de arquivo
- Faça backups regulares do banco de dados

## 🐛 Solução de Problemas

### Problemas Comuns

1. **Erro de Conexão com Banco**:
   - Verifique se MySQL está rodando
   - Confirme as credenciais em `includes/db.php`
   - Teste a conexão no phpMyAdmin

2. **Páginas não Carregam**:
   - Verifique se Apache está rodando
   - Confirme se os arquivos estão na pasta correta
   - Verifique os logs de erro do Apache

3. **Erro de Permissão**:
   - Verifique as permissões da pasta
   - Certifique-se de que o Apache tem acesso

4. **JavaScript não Funciona**:
   - Verifique o console do navegador
   - Confirme se Bootstrap está carregando
   - Teste em diferentes navegadores

### Logs Úteis

- **Apache**: `C:\xampp\apache\logs\error.log`
- **MySQL**: `C:\xampp\mysql\data\*.err`
- **PHP**: Verifique `php.ini` para configurações de log

## 📈 Próximos Passos

### Melhorias Futuras

- [ ] **Área Administrativa**: CRUD completo para livros, autores, editoras
- [ ] **Sistema de Reservas**: Permitir reservas de livros
- [ ] **Notificações por Email**: Avisos automáticos de vencimento
- [ ] **Relatórios Avançados**: Gráficos e estatísticas detalhadas
- [ ] **Backup Automático**: Sistema de backup do banco
- [ ] **Multi-idioma**: Suporte a outros idiomas

### Personalização

- **Cores**: Modifique as variáveis CSS em `style.css`
- **Fontes**: Altere as fontes nas configurações CSS
- **Layout**: Ajuste o Bootstrap conforme necessário
- **Funcionalidades**: Adicione novas features seguindo o padrão existente

## 📞 Suporte

### Documentação Adicional

- **Bootstrap 5**: https://getbootstrap.com/docs/5.3/
- **PHP MySQLi**: https://www.php.net/manual/en/book.mysqli.php
- **XAMPP**: https://www.apachefriends.org/docs/

### Contato

Para suporte técnico ou dúvidas sobre o sistema, consulte a documentação ou entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com foco em acessibilidade e usabilidade para todos os usuários, especialmente idosos.**
