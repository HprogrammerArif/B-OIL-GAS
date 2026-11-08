import 'dart:async';

import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/app/language_switch.dart';
import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/core/utils/haptics.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/mock/demo/demo_menu.dart';
import 'package:bogcl_oneops/shared/widgets/persona_switcher_sheet.dart';
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
  int _mode = 0; // 0 = 1-Tap Pitch Roles, 1 = Corporate ID & Passkey
  final _empCtrl = TextEditingController(text: 'EMP-0001');
  final _pinCtrl = TextEditingController(text: '202601');

  @override
  void dispose() {
    _empCtrl.dispose();
    _pinCtrl.dispose();
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

  Future<void> _enter(String empCode) async {
    if (_busyCode != null) return;
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

  Future<void> _simulateBiometricPasskey(bool bangla) async {
    Haptics.tap();
    final code = _empCtrl.text.trim().isEmpty
        ? 'EMP-0001'
        : _empCtrl.text.trim().toUpperCase();
    final persona = findCanonicalPersona(code) ?? canonicalPersonas.first;

    final confirmed = await showModalBottomSheet<bool>(
      context: context,
      showDragHandle: true,
      builder: (ctx) {
        final theme = Theme.of(ctx);
        final scheme = theme.colorScheme;
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(
              Space.xxl,
              Space.sm,
              Space.xxl,
              Space.xxl,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(Space.lg),
                  decoration: BoxDecoration(
                    color: BrandColors.success.withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.fingerprint,
                    size: 48,
                    color: BrandColors.success,
                  ),
                ),
                const SizedBox(height: Space.md),
                Text(
                  bangla
                      ? 'বায়োমেট্রিক পাসকি যাচাইকরণ'
                      : 'Biometric Passkey Verification',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: Space.xs),
                Text(
                  '${bangla ? persona.nameBn : persona.nameEn} · ${persona.code}\n'
                  '${bangla ? persona.titleBn : persona.titleEn}',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: scheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: Space.lg),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: () => Navigator.pop(ctx, true),
                    icon: const Icon(Icons.verified_user_outlined),
                    label: Text(
                      bangla
                          ? 'ফিঙ্গারপ্রিন্ট নিশ্চিত করুন ও প্রবেশ করুন'
                          : 'Confirm Biometric & Enter Workspace',
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );

    if (confirmed == true && mounted) {
      await _enter(persona.code);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final bangla = context.isBangla;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(
              horizontal: Space.xl,
              vertical: Space.lg,
            ),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 440),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: BrandColors.crimson.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(Corner.xl),
                          ),
                          child: Text(
                            bangla
                                ? 'বসুন্ধরা অয়েল অ্যান্ড গ্যাস (BOGCL)'
                                : 'BASHUNDHARA OIL & GAS (BOGCL)',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: BrandColors.crimson,
                              letterSpacing: 0.4,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: Space.xs),
                      const LanguageSwitch(),
                    ],
                  ),
                  const SizedBox(height: Space.xl),
                  GestureDetector(
                    onLongPress: () => showDemoMenu(context),
                    child: Semantics(
                      label: l10n.appName,
                      child: Row(
                        children: [
                          DecoratedBox(
                            decoration: BoxDecoration(
                              color: scheme.primary,
                              borderRadius: BorderRadius.circular(Corner.lg),
                              boxShadow: cardShadow(scheme.shadow),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(Space.md),
                              child: Icon(
                                Icons.local_gas_station,
                                color: scheme.onPrimary,
                                size: 30,
                              ),
                            ),
                          ),
                          const SizedBox(width: Space.md),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  l10n.appName,
                                  style: theme.textTheme.headlineSmall
                                      ?.copyWith(fontWeight: FontWeight.w800),
                                ),
                                Text(
                                  bangla
                                      ? 'সমন্বিত এন্টারপ্রাইজ ও রিফাইনারি অপারেশনস প্ল্যাটফর্ম'
                                      : 'Unified Enterprise & Refinery Operations Platform',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: scheme.onSurfaceVariant,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: Space.lg),

                  // Mode Selector
                  SegmentedButton<int>(
                    showSelectedIcon: false,
                    segments: [
                      ButtonSegment(
                        value: 0,
                        icon: const Icon(Icons.badge_outlined, size: 16),
                        label: Text(
                          bangla ? 'দ্রুত রোল সাইন-ইন' : 'Quick Role Sign-In',
                        ),
                      ),
                      ButtonSegment(
                        value: 1,
                        icon: const Icon(Icons.fingerprint, size: 16),
                        label: Text(
                          bangla ? 'কর্পোরেট আইডি ও পাসকি' : 'ID & Passkey',
                        ),
                      ),
                    ],
                    selected: {_mode},
                    onSelectionChanged: (s) {
                      Haptics.tap();
                      setState(() => _mode = s.first);
                    },
                  ),

                  if (_error != null) ...[
                    const SizedBox(height: Space.md),
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
                  const SizedBox(height: Space.md),

                  if (_mode == 0) ...[
                    Text(
                      l10n.loginSubtitle,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: Space.sm),
                    for (final p in canonicalPersonas)
                      Padding(
                        padding: const EdgeInsets.only(bottom: Space.xs),
                        child: _EnrichedPersonaCard(
                          persona: p,
                          bangla: bangla,
                          busy: _busyCode == p.code,
                          enabled: _busyCode == null,
                          onTap: () => unawaited(_enter(p.code)),
                        ),
                      ),
                  ] else ...[
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(Space.lg),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              bangla
                                  ? 'কর্পোরেট এমপ্লয়ি সাইন-ইন'
                                  : 'Corporate Employee Sign-In',
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: Space.xs),
                            Text(
                              bangla
                                  ? 'আপনার BOGCL আইডি নির্বাচন করুন অথবা পাসকি ব্যবহার করুন'
                                  : 'Enter your BOGCL Employee ID or tap a quick-fill chip below',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: scheme.onSurfaceVariant,
                              ),
                            ),
                            const SizedBox(height: Space.md),
                            TextField(
                              controller: _empCtrl,
                              decoration: InputDecoration(
                                labelText: bangla
                                    ? 'এমপ্লয়ি আইডি (EMP-ID)'
                                    : 'Employee ID (EMP-ID)',
                                prefixIcon: const Icon(Icons.badge_outlined),
                              ),
                            ),
                            const SizedBox(height: Space.sm),
                            Wrap(
                              spacing: 6,
                              runSpacing: 4,
                              children: [
                                for (final p in canonicalPersonas)
                                  ActionChip(
                                    visualDensity: VisualDensity.compact,
                                    label: Text(
                                      '${p.code} (${bangla ? p.roleLabelBn : p.roleLabelEn})',
                                      style: const TextStyle(fontSize: 11),
                                    ),
                                    onPressed: () {
                                      Haptics.tap();
                                      setState(() => _empCtrl.text = p.code);
                                    },
                                  ),
                              ],
                            ),
                            const SizedBox(height: Space.md),
                            TextField(
                              controller: _pinCtrl,
                              obscureText: true,
                              decoration: InputDecoration(
                                labelText: bangla
                                    ? 'সিকিউরিটি পিন / পাসওয়ার্ড'
                                    : 'Corporate PIN / Passcode',
                                prefixIcon: const Icon(Icons.lock_outline),
                              ),
                            ),
                            const SizedBox(height: Space.lg),
                            FilledButton.icon(
                              onPressed: _busyCode != null
                                  ? null
                                  : () => unawaited(_enter(_empCtrl.text)),
                              icon: const Icon(Icons.login),
                              label: Text(
                                bangla
                                    ? 'সাইন ইন করুন'
                                    : 'Sign In with Employee ID',
                              ),
                            ),
                            const SizedBox(height: Space.sm),
                            FilledButton.tonalIcon(
                              onPressed: _busyCode != null
                                  ? null
                                  : () => unawaited(
                                      _simulateBiometricPasskey(bangla),
                                    ),
                              icon: const Icon(Icons.fingerprint),
                              label: Text(
                                bangla
                                    ? 'বায়োমেট্রিক পাসকি দিয়ে প্রবেশ করুন'
                                    : 'Sign In with Biometric Passkey',
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],

                  const SizedBox(height: Space.md),
                  // Enterprise Trust Footer
                  Center(
                    child: Text(
                      bangla
                          ? '● বারিধারা সদর দপ্তর ও কেরানীগঞ্জ রিফাইনারি · SHA-256 অডিট সক্রিয়'
                          : '● Baridhara HQ & Keraniganj Refinery · SHA-256 Audit Active',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
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

class _EnrichedPersonaCard extends StatelessWidget {
  const _EnrichedPersonaCard({
    required this.persona,
    required this.bangla,
    required this.busy,
    required this.enabled,
    required this.onTap,
  });

  final CanonicalPersona persona;
  final bool bangla;
  final bool busy;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;
    final name = bangla ? persona.nameBn : persona.nameEn;
    final role = bangla ? persona.roleLabelBn : persona.roleLabelEn;
    final subtitle = bangla
        ? '${persona.titleBn} · ${persona.siteBn}'
        : '${persona.titleEn} · ${persona.siteEn}';

    return Card(
      margin: EdgeInsets.zero,
      child: InkWell(
        borderRadius: BorderRadius.circular(Corner.lg),
        onTap: enabled ? onTap : null,
        child: Padding(
          padding: const EdgeInsets.all(Space.md),
          child: Row(
            children: [
              if (busy)
                const SizedBox(
                  width: 42,
                  height: 42,
                  child: Padding(
                    padding: EdgeInsets.all(Space.sm),
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
                )
              else
                CircleAvatar(
                  radius: 21,
                  backgroundColor: persona.color,
                  child: Text(
                    persona.initials,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ),
              const SizedBox(width: Space.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            role,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 1.5,
                          ),
                          decoration: BoxDecoration(
                            color: persona.isPlantSite
                                ? Colors.amber.withValues(alpha: 0.18)
                                : Colors.teal.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(Corner.sm),
                          ),
                          child: Text(
                            persona.isPlantSite ? 'Plant' : 'HQ',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: persona.isPlantSite
                                  ? Colors.amber.shade900
                                  : Colors.teal.shade800,
                            ),
                          ),
                        ),
                      ],
                    ),
                    Text(
                      '$name · ${persona.code}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: scheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              if (enabled)
                Icon(Icons.chevron_right, color: scheme.onSurfaceVariant),
            ],
          ),
        ),
      ),
    );
  }
}
