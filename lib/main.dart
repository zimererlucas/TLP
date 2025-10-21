import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: 'https://xwmtuvdyhmnicutsumke.supabase.co',
    anonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3bXR1dmR5aG1uaWN1dHN1bWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyMzc0NzgsImV4cCI6MjA3NDgxMzQ3OH0.SrrI87xSOpwWJo_4D5-VrqBn8eZ-lOrTxGqLl3eJxCU',
  );

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Biblioteca',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
      ),
      home: StreamBuilder<AuthState>(
        stream: Supabase.instance.client.auth.onAuthStateChange,
        builder: (context, snapshot) {
          final session = snapshot.data?.session;
          return session == null ? const AuthScreen() : const HomeScreen();
        },
      ),
    );
  }
}

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final emailCtrl = TextEditingController();
  final passCtrl = TextEditingController();
  bool isLogin = true;
  bool loading = false;

  // 🔹 Login com Google
  Future<void> signInWithGoogle() async {
    setState(() => loading = true);
    try {
      final redirectUrl =
          kIsWeb ? Uri.base.origin : 'io.supabase.flutter://callback';
      await Supabase.instance.client.auth.signInWithOAuth(
        OAuthProvider.google,
        redirectTo: redirectUrl,
      );
    } on AuthException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao fazer login com Google: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  // 🔹 Login/Registo por email e senha
  Future<void> submit() async {
    if (loading) return;
    setState(() => loading = true);

    try {
      if (isLogin) {
        await Supabase.instance.client.auth.signInWithPassword(
          email: emailCtrl.text.trim(),
          password: passCtrl.text,
        );
      } else {
        await Supabase.instance.client.auth.signUp(
          email: emailCtrl.text.trim(),
          password: passCtrl.text,
        );
      }
      // Navigation handled by MyApp's StreamBuilder
    } on AuthException catch (e) {
      _showError(e.message);
    } catch (e) {
      _showError('Erro inesperado: $e');
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(isLogin ? 'Entrar' : 'Registar')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: emailCtrl,
              decoration: const InputDecoration(labelText: 'Email'),
              keyboardType: TextInputType.emailAddress,
            ),
            TextField(
              controller: passCtrl,
              decoration: const InputDecoration(labelText: 'Senha'),
              obscureText: true,
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: loading ? null : submit,
              child: Text(loading ? '...' : (isLogin ? 'Entrar' : 'Registar')),
            ),
            TextButton(
              onPressed: () => setState(() => isLogin = !isLogin),
              child: Text(isLogin ? 'Criar conta' : 'Já tenho conta'),
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              icon: const Icon(Icons.login, color: Colors.red),
              label: const Text('Entrar com Google'),
              onPressed: loading ? null : signInWithGoogle,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.black,
                minimumSize: const Size(double.infinity, 48),
                side: const BorderSide(color: Colors.grey),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    emailCtrl.dispose();
    passCtrl.dispose();
    super.dispose();
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Biblioteca'),
        actions: [
          Builder(
            builder:
                (context) => IconButton(
                  onPressed: () => Scaffold.of(context).openDrawer(),
                  icon: const Icon(Icons.person),
                ),
          ),
          IconButton(
            onPressed: () async {
              await Supabase.instance.client.auth.signOut();
              // Navigation handled by MyApp's StreamBuilder
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.primary,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: Theme.of(context).colorScheme.onPrimary,
                    child: Icon(
                      Icons.person,
                      size: 40,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  FutureBuilder(
                    future: _getUserInfo(),
                    builder: (context, snapshot) {
                      if (snapshot.hasData) {
                        final userInfo = snapshot.data!;
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              userInfo['name'] ?? 'Utilizador',
                              style: Theme.of(
                                context,
                              ).textTheme.titleLarge?.copyWith(
                                color: Theme.of(context).colorScheme.onPrimary,
                              ),
                            ),
                            Text(
                              userInfo['email'] ?? '',
                              style: Theme.of(
                                context,
                              ).textTheme.bodyMedium?.copyWith(
                                color: Theme.of(
                                  context,
                                ).colorScheme.onPrimary.withValues(alpha: 0.8),
                              ),
                            ),
                          ],
                        );
                      }
                      return Text(
                        'Utilizador',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          color: Theme.of(context).colorScheme.onPrimary,
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.menu_book),
              title: const Text('Livros'),
              onTap: () {
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: const Icon(Icons.list_alt),
              title: const Text('Minhas Requisições'),
              onTap: () {
                Navigator.pop(context);
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const RequisitionsScreen()),
                );
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.logout),
              title: const Text('Sair'),
              onTap: () async {
                Navigator.pop(context);
                await Supabase.instance.client.auth.signOut();
              },
            ),
          ],
        ),
      ),
      body: const BooksList(),
    );
  }

  Future<Map<String, String?>> _getUserInfo() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return {'name': null, 'email': null};

    return {
      'name': user.userMetadata?['name'] ?? user.email?.split('@').first,
      'email': user.email,
    };
  }
}

class BooksList extends StatefulWidget {
  const BooksList({super.key});

  @override
  State<BooksList> createState() => _BooksListState();
}

class _BooksListState extends State<BooksList> {
  late Future<List<Map<String, dynamic>>> _booksFuture;
  final TextEditingController _searchCtrl = TextEditingController();
  String _query = '';
  final Set<int> _justReserved = <int>{};
  int _activeLoanCount = 0;
  List<Map<String, dynamic>> _pendingReservations = [];
  final Set<int> _userLoanedBookIds = <int>{};

  @override
  void initState() {
    super.initState();
    _booksFuture = _fetchBooks();
    _checkActiveReservation();
    _loadActiveUserBookIds();
    _fetchPendingReservations();
  }

  Future<List<Map<String, dynamic>>> _fetchBooks() async {
    final res = await Supabase.instance.client
        .from('vw_livro_disponibilidade')
        .select('*')
        .order('li_cod');
    return (res as List).cast<Map<String, dynamic>>();
  }

  Future<void> _refresh() async {
    final fut = _fetchBooks();
    setState(() {
      _booksFuture = fut;
    });
    await Future.wait([
      fut,
      _checkActiveReservation(),
      _loadActiveUserBookIds(),
      _fetchPendingReservations(),
    ]);
  }

  Future<void> _reservar(int liCod) async {
    try {
      final utenteId = await _getOrCreateUtenteId();
      await Supabase.instance.client.from('reserva').insert({
        'res_ut_cod': utenteId,
        'res_li_cod': liCod,
        'res_data': DateTime.now().toIso8601String(),
      });
      if (mounted) {
        _justReserved.add(liCod);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Livro reservado com sucesso')),
        );
        // Refresh the list
        setState(() {
          _booksFuture = _fetchBooks();
        });
        await Future.wait([
          _checkActiveReservation(),
          _loadActiveUserBookIds(),
        ]);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Erro na reserva: $e')));
      }
    }
  }

  // requisitar desativado: sem ação quando não há disponibilidade

  Future<int?> _getOrCreateUtenteId() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return null;
    try {
      final rows = await Supabase.instance.client
          .from('utente')
          .select('ut_cod')
          .eq('auth_user_id', user.id)
          .limit(1);
      if (rows.isNotEmpty) return rows.first['ut_cod'] as int;
      final created =
          await Supabase.instance.client
              .from('utente')
              .insert({
                'ut_nome': user.email ?? 'Utilizador',
                'ut_email': user.email,
                'auth_user_id': user.id,
              })
              .select('ut_cod')
              .single();
      return created['ut_cod'] as int;
    } catch (e) {
      return null;
    }
  }

  Future<void> _checkActiveReservation() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return;
      final utenteRows = await Supabase.instance.client
          .from('utente')
          .select('ut_cod')
          .eq('auth_user_id', user.id)
          .limit(1);
      if (utenteRows.isEmpty) {
        if (mounted) setState(() => _activeLoanCount = 0);
        return;
      }
      final utenteId = utenteRows.first['ut_cod'] as int;
      final active = await Supabase.instance.client
          .from('requisicao')
          .select('re_cod')
          .eq('re_ut_cod', utenteId)
          .isFilter('re_data_devolucao', null);
      if (mounted) setState(() => _activeLoanCount = active.length);
    } catch (e) {
      if (mounted) setState(() => _activeLoanCount = 0);
    }
  }

  Future<void> _loadActiveUserBookIds() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return;
      final utenteRows = await Supabase.instance.client
          .from('utente')
          .select('ut_cod')
          .eq('auth_user_id', user.id)
          .limit(1);
      if (utenteRows.isEmpty) {
        if (mounted) setState(() => _userLoanedBookIds.clear());
        return;
      }
      final utenteId = utenteRows.first['ut_cod'] as int;
      final loans = await Supabase.instance.client
          .from('requisicao')
          .select('re_lex_cod')
          .eq('re_ut_cod', utenteId)
          .isFilter('re_data_devolucao', null);
      final lexCodes =
          (loans as List).map((e) => e['re_lex_cod'] as int).toList();
      if (lexCodes.isEmpty) {
        if (mounted) setState(() => _userLoanedBookIds.clear());
        return;
      }
      final exemplares = await Supabase.instance.client
          .from('exemplar')
          .select('lex_cod, li_cod')
          .inFilter('lex_cod', lexCodes);
      final liIds =
          (exemplares as List).map((e) => (e['li_cod'] as num).toInt()).toSet();
      if (mounted) {
        setState(() {
          _userLoanedBookIds
            ..clear()
            ..addAll(liIds);
        });
      }
    } catch (e) {
      // ignore errors
    }
  }

  Future<void> _fetchPendingReservations() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) return;
      final utenteRows = await Supabase.instance.client
          .from('utente')
          .select('ut_cod')
          .eq('auth_user_id', user.id)
          .limit(1);
      if (utenteRows.isEmpty) {
        if (mounted) setState(() => _pendingReservations.clear());
        return;
      }
      final utenteId = utenteRows.first['ut_cod'] as int;
      final reservations = await Supabase.instance.client
          .from('reserva')
          .select('*, livro ( li_titulo )')
          .eq('res_ut_cod', utenteId)
          .order('res_data', ascending: false);
      if (mounted) {
        setState(() {
          _pendingReservations =
              (reservations as List).cast<Map<String, dynamic>>();
        });
      }
    } catch (e) {
      if (mounted) setState(() => _pendingReservations.clear());
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: _booksFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }
        if (!snapshot.hasData || snapshot.hasError) {
          return const Center(
            child: Text('Erro ao carregar livros. Tente novamente.'),
          );
        }
        final books = snapshot.data!;
        if (books.isEmpty) {
          return const Center(child: Text('Nenhum livro disponível.'));
        }
        final filtered =
            books.where((b) {
              if (_query.isEmpty) return true;
              final title = (b['li_titulo'] as String? ?? '').toLowerCase();
              return title.contains(_query.toLowerCase());
            }).toList();

        return Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
              child: TextField(
                controller: _searchCtrl,
                decoration: const InputDecoration(
                  labelText: 'Pesquisar livros',
                  prefixIcon: Icon(Icons.search),
                  border: OutlineInputBorder(),
                ),
                onChanged: (v) => setState(() => _query = v),
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _refresh,
                child: ListView.builder(
                  itemCount: filtered.length,
                  itemBuilder: (_, i) {
                    final b = filtered[i];
                    final disponiveis = (b['disponiveis'] as int? ?? 0);
                    return ListTile(
                      title: Text(b['li_titulo'] as String),
                      subtitle: Text('Disponíveis: $disponiveis'),
                      trailing: () {
                        final liCod = (b['li_cod'] as num).toInt();
                        if (_userLoanedBookIds.contains(liCod)) {
                          return const SizedBox.shrink();
                        }
                        return ElevatedButton(
                          onPressed:
                              (disponiveis > 0 && _activeLoanCount < 5)
                                  ? () => _reservar(liCod)
                                  : null,
                          child: const Text('Reservar'),
                        );
                      }(),
                    );
                  },
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }
}

class RequisitionsScreen extends StatefulWidget {
  const RequisitionsScreen({super.key});

  @override
  State<RequisitionsScreen> createState() => _RequisitionsScreenState();
}

class _RequisitionsScreenState extends State<RequisitionsScreen> {
  late Future<List<Map<String, dynamic>>> _loansFuture;
  final TextEditingController _bookFilterCtrl = TextEditingController();
  final TextEditingController _authorFilterCtrl = TextEditingController();
  DateTime? _startDate;
  DateTime? _endDate;
  List<Map<String, dynamic>> _allLoans = [];

  @override
  void initState() {
    super.initState();
    _loansFuture = _fetchLoans();
  }

  Future<int?> _getOrCreateUtenteId() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return null;
    try {
      final rows = await Supabase.instance.client
          .from('utente')
          .select('ut_cod')
          .eq('auth_user_id', user.id)
          .limit(1);
      if (rows.isNotEmpty) return rows.first['ut_cod'] as int;
      final created =
          await Supabase.instance.client
              .from('utente')
              .insert({
                'ut_nome': user.email ?? 'Utilizador',
                'ut_email': user.email,
                'auth_user_id': user.id,
              })
              .select('ut_cod')
              .single();
      return created['ut_cod'] as int;
    } catch (e) {
      return null;
    }
  }

  Future<List<Map<String, dynamic>>> _fetchLoans() async {
    final utenteId = await _getOrCreateUtenteId();
    if (utenteId == null) return <Map<String, dynamic>>[];

    final rows = await Supabase.instance.client
        .from('requisicao')
        .select('*')
        .eq('re_ut_cod', utenteId)
        .order('re_data_requisicao', ascending: false);
    final loans = (rows as List).cast<Map<String, dynamic>>();
    if (loans.isEmpty) return loans;

    try {
      final lexCodes =
          loans
              .map((l) => l['re_lex_cod'])
              .where((v) => v != null)
              .map((v) => (v as num).toInt())
              .toSet()
              .toList();
      if (lexCodes.isEmpty) return loans;
      final exemplares = await Supabase.instance.client
          .from('exemplar')
          .select('lex_cod, livro ( li_titulo )')
          .inFilter('lex_cod', lexCodes);
      final lexToTitulo = <int, String>{};
      for (final e in (exemplares as List)) {
        final lex = (e['lex_cod'] as num?)?.toInt();
        final livro = e['livro'] as Map<String, dynamic>?;
        final titulo =
            livro != null ? (livro['li_titulo'] as String? ?? '') : '';
        if (lex != null && titulo.isNotEmpty) {
          lexToTitulo[lex] = titulo;
        }
      }

      for (final l in loans) {
        final lex = (l['re_lex_cod'] as num?)?.toInt();
        if (lex != null && lexToTitulo.containsKey(lex)) {
          l['li_titulo'] = lexToTitulo[lex];
        }
      }
    } catch (e) {
      // Falha ao enriquecer com título (tabela/visão em falta). Segue sem título.
    }
    _allLoans = loans;
    return loans;
  }

  Future<void> _refreshLoans() async {
    final fut = _fetchLoans();
    setState(() {
      _loansFuture = fut;
    });
    await fut;
  }

  List<Map<String, dynamic>> _getFilteredLoans() {
    return _allLoans.where((loan) {
      // Filter by book title
      if (_bookFilterCtrl.text.isNotEmpty) {
        final title = (loan['li_titulo'] as String? ?? '').toLowerCase();
        if (!title.contains(_bookFilterCtrl.text.toLowerCase())) {
          return false;
        }
      }

      // Filter by author (if available in loan data)
      if (_authorFilterCtrl.text.isNotEmpty) {
        final author = (loan['li_autor'] as String? ?? '').toLowerCase();
        if (!author.contains(_authorFilterCtrl.text.toLowerCase())) {
          return false;
        }
      }

      // Filter by date range
      if (_startDate != null || _endDate != null) {
        final loanDate = DateTime.tryParse(
          loan['re_data_requisicao'] as String? ?? '',
        );
        if (loanDate == null) return false;

        if (_startDate != null && loanDate.isBefore(_startDate!)) {
          return false;
        }
        if (_endDate != null &&
            loanDate.isAfter(_endDate!.add(const Duration(days: 1)))) {
          return false;
        }
      }

      return true;
    }).toList();
  }

  Future<void> _selectDateRange() async {
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      initialDateRange:
          _startDate != null && _endDate != null
              ? DateTimeRange(start: _startDate!, end: _endDate!)
              : null,
    );
    if (picked != null) {
      setState(() {
        _startDate = picked.start;
        _endDate = picked.end;
      });
    }
  }

  void _clearFilters() {
    setState(() {
      _bookFilterCtrl.clear();
      _authorFilterCtrl.clear();
      _startDate = null;
      _endDate = null;
    });
  }

  Future<void> _devolver(int reCod) async {
    try {
      await Supabase.instance.client.rpc(
        'fn_devolver_requisicao',
        params: {'p_re_cod': reCod},
      );
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Requisição devolvida')));
        // Refresh the list
        await _refreshLoans();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Erro na devolução: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Minhas Requisições'),
        actions: [
          IconButton(
            onPressed: _clearFilters,
            icon: const Icon(Icons.clear),
            tooltip: 'Limpar filtros',
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter controls
          Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _bookFilterCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Filtrar por livro',
                          prefixIcon: Icon(Icons.book),
                          border: OutlineInputBorder(),
                        ),
                        onChanged: (_) => setState(() {}),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: TextField(
                        controller: _authorFilterCtrl,
                        decoration: const InputDecoration(
                          labelText: 'Filtrar por autor',
                          prefixIcon: Icon(Icons.person),
                          border: OutlineInputBorder(),
                        ),
                        onChanged: (_) => setState(() {}),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _selectDateRange,
                        icon: const Icon(Icons.date_range),
                        label: Text(
                          _startDate != null && _endDate != null
                              ? '${_startDate!.day}/${_startDate!.month}/${_startDate!.year} - ${_endDate!.day}/${_endDate!.month}/${_endDate!.year}'
                              : 'Selecionar período',
                        ),
                      ),
                    ),
                    if (_startDate != null || _endDate != null)
                      IconButton(
                        onPressed:
                            () => setState(() {
                              _startDate = null;
                              _endDate = null;
                            }),
                        icon: const Icon(Icons.close),
                      ),
                  ],
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          // Loans list
          Expanded(
            child: FutureBuilder(
              key: ValueKey(_loansFuture.hashCode),
              future: _loansFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (!snapshot.hasData || snapshot.hasError) {
                  return const Center(
                    child: Text(
                      'Erro ao carregar requisições. Tente novamente.',
                    ),
                  );
                }
                final loans = _getFilteredLoans();
                if (loans.isEmpty) {
                  return const Center(
                    child: Text('Nenhuma requisição encontrada.'),
                  );
                }
                final activeLoans =
                    loans.where((l) => l['re_data_devolucao'] == null).toList();
                final returnedLoans =
                    loans.where((l) => l['re_data_devolucao'] != null).toList();

                return RefreshIndicator(
                  onRefresh: _refreshLoans,
                  child: ListView(
                    children: [
                      if (activeLoans.isNotEmpty)
                        ExpansionTile(
                          title: Text(
                            'Requisições Ativas (${activeLoans.length})',
                          ),
                          initiallyExpanded: true,
                          children:
                              activeLoans.map((l) {
                                final titulo =
                                    (l['li_titulo'] as String?)?.trim();
                                return ListTile(
                                  title: Text(
                                    (titulo != null && titulo.isNotEmpty)
                                        ? titulo
                                        : 'Exemplar ${l['re_lex_cod']}',
                                  ),
                                  subtitle: Text(
                                    'Data: ${l['re_data_requisicao']}',
                                  ),
                                  trailing: TextButton(
                                    onPressed:
                                        () => _devolver(l['re_cod'] as int),
                                    child: const Text('Devolver'),
                                  ),
                                );
                              }).toList(),
                        ),
                      if (returnedLoans.isNotEmpty)
                        ExpansionTile(
                          title: Text(
                            'Requisições Devolvidas (${returnedLoans.length})',
                          ),
                          initiallyExpanded: false,
                          children:
                              returnedLoans.map((l) {
                                final titulo =
                                    (l['li_titulo'] as String?)?.trim();
                                return ListTile(
                                  title: Text(
                                    (titulo != null && titulo.isNotEmpty)
                                        ? titulo
                                        : 'Exemplar ${l['re_lex_cod']}',
                                  ),
                                  subtitle: Text(
                                    'Data: ${l['re_data_requisicao']}\nDevolução: ${l['re_data_devolucao']}',
                                  ),
                                );
                              }).toList(),
                        ),
                      if (loans.isEmpty)
                        const Padding(
                          padding: EdgeInsets.all(32.0),
                          child: Center(
                            child: Text('Nenhuma requisição encontrada'),
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _bookFilterCtrl.dispose();
    _authorFilterCtrl.dispose();
    super.dispose();
  }
}
