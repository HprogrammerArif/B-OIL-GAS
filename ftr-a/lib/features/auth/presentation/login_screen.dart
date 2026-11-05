import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/language_switch.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/mock/bootstrap.dart';
import 'package:bogcl_oneops/mock/demo/demo_menu.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';
import 'package:bogcl_oneops/shared/widgets/layout_widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  String? _busyCode;
  String? _error;

  /// Generic messages only: never reveal whether the ID exists.
  String _messageFor(Object error, AppL10n l10n) {
    if (error is! ApiException) return l10n.loginErrorGeneric;
    return switch (error.code) {
      ApiErrorCode.offline || ApiErrorCode.timeout => l10n.loginErrorOffline,
      ApiErrorCode.validationError => l10n.loginErrorValidation,
      ApiErrorCode.unauthenticated =>
        error.reason == 'ACCOUNT_LOCKED'
            ? l10n.loginErrorLocked
            : l10n.loginErrorInvalid,
      _ => l10n.loginErrorGeneric,
    };
  }

  String _personaName(
    MockStore store,
    ({String code, String roleLabel, String roleLabelBn}) p,
    bool bangla,
  ) {
    final emp = store.get(Col.employees, empId(p.code));
    if (bangla) {
      return (emp?['fullNameBn'] as String?) ?? p.roleLabelBn;
    }
    return (emp?['fullName'] as String?) ?? p.roleLabel;
  }

  Future<void> _enter(String empCode) async {
    if (_busyCode != null) return;
    final l10n = context.l10n;
    setState(() {
      _busyCode = empCode;
      _error = null;
    });
    try {
      await ref.read(sessionControllerProvider.notifier).switchPersona(empCode);
      Haptics.success();
    } on Object catch (e) {
      Haptics.error();
      if (!mounted) return;
      setState(() {
        _busyCode = null;
        _error = _messageFor(e, l10n);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final bangla = context.isBangla;
    final store = ref.watch(mockStoreProvider);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(Space.xxl),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Align(
                    alignment: Alignment.centerRight,
                    child: LanguageSwitch(),
                  ),
                  const SizedBox(height: Space.xxxl),
                  GestureDetector(
                    onLongPress: () => showDemoMenu(context),
                    child: Semantics(
                      label: l10n.appName,
                      child: Column(
                        children: [
                          DecoratedBox(
                            decoration: BoxDecoration(
                              color: theme.colorScheme.primary,
                              shape: BoxShape.circle,
                              boxShadow: cardShadow(theme.colorScheme.shadow),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(Space.xl),
                              child: Icon(
                                Icons.local_gas_station,
                                color: theme.colorScheme.onPrimary,
                                size: 36,
                              ),
                            ),
                          ),
                          const SizedBox(height: Space.lg),
                          Text(
                            l10n.appName,
                            style: theme.textTheme.headlineSmall,
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: Space.xxxl),
                  Text(l10n.loginTitle, style: theme.textTheme.headlineMedium),
                  const SizedBox(height: Space.xs),
                  Text(
                    l10n.loginSubtitle,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: Space.lg),
                    Semantics(
                      liveRegion: true,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          color: context.bogcl.dangerContainer,
                          borderRadius: BorderRadius.circular(Corner.md),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(Space.md),
                          child: Row(
                            children: [
                              Icon(
                                Icons.error_outline,
                                color: context.bogcl.danger,
                              ),
                              const SizedBox(width: Space.sm),
                              Expanded(child: Text(_error!)),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: Space.xl),
                  GroupCard(
                    children: [
                      for (final p in personas)
                        _PersonaRow(
                          persona: p,
                          name: _personaName(store, p, bangla),
                          role: bangla ? p.roleLabelBn : p.roleLabel,
                          busy: _busyCode == p.code,
                          enabled: _busyCode == null,
                          onTap: () => _enter(p.code),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PersonaRow extends StatelessWidget {
  const _PersonaRow({
    required this.persona,
    required this.name,
    required this.role,
    required this.busy,
    required this.enabled,
    required this.onTap,
  });

  final ({String code, String roleLabel, String roleLabelBn}) persona;
  final String name;
  final String role;
  final bool busy;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListRow(
      inset: true,
      title: name,
      subtitle: '$role · ${persona.code}',
      leading: busy
          ? const SizedBox(
              width: 40,
              height: 40,
              child: Padding(
                padding: EdgeInsets.all(Space.sm),
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          : Avatar(name: name),
      trailing: enabled
          ? Icon(Icons.chevron_right, color: theme.colorScheme.onSurfaceVariant)
          : null,
      onTap: enabled ? onTap : null,
    );
  }
}
