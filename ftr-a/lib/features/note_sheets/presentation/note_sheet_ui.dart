import 'package:bogcl_oneops/features/approvals/presentation/approval_ui.dart';
import 'package:bogcl_oneops/features/note_sheets/domain/note_sheet_models.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';

String nsStatusLabel(AppL10n l10n, String status) => switch (status) {
  'DRAFT' => l10n.nsStatusDraft,
  'IN_REVIEW' => l10n.nsStatusInReview,
  'RETURNED' => l10n.nsStatusReturned,
  'APPROVED' => l10n.nsStatusApproved,
  'REJECTED' => l10n.approvalDecRejected,
  _ => l10n.approvalWithdrawn,
};

StatusTone nsStatusTone(String status) => switch (status) {
  'APPROVED' => StatusTone.success,
  'REJECTED' => StatusTone.danger,
  'RETURNED' || 'IN_REVIEW' => StatusTone.warning,
  _ => StatusTone.neutral,
};

/// One plain sentence: what happens next for the person looking at it.
String nsNextLine(AppL10n l10n, NoteSheet s, {required bool bangla}) {
  final names = s.waitingFor.map((p) => p.display(bangla: bangla)).join(', ');
  return switch (s.status) {
    'DRAFT' => l10n.nsNextDraft,
    'IN_REVIEW' when s.me.canSign => l10n.nsNextSign,
    'IN_REVIEW' => l10n.nsNextWaiting(names.isEmpty ? '—' : names),
    'RETURNED' when s.me.isInitiator => l10n.nsNextReturned,
    'RETURNED' => l10n.nsNextReturnedOther(s.initiator.display(bangla: bangla)),
    'APPROVED' => l10n.nsNextApproved,
    'REJECTED' => l10n.nsNextRejected,
    _ => l10n.nsNextWithdrawn(s.initiator.display(bangla: bangla)),
  };
}

String nsAmount(NoteSheet s, {required bool bangla, required String none}) =>
    s.amount == null || s.amount == 0 ? none : taka(s.amount!, bangla: bangla);

/// "3 quotes. Energypac is cheapest, saving ৳1,70,000." (clarity rule).
String nsVerdict(AppL10n l10n, PriceVerdict v, {required bool bangla}) {
  final rec = v.recommended;
  if (rec == null) {
    return l10n.nsVerdictNoPick(v.count, v.lowest.vendorName);
  }
  if (v.recommendedIsLowest) {
    return v.count < 2
        ? l10n.nsVerdictOne(rec.vendorName)
        : l10n.nsVerdictCheapest(
            v.count,
            rec.vendorName,
            taka(v.savingVsHighest, bangla: bangla),
          );
  }
  return l10n.nsVerdictNotLowest(
    v.count,
    rec.vendorName,
    taka(v.recommendedOverLowest, bangla: bangla),
    v.lowest.vendorName,
  );
}
