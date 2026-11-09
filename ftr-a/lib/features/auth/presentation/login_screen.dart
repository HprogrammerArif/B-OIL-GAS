import 'dart:async';
import 'dart:ui';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/preferences_controller.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/storage/secure_store.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/mock/demo/demo_menu.dart';
import 'package:bogcl_oneops/shared/widgets/app_text_field.dart';
import 'package:bogcl_oneops/shared/widgets/persona_switcher_sheet.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _idCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _remember = false;
  bool _signing = false;
  String? _busyCode;
  String? _error;

  bool get _busy => _signing || _busyCode != null;

  @override
  void initState() {
    super.initState();
    unawaited(_loadRemembered());
  }

  @override
  void dispose() {
    _idCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadRemembered() async {
    final saved = await ref
        .read(secureStoreProvider)
        .read(SecureKeys.rememberedIdentifier);
    if (!mounted || saved == null || saved.isEmpty) return;
    setState(() {
      _idCtrl.text = saved;
      _remember = true;
    });
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
    if (_busy) return;
    final l10n = context.l10n;
    final id = _idCtrl.text.trim();
    final password = _passCtrl.text;
    if (id.length < 3 || password.isEmpty) {
      setState(() => _error = l10n.loginErrorValidation);
      return;
    }
    setState(() {
      _signing = true;
      _error = null;
    });
    final store = ref.read(secureStoreProvider);
    try {
      await ref
          .read(sessionControllerProvider.notifier)
          .login(id, password, rememberMe: _remember);
      if (_remember) {
        await store.write(SecureKeys.rememberedIdentifier, id);
      } else {
        await store.delete(SecureKeys.rememberedIdentifier);
      }
      Haptics.success();
    } on Object catch (e) {
      Haptics.error();
      if (!mounted) return;
      setState(() {
        _signing = false;
        _passCtrl.clear();
        _error = _messageFor(e, l10n);
      });
    }
  }

  Future<void> _enter(String empCode) async {
    if (_busy) return;
    final l10n = context.l10n;
    final cleanCode = empCode.trim().toUpperCase();
    setState(() {
      _busyCode = cleanCode;
      _error = null;
    });
    try {
      await ref
          .read(sessionControllerProvider.notifier)
          .switchPersona(cleanCode);
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
    final scheme = theme.colorScheme;

    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFFE4F0C4), Color(0xFFF6F3E2), Colors.white],
            stops: [0, 0.46, 1],
          ),
        ),
        child: Stack(
          children: [
            const _WashOrb(
              alignment: Alignment(-1.1, -0.85),
              size: 220,
              color: Color(0x66D4AF37),
            ),
            const _WashOrb(
              alignment: Alignment(1.15, -0.15),
              size: 180,
              color: Color(0x33A51C30),
            ),
            SafeArea(
              child: Stack(
                children: [
                  Center(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(
                        Space.lg,
                        52,
                        Space.lg,
                        Space.xxl,
                      ),
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 440),
                        child: _GlassPanel(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              GestureDetector(
                                onLongPress: () => showDemoMenu(context),
                                child: Column(
                                  children: [
                                    DecoratedBox(
                                      decoration: BoxDecoration(
                                        color: scheme.primary,
                                        borderRadius: BorderRadius.circular(
                                          Corner.lg,
                                        ),
                                      ),
                                      child: Padding(
                                        padding: const EdgeInsets.all(Space.md),
                                        child: Icon(
                                          Icons.local_gas_station,
                                          color: scheme.onPrimary,
                                          size: 28,
                                          semanticLabel: l10n.loginBrand,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: Space.sm),
                                    Text(
                                      l10n.loginBrand,
                                      style: theme.textTheme.titleLarge
                                          ?.copyWith(
                                            color: BrandColors.crimson,
                                            fontWeight: FontWeight.w800,
                                          ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: Space.xl),
                              Text(
                                l10n.loginWelcome,
                                textAlign: TextAlign.center,
                                style: theme.textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: Space.xs),
                              Text(
                                l10n.loginSubtitle,
                                textAlign: TextAlign.center,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: scheme.onSurfaceVariant,
                                ),
                              ),
                              if (_error != null) ...[
                                const SizedBox(height: Space.md),
                                Semantics(
                                  liveRegion: true,
                                  child: DecoratedBox(
                                    decoration: BoxDecoration(
                                      color: context.bogcl.dangerContainer,
                                      borderRadius: BorderRadius.circular(
                                        Corner.md,
                                      ),
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
                              _Caption(l10n.loginEmailLabel),
                              _StadiumField(
                                child: AppTextField(
                                  label: l10n.loginEmailLabel,
                                  hint: l10n.loginEmailHint,
                                  controller: _idCtrl,
                                  prefixIcon: Icons.mail_outline,
                                  keyboardType: TextInputType.emailAddress,
                                  textInputAction: TextInputAction.next,
                                  autofillHints: const [AutofillHints.username],
                                  enabled: !_busy,
                                  onChanged: (_) {
                                    if (_error != null) {
                                      setState(() => _error = null);
                                    }
                                  },
                                ),
                              ),
                              const SizedBox(height: Space.md),
                              _Caption(l10n.loginPasswordLabel),
                              _StadiumField(
                                child: AppTextField(
                                  label: l10n.loginPasswordLabel,
                                  hint: l10n.loginPasswordHint,
                                  controller: _passCtrl,
                                  prefixIcon: Icons.lock_outline,
                                  obscure: true,
                                  textInputAction: TextInputAction.done,
                                  autofillHints: const [AutofillHints.password],
                                  enabled: !_busy,
                                  onChanged: (_) {
                                    if (_error != null) {
                                      setState(() => _error = null);
                                    }
                                  },
                                  onSubmitted: (_) => unawaited(_submit()),
                                ),
                              ),
                              const SizedBox(height: Space.sm),
                              Align(
                                alignment: AlignmentDirectional.centerStart,
                                child: InkWell(
                                  onTap: _busy
                                      ? null
                                      : () => setState(
                                          () => _remember = !_remember,
                                        ),
                                  borderRadius: BorderRadius.circular(
                                    Corner.sm,
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Checkbox(
                                        value: _remember,
                                        visualDensity: VisualDensity.compact,
                                        onChanged: _busy
                                            ? null
                                            : (value) => setState(
                                                () =>
                                                    _remember = value ?? false,
                                              ),
                                      ),
                                      Text(l10n.loginRemember),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(height: Space.md),
                              FilledButton(
                                style: FilledButton.styleFrom(
                                  backgroundColor: BrandColors.crimson,
                                  foregroundColor: Colors.white,
                                  disabledBackgroundColor: BrandColors.crimson
                                      .withValues(alpha: 0.45),
                                  disabledForegroundColor: Colors.white,
                                  minimumSize: const Size.fromHeight(52),
                                  shape: const StadiumBorder(),
                                  textStyle: theme.textTheme.titleMedium
                                      ?.copyWith(fontWeight: FontWeight.w700),
                                ),
                                onPressed: _busy
                                    ? null
                                    : () => unawaited(_submit()),
                                child: _signing
                                    ? const SizedBox(
                                        width: 22,
                                        height: 22,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: Colors.white,
                                        ),
                                      )
                                    : Text(l10n.loginSubmit),
                              ),
                              const SizedBox(height: Space.xl),
                              _DemoRolePills(
                                busyCode: _busyCode,
                                enabled: !_busy,
                                onSelect: (code) => unawaited(_enter(code)),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  const Positioned(
                    top: Space.xs,
                    right: Space.sm,
                    child: _LangPill(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WashOrb extends StatelessWidget {
  const _WashOrb({
    required this.alignment,
    required this.size,
    required this.color,
  });

  final Alignment alignment;
  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Align(
        alignment: alignment,
        child: Container(
          width: size,
          height: size,
          decoration: BoxDecoration(shape: BoxShape.circle, color: color),
        ),
      ),
    );
  }
}

class _GlassPanel extends StatelessWidget {
  const _GlassPanel({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    const radius = BorderRadius.all(Radius.circular(28));
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: radius,
        boxShadow: [
          BoxShadow(
            color: BrandColors.slate900.withValues(alpha: 0.08),
            blurRadius: 28,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: radius,
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
          child: DecoratedBox(
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.55),
              borderRadius: radius,
              border: Border.all(color: Colors.white.withValues(alpha: 0.75)),
            ),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(
                Space.xl,
                Space.xxl,
                Space.xl,
                Space.xl,
              ),
              child: child,
            ),
          ),
        ),
      ),
    );
  }
}

class _LangPill extends ConsumerWidget {
  const _LangPill();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final bangla = ref.watch(localeControllerProvider).languageCode == 'bn';
    final shown = bangla ? l10n.loginLangEn : l10n.loginLangBn;
    final nextName = bangla ? l10n.languageEnglish : l10n.languageBangla;
    return Semantics(
      button: true,
      label: l10n.loginLangSwitch(nextName),
      child: SizedBox(
        width: kMinTouchTarget,
        height: kMinTouchTarget,
        child: Center(
          child: Material(
            color: Colors.white.withValues(alpha: 0.55),
            shape: StadiumBorder(
              side: BorderSide(color: Colors.white.withValues(alpha: 0.85)),
            ),
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: () {
                Haptics.tap();
                unawaited(
                  ref
                      .read(localeControllerProvider.notifier)
                      .setLocale(Locale(bangla ? 'en' : 'bn')),
                );
              },
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                child: Text(
                  shown,
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.4,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Caption extends StatelessWidget {
  const _Caption(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: Space.xs, left: Space.xs),
      child: Text(
        text,
        style: Theme.of(context).textTheme.labelLarge
            ?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
      ),
    );
  }
}

/// Pill fields for this screen only. Other forms keep the shared theme.
class _StadiumField extends StatelessWidget {
  const _StadiumField({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final radius = BorderRadius.circular(Corner.pill);
    final side = BorderSide(
      color: scheme.outlineVariant.withValues(alpha: 0.7),
    );
    OutlineInputBorder border(BorderSide edge) =>
        OutlineInputBorder(borderRadius: radius, borderSide: edge);
    final base = Theme.of(context).inputDecorationTheme;
    return Theme(
      data: Theme.of(context).copyWith(
        inputDecorationTheme: base.copyWith(
          filled: true,
          fillColor: Colors.white,
          floatingLabelBehavior: FloatingLabelBehavior.never,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: Space.lg,
            vertical: Space.lg,
          ),
          border: border(side),
          enabledBorder: border(side),
          focusedBorder: border(
            const BorderSide(color: BrandColors.crimson, width: 1.5),
          ),
          errorBorder: border(BorderSide(color: scheme.error)),
          focusedErrorBorder: border(BorderSide(color: scheme.error, width: 2)),
        ),
      ),
      child: child,
    );
  }
}

/// Demo roles. Delete this widget and its one call to leave the staff form.
class _DemoRolePills extends StatelessWidget {
  const _DemoRolePills({
    required this.busyCode,
    required this.enabled,
    required this.onSelect,
  });

  final String? busyCode;
  final bool enabled;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final scheme = Theme.of(context).colorScheme;
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: Divider(color: scheme.outlineVariant)),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: Space.md),
              child: Text(
                l10n.loginOr,
                style: Theme.of(context).textTheme.labelMedium
                    ?.copyWith(color: scheme.onSurfaceVariant),
              ),
            ),
            Expanded(child: Divider(color: scheme.outlineVariant)),
          ],
        ),
        const SizedBox(height: Space.md),
        Wrap(
          alignment: WrapAlignment.center,
          spacing: Space.sm,
          runSpacing: Space.sm,
          children: [
            for (final persona in canonicalPersonas)
              _RolePill(
                label: bangla ? persona.roleLabelBn : persona.roleLabelEn,
                busy: busyCode == persona.code,
                enabled: enabled,
                onTap: () => onSelect(persona.code),
              ),
          ],
        ),
      ],
    );
  }
}

class _RolePill extends StatelessWidget {
  const _RolePill({
    required this.label,
    required this.busy,
    required this.enabled,
    required this.onTap,
  });

  final String label;
  final bool busy;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final scheme = Theme.of(context).colorScheme;
    return Semantics(
      button: true,
      label: l10n.loginDemoAs(label),
      child: Material(
        color: Colors.white,
        shape: StadiumBorder(
          side: BorderSide(color: scheme.outlineVariant.withValues(alpha: 0.8)),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: enabled ? onTap : null,
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: Space.lg,
              vertical: Space.md,
            ),
            child: busy
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(label, style: Theme.of(context).textTheme.labelLarge),
          ),
        ),
      ),
    );
  }
}
