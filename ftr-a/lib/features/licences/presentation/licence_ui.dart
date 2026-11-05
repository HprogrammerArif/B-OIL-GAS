import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/core/utils/money.dart';
import 'package:bogcl_oneops/features/licences/domain/licence_models.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';

String licenceTaka(double amount, {required bool bangla}) =>
    Money.fromPaisa((amount * 100).round()).format(bengali: bangla);

String licenceUrgencyLabel(AppL10n l10n, String u) => switch (u) {
  'EXPIRED' => l10n.cpUrgExpired,
  'CRITICAL' => l10n.cpUrgCritical,
  'WARNING' => l10n.cpUrgWarning,
  _ => l10n.cpUrgOk,
};

StatusTone licenceUrgencyTone(String u) => switch (u) {
  'EXPIRED' || 'CRITICAL' => StatusTone.danger,
  'WARNING' => StatusTone.warning,
  _ => StatusTone.success,
};

String licenceStageLabel(AppL10n l10n, String s) => switch (s) {
  'INTERNAL_REVIEW' => l10n.cpStageReview,
  'APPLICATION_FILED' => l10n.cpStageFiled,
  'FIELD_INSPECTION' => l10n.cpStageInspect,
  'MINISTRY_VETTING' => l10n.cpStageVet,
  'RENEWED' => l10n.cpStageDone,
  _ => s,
};

String licenceAdvanceLabel(AppL10n l10n, String stage) => switch (stage) {
  'INTERNAL_REVIEW' => l10n.cpActFile,
  'APPLICATION_FILED' => l10n.cpActInspect,
  'FIELD_INSPECTION' => l10n.cpActFindings,
  'MINISTRY_VETTING' => l10n.cpActComplete,
  _ => l10n.cpActAdvance,
};

bool licenceNeedsMe(Licence l) {
  final m = l.me;
  return m.canFund ||
      m.canAdvance ||
      m.canLetter ||
      m.canRenew ||
      (m.canChecklist &&
          (l.renewal?.checklist.any((c) => c.status == 'PENDING') ?? false));
}

String licenceNextLine(AppL10n l10n, Licence l, {required bool bangla}) {
  final m = l.me;
  final r = l.renewal;
  if (l.urgency == 'EXPIRED' && r == null) {
    return m.canRenew ? l10n.cpNextStartExpired : l10n.cpNextExpired;
  }
  if (r == null) {
    if (l.urgency == 'CRITICAL' && m.canRenew) return l10n.cpNextStartSoon;
    return l10n.cpNextOk(
      l.expiresAt == null
          ? ''
          : DateFmt.date(l.expiresAt!, bangla ? 'bn' : 'en'),
    );
  }
  return switch (r.stage) {
    'INTERNAL_REVIEW' when m.canFund => l10n.cpNextFund(
      licenceTaka(r.feeAmount, bangla: bangla),
    ),
    'INTERNAL_REVIEW'
        when m.canChecklist && r.checklist.any((c) => c.status == 'PENDING') =>
      l10n.cpNextTicks,
    'INTERNAL_REVIEW' when m.canAdvance => l10n.cpNextFile,
    'INTERNAL_REVIEW' => l10n.cpNextWaitFile,
    'APPLICATION_FILED' when m.canAdvance => l10n.cpNextBook,
    'APPLICATION_FILED' => l10n.cpNextWaitInspect,
    'FIELD_INSPECTION' when m.canAdvance => l10n.cpNextFindings,
    'FIELD_INSPECTION' => l10n.cpNextWaitFindings,
    'MINISTRY_VETTING' when m.canAdvance => l10n.cpNextCert,
    'MINISTRY_VETTING' => l10n.cpNextWaitCert,
    _ => l10n.cpNextRenewed,
  };
}
