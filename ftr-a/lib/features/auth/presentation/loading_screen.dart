import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Shown while the stored session and local database are restored.
class LoadingScreen extends ConsumerWidget {
  const LoadingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionControllerProvider);
    final l10n = context.l10n;
    final bangla = context.isBangla;
    final theme = Theme.of(context);
    final scheme = theme.colorScheme;

    return Scaffold(
      body: SafeArea(
        child: session.hasError
            ? ErrorState(
                message: l10n.sessionRestoreError,
                onRetry: () => ref.invalidate(sessionControllerProvider),
              )
            : Center(
                child: Padding(
                  padding: const EdgeInsets.all(Space.xxl),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // BOGCL Branded Crest Container
                      Container(
                        padding: const EdgeInsets.all(Space.xl),
                        decoration: BoxDecoration(
                          color: BrandColors.crimson,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: BrandColors.crimson.withValues(
                                alpha: 0.35,
                              ),
                              blurRadius: 24,
                              offset: const Offset(0, 8),
                            ),
                          ],
                          border: Border.all(
                            color: const Color(0xFFD4AF37),
                            width: 2.5,
                          ),
                        ),
                        child: const Icon(
                          Icons.local_gas_station,
                          color: Colors.white,
                          size: 44,
                        ),
                      ),
                      const SizedBox(height: Space.xxl),
                      // Eyebrow Tag
                      Container(
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
                              ? 'বসুন্ধরা অয়েল অ্যান্ড গ্যাস কোং লিঃ'
                              : 'BASHUNDHARA OIL & GAS CO. LTD.',
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: BrandColors.crimson,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                      const SizedBox(height: Space.sm),
                      Text(
                        l10n.appName,
                        style: theme.textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: Space.xs),
                      Text(
                        bangla
                            ? 'সমন্বিত এন্টারপ্রাইজ ও রিফাইনারি অপারেশনস'
                            : 'Unified Enterprise & Refinery Operations',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: scheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: Space.xxxl),
                      SizedBox(
                        width: 28,
                        height: 28,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          color: scheme.primary,
                        ),
                      ),
                      const SizedBox(height: Space.md),
                      Text(
                        bangla
                            ? 'এনক্রিপ্ট করা ডেটা ও অডিট লেজার লোড হচ্ছে...'
                            : 'Initializing secure vault & SHA-256 audit ledger...',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: scheme.onSurfaceVariant.withValues(alpha: 0.8),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
      ),
    );
  }
}
