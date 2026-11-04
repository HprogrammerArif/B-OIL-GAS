import 'package:bogcl_oneops/core/utils/money.dart';
import 'package:bogcl_oneops/features/assets/domain/asset_models.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';

String assetTaka(double amount, {required bool bangla}) =>
    Money.fromPaisa((amount * 100).round()).format(bengali: bangla);

String assetStageLabel(AppL10n l10n, String s) => switch (s) {
  'IN_STOCK' => l10n.asStageStock,
  'OPERATIONAL' => l10n.asStageWork,
  'IN_TRANSFER' => l10n.asStageMove,
  'MAINTENANCE' => l10n.asStageRepair,
  'CALIBRATION_DUE' => l10n.asStageCal,
  'QUARANTINE_LOTO' => l10n.asStageLoto,
  'DECOMMISSIONED' => l10n.asStageRetire,
  'DISPOSED' => l10n.asStageGone,
  _ => s,
};

StatusTone assetStageTone(String s) => switch (s) {
  'QUARANTINE_LOTO' => StatusTone.danger,
  'MAINTENANCE' || 'CALIBRATION_DUE' => StatusTone.warning,
  'DECOMMISSIONED' => StatusTone.warning,
  'IN_TRANSFER' => StatusTone.info,
  'OPERATIONAL' => StatusTone.success,
  'DISPOSED' => StatusTone.neutral,
  _ => StatusTone.info,
};

bool assetNeedsMe(Equipment e) {
  final m = e.me;
  return m.canAck ||
      m.canCommission ||
      m.canReceive ||
      m.canWriteOff ||
      m.canDispose ||
      e.workOrders.any((w) => w.canStart || w.canComplete) ||
      (m.canLoto && e.stage == 'QUARANTINE_LOTO');
}

String assetNextLine(AppL10n l10n, Equipment e, {required bool bangla}) {
  final m = e.me;
  final who = e.custody?.holder?.display(bangla: bangla);
  return switch (e.stage) {
    'IN_STOCK' when m.canCommission => l10n.asNextCommission,
    'IN_STOCK' => l10n.asNextStock,
    'IN_TRANSFER' when m.canReceive => l10n.asNextReceive,
    'IN_TRANSFER' => l10n.asNextMoving,
    'QUARANTINE_LOTO' when m.canLoto => l10n.asNextLotoRelease,
    'QUARANTINE_LOTO' => l10n.asNextLotoWait,
    'MAINTENANCE' when e.workOrders.any((w) => w.canComplete) =>
      l10n.asNextFinishJob,
    'MAINTENANCE' => l10n.asNextRepair,
    'CALIBRATION_DUE' when m.canCertify => l10n.asNextCal,
    'CALIBRATION_DUE' => l10n.asNextCalWait,
    'DECOMMISSIONED' when m.canDispose => l10n.asNextDispose,
    'DECOMMISSIONED' when m.canWriteOff => l10n.asNextWriteOff,
    'DECOMMISSIONED' => l10n.asNextRetireWait,
    'DISPOSED' => l10n.asNextGone,
    _ when m.canAck => l10n.asNextAck,
    _ when who != null => l10n.asNextOk(who),
    _ => l10n.asNextIdle,
  };
}

int assetStageIndex(String s) => switch (s) {
  'REQUESTED' => 1,
  'PROCURED' => 2,
  'IN_STOCK' => 3,
  'OPERATIONAL' => 4,
  'IN_TRANSFER' || 'MAINTENANCE' || 'CALIBRATION_DUE' || 'QUARANTINE_LOTO' => 5,
  'DECOMMISSIONED' => 7,
  'DISPOSED' => 8,
  _ => 4,
};
