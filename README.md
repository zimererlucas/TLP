# Biblioteca Escolar - Sistema de Gestão

Sistema de gestão de biblioteca escolar **completamente migrado** de PHP/MySQL para **Next.js** com **Supabase** (PostgreSQL).

## ✅ Migração Finalizada

Este projeto foi **100% migrado** e **todos os arquivos PHP foram removidos**:

### ❌ Removido Completamente
- ✅ Todos os arquivos `.php` (index.php, conexao.php, login.php, etc.)
- ✅ Todas as dependências PHP
- ✅ Todas as referências a arquivos PHP em HTML/JS
- ✅ Conexões MySQL
- ✅ Sessões PHP

### ✅ Implementado
- **Next.js/JavaScript** → Ponto de entrada principal
- **Supabase (PostgreSQL)** → Banco de dados moderno
- **API Routes** → Substitui todos os endpoints PHP
- **React Components** → Interface moderna
- **Bootstrap 5** → Design original preservado
- **Vercel Ready** → Deploy sem PHP

## ✨ Funcionalidades

- 📚 **Busca de Livros** - Pesquisa por título, autor, ISBN, editora ou gênero
- 📖 **Gestão de Empréstimos** - Registro e controle de empréstimos
- ↩️ **Devoluções** - Registro de devoluções com controle de atrasos
- 👥 **Gestão de Usuários** - Cadastro e edição de usuários
- 📊 **Relatórios** - Estatísticas e relatórios detalhados
- ⚙️ **Área Administrativa** - Gestão de livros, autores, editoras e gêneros
- ♿ **Acessibilidade** - Controles de fonte, contraste e navegação por teclado

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js 14, React 18, JavaScript
- **Backend**: Supabase (PostgreSQL)
- **Estilização**: Bootstrap 5.3.0 (mantido do projeto original)
- **Ícones**: Font Awesome 6.0.0
- **Deploy**: Vercel/Netlify ready

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

## 🚀 Instalação e Configuração

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd biblioteca-escolar-nextjs
```

### 2. Instale as dependências

```bash
npm install
# ou
yarn install
```

### 3. Configure o Supabase

#### 3.1. Crie um projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova conta ou faça login
3. Clique em "New Project"
4. Escolha sua organização e configure o projeto

#### 3.2. Execute o schema SQL
1. No painel do Supabase, vá para "SQL Editor"
2. Execute o conteúdo do arquivo `supabase-schema.sql`
3. Isso criará todas as tabelas, índices, triggers e dados de exemplo

#### 3.3. Configure as variáveis de ambiente
1. Copie o arquivo `env.example` para `.env.local`:
```bash
cp env.example .env.local
```

2. Edite `.env.local` com suas credenciais do Supabase:
```env
# Configurações do Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Configurações de desenvolvimento
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Configurações opcionais
NODE_ENV=development
```

**Onde encontrar as credenciais:**
- No painel do Supabase, vá em "Settings" → "API"
- Copie a "Project URL" para `SUPABASE_URL`
- Copie a "anon public" key para `SUPABASE_ANON_KEY`

### 4. Execute o projeto

```bash
npm run dev
# ou
yarn dev
```

O projeto estará disponível em `http://localhost:3000`

## 📁 Estrutura do Projeto

```
biblioteca-escolar-nextjs/
├── components/           # Componentes React reutilizáveis
│   └── Layout.tsx       # Layout principal (substitui header.php/footer.php)
├── lib/                 # Configurações e utilitários
│   └── supabaseClient.js # Cliente Supabase e funções auxiliares
├── pages/               # Páginas da aplicação
│   ├── api/             # API Routes (substitui endpoints PHP)
│   │   ├── livros.js    # CRUD completo de livros
│   │   ├── autores.js   # CRUD de autores
│   │   ├── utentes.js   # CRUD de utentes
│   │   ├── editoras.js  # CRUD de editoras
│   │   ├── requisicoes.js # CRUD de empréstimos
│   │   ├── exemplares.js # Busca de exemplares
│   │   ├── generos.js   # CRUD de gêneros
│   │   ├── codigos-postais.js # Busca de códigos postais
│   │   └── utentes/     # APIs específicas de utentes
│   │       └── search.js # Busca de utentes (autocomplete)
│   ├── admin/           # Área administrativa
│   ├── livro/           # Páginas de detalhes do livro
│   ├── _app.tsx         # Configuração global
│   ├── index.tsx        # Página inicial
│   ├── livros.tsx       # Busca de livros
│   ├── gestao-livros.js # Gestão completa de livros (exemplo)
│   ├── emprestimos.tsx  # Gestão de empréstimos
│   ├── devolucoes.tsx   # Gestão de devoluções
│   ├── utentes.tsx      # Gestão de usuários
│   └── relatorios.tsx   # Relatórios
├── styles/              # Estilos CSS
│   └── globals.css      # Estilos globais (convertido do CSS original)
├── supabase-schema.sql  # Schema do banco de dados
├── package.json         # Dependências do projeto
├── next.config.js       # Configuração do Next.js
├── env.example          # Exemplo de variáveis de ambiente
└── README.md           # Este arquivo
```

## 🔄 Comparação: PHP vs Next.js

| Aspecto | PHP Original | Next.js Migrado |
|---------|--------------|-----------------|
| **Backend** | MySQL + mysqli | Supabase (PostgreSQL) |
| **Frontend** | PHP + Bootstrap | React + Bootstrap |
| **Roteamento** | Arquivos .php | Next.js Router |
| **API** | Endpoints PHP | API Routes |
| **Sessões** | $_SESSION | Supabase Auth |
| **Banco** | Queries SQL | Supabase SDK |
| **Deploy** | Servidor PHP | Vercel/Netlify |

## 🗄️ Estrutura do Banco de Dados

O banco foi migrado de MySQL para PostgreSQL mantendo a mesma estrutura:

### Tabelas Principais
- `utente` - Usuários da biblioteca (com NIF e auth_user_id)
- `livro` - Catálogo de livros (com edição)
- `autor` - Autores dos livros
- `editora` - Editoras (com morada, email, telefone)
- `genero` - Gêneros literários
- `livro_exemplar` - Exemplares físicos
- `requisicao` - Empréstimos e devoluções
- `codigo_postal` - Códigos postais portugueses

### Relacionamentos
- Livro → Autor (N:1)
- Livro → Editora (N:1)
- Livro → Gênero (N:1)
- Livro → Exemplares (1:N)
- Utente → Requisições (1:N)
- Exemplar → Requisições (1:N)
- Editora → Código Postal (N:1)
- Utente → Código Postal (N:1)

## 🔌 APIs Criadas

O projeto inclui APIs REST completas para todas as operações:

### APIs Principais
- **`/api/livros`** - CRUD completo de livros (GET, POST, PUT, DELETE)
- **`/api/autores`** - CRUD de autores (GET, POST, PUT, DELETE)
- **`/api/utentes`** - CRUD de utentes (GET, POST, PUT, DELETE)
- **`/api/editoras`** - CRUD de editoras (GET, POST, PUT, DELETE)
- **`/api/requisicoes`** - CRUD de empréstimos (GET, POST, PUT, DELETE)

### APIs Auxiliares
- **`/api/utentes/search`** - Busca de utentes (autocomplete)
- **`/api/exemplares`** - Busca de exemplares disponíveis
- **`/api/generos`** - CRUD de gêneros literários
- **`/api/codigos-postais`** - Busca de códigos postais

### Funcionalidades das APIs
- ✅ **Paginação** - Todas as APIs suportam paginação
- ✅ **Busca** - Filtros de busca em tempo real
- ✅ **Validação** - Validação de dados de entrada
- ✅ **Relacionamentos** - Dados relacionados incluídos nas respostas
- ✅ **Tratamento de Erros** - Mensagens de erro claras
- ✅ **CORS** - Configurado para requisições do frontend

## 🚀 Deploy

### Vercel (Recomendado)

1. **Conecte o repositório ao Vercel:**
   - Acesse [vercel.com](https://vercel.com)
   - Importe o projeto do GitHub
   - Configure as variáveis de ambiente

2. **Configure as variáveis de ambiente no Vercel:**
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Deploy automático:**
   - O Vercel fará deploy automaticamente a cada push
   - O projeto estará disponível em `https://seu-projeto.vercel.app`

### Netlify

1. **Conecte o repositório ao Netlify:**
   - Acesse [netlify.com](https://netlify.com)
   - Importe o projeto do GitHub
   - Configure as variáveis de ambiente

2. **Configure o build:**
   ```
   Build command: npm run build
   Publish directory: .next
   ```

## 🎯 Status da Migração

### ✅ Completamente Finalizada
- **0 arquivos PHP** restantes no projeto
- **100% JavaScript/TypeScript** 
- **100% Supabase** (sem MySQL)
- **100% Vercel Compatible** (sem PHP)
- **Design Bootstrap preservado** integralmente

### 🔄 Conversões Realizadas
| Arquivo PHP Original | Arquivo Next.js Migrado | Status |
|---------------------|-------------------------|---------|
| `index.php` | `pages/index.tsx` | ✅ Migrado |
| `livros.php` | `pages/livros.tsx` | ✅ Migrado |
| `livro_ver.php` | `pages/livro/[id].tsx` | ✅ Migrado |
| `utentes.php` | `pages/utentes.tsx` | ✅ Migrado |
| `emprestimos.php` | `pages/emprestimos.tsx` | ✅ Migrado |
| `devolucoes.php` | `pages/devolucoes.tsx` | ✅ Migrado |
| `relatorios.php` | `pages/relatorios.tsx` | ✅ Migrado |
| `admin/index.php` | `pages/admin/` | ✅ Migrado |
| `includes/header.php` | `components/Layout.tsx` | ✅ Migrado |
| `includes/footer.php` | `components/Layout.tsx` | ✅ Migrado |
| `includes/db.php` | `lib/supabaseClient.js` | ✅ Migrado |
| `api/search_utentes.php` | `pages/api/utentes/search.js` | ✅ Migrado |

### 🗑️ Arquivos Removidos
- ❌ `index.php` - Removido
- ❌ `livros.php` - Removido  
- ❌ `livro_ver.php` - Removido
- ❌ `utentes.php` - Removido
- ❌ `emprestimos.php` - Removido
- ❌ `devolucoes.php` - Removido
- ❌ `relatorios.php` - Removido
- ❌ `admin/index.php` - Removido
- ❌ `includes/header.php` - Removido
- ❌ `includes/footer.php` - Removido
- ❌ `includes/db.php` - Removido
- ❌ `includes/functions.php` - Removido
- ❌ `api/search_utentes.php` - Removido

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Produção
npm run build        # Gera build de produção
npm run start        # Inicia servidor de produção

# Qualidade de código
npm run lint         # Executa ESLint
```

## 🎨 Personalização

### Cores e Estilos
O projeto mantém o CSS original convertido para `styles/globals.css`. Você pode personalizar:
- Cores principais nas variáveis CSS
- Tamanhos de fonte
- Espaçamentos
- Animações

### Funcionalidades
- Adicione novas páginas em `pages/`
- Crie novos componentes em `components/`
- Implemente novas APIs em `pages/api/`

## 🐛 Solução de Problemas

### Erro de Conexão com Supabase
- Verifique se as variáveis de ambiente estão corretas
- Confirme se o projeto Supabase está ativo
- Verifique se o schema foi executado corretamente

### Erro de Build
- Execute `npm run type-check` para verificar erros TypeScript
- Verifique se todas as dependências estão instaladas
- Confirme se o Node.js está na versão 18+

### Problemas de Performance
- Use o Supabase Dashboard para monitorar queries
- Implemente paginação onde necessário
- Use índices adequados no banco de dados

## 📚 Documentação Adicional

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Equipe

- **Migração**: Assistente de Desenvolvimento AI
- **Projeto Original**: Sistema PHP de Biblioteca Escolar
- **Tecnologias**: Next.js, Supabase, TypeScript, Bootstrap

## 📞 Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Consulte a documentação das tecnologias utilizadas
- Verifique os logs do Supabase Dashboard

---

**🎉 Parabéns! Sua biblioteca escolar agora está rodando com tecnologias modernas e pronta para deploy em qualquer plataforma!**