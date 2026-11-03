import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/language_switch.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/mock/demo/demo_menu.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/buttons.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifier = TextEditingController();
  final _password = TextEditingController();
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _identifier.dispose();
    _password.dispose();
    super.dispose();
  }

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

  Future<void> _submit() async {
    if (_submitting || !(_formKey.currentState?.validate() ?? false)) return;
    FocusScope.of(context).unfocus();
    final l10n = context.l10n;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await ref
          .read(sessionControllerProvider.notifier)
          .login(_identifier.text, _password.text);
      Haptics.success();
    } on Object catch (e) {
      Haptics.error();
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _error = _messageFor(e, l10n);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(Space.xxl),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Align(
                      alignment: Alignment.centerRight,
                      child: LanguageSwitch(),
                    ),
                    const SizedBox(height: Space.xxxl),
                    // Long-press the logo to open the hidden demo menu.
                    GestureDetector(
                      onLongPress: () => showDemoMenu(context),
                      child: Semantics(
                        label: l10n.appName,
                        child: Column(
                          children: [
                            DecoratedBox(
                              decoration: BoxDecoration(
                                color: theme.colorScheme.primary,
                                borderRadius: BorderRadius.circular(Corner.xl),
                              ),
                              child: const Padding(
                                padding: EdgeInsets.all(Space.lg),
                                child: Icon(
                                  Icons.local_gas_station,
                                  color: Colors.white,
                                  size: 40,
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
                    Text(
                      l10n.loginTitle,
                      style: theme.textTheme.headlineMedium,
                    ),
                    const SizedBox(height: Space.xs),
                    Text(
                      l10n.loginSubtitle,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: Space.xxl),
                    AppTextField(
                      label: l10n.loginIdentifierLabel,
                      controller: _identifier,
                      required: true,
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      autofillHints: const [AutofillHints.username],
                      prefixIcon: Icons.person_outline,
                      enabled: !_submitting,
                    ),
                    const SizedBox(height: Space.lg),
                    AppTextField(
                      label: l10n.loginPasswordLabel,
                      controller: _password,
                      required: true,
                      obscure: true,
                      textInputAction: TextInputAction.done,
                      autofillHints: const [AutofillHints.password],
                      prefixIcon: Icons.lock_outline,
                      enabled: !_submitting,
                      onSubmitted: (_) => _submit(),
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
                    const SizedBox(height: Space.xxl),
                    PrimaryButton(
                      label: l10n.loginSubmit,
                      loading: _submitting,
                      onPressed: _submit,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
