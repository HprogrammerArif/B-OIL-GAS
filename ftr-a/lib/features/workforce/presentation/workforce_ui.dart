import 'package:bogcl_oneops/features/workforce/domain/workforce_models.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';

String staffStatusLabel(AppL10n l10n, String status) => switch (status) {
  'ON_LEAVE' => l10n.emStatusLeave,
  'OFFBOARDING' => l10n.emStatusLeaving,
  'OFFBOARDED' => l10n.emStatusFormer,
  _ => l10n.emStatusActive,
};

StatusTone staffStatusTone(String status) => switch (status) {
  'ON_LEAVE' => StatusTone.warning,
  'OFFBOARDING' => StatusTone.danger,
  'OFFBOARDED' => StatusTone.neutral,
  _ => StatusTone.success,
};

String itemStatusLabel(AppL10n l10n, String status) => switch (status) {
  'CLEARED' => l10n.emItemCleared,
  'WAIVED' => l10n.emItemWaived,
  _ => l10n.emItemPending,
};

bool staffNeedsMe(StaffMember e) {
  final m = e.me;
  if (m == null) return e.status == 'OFFBOARDING';
  return m.clearableKeys.isNotEmpty || m.canFinalize;
}
