import 'package:bogcl_oneops/app/l10n_ext.dart';
import 'package:bogcl_oneops/core/theme/tokens.dart';
import 'package:bogcl_oneops/features/auth/presentation/session_controller.dart';
import 'package:bogcl_oneops/shared/widgets/state_views.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Shown while the stored session is restored. If restoring fails (for example
/// offline at start-up) it offers a retry instead of dropping the session.
class LoadingScreen extends ConsumerWidget {
  const LoadingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionControllerProvider);
    final l10n = context.l10n;
    return Scaffold(
      body: SafeArea(
        child: session.hasError
            ? ErrorState(
                message: l10n.sessionRestoreError,
                onRetry: () => ref.invalidate(sessionControllerProvider),
              )
            : Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      l10n.appName,
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: Space.xl),
                    Semantics(
                      label: l10n.commonLoading,
                      child: const CircularProgressIndicator(),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}
