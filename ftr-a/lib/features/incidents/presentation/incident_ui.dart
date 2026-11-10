import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/features/incidents/domain/incident_models.dart';
import 'package:bogcl_oneops/l10n/gen/app_localizations.dart';
import 'package:bogcl_oneops/shared/widgets/status_pill.dart';

(int score, String category) incidentScore(int severity, int likelihood) {
  final score = severity * likelihood;
  final category = score >= 16
      ? 'EXTREME'
      : score >= 10
      ? 'HIGH'
      : score >= 5
      ? 'MEDIUM'
      : 'LOW';
  return (score, category);
}

const incidentPlantZones = [
  'Zone 1',
  'Zone 2',
  'Zone 3',
  'Zone 4',
  'Zone 5',
  'Zone 6',
  'Zone 7',
  'Zone 8',
  'Zone 9',
  'Zone 10',
];

String incidentZoneLabel(AppL10n l10n, String? zone) => switch (zone) {
  'Zone 1' => l10n.inZone1,
  'Zone 2' => l10n.inZone2,
  'Zone 3' => l10n.inZone3,
  'Zone 4' => l10n.inZone4,
  'Zone 5' => l10n.inZone5,
  'Zone 6' => l10n.inZone6,
  'Zone 7' => l10n.inZone7,
  'Zone 8' => l10n.inZone8,
  'Zone 9' => l10n.inZone9,
  'Zone 10' => l10n.inZone10,
  _ => l10n.inZoneUnassigned,
};

const incidentTypes = [
  'NEAR_MISS',
  'HAZARD',
  'MEDICAL_TREATMENT',
  'LOST_TIME',
  'SPILL_LEAK',
  'FIRE_THERMAL',
  'EQUIPMENT_DAMAGE',
  'VEHICLE_ACCIDENT',
];

String incidentTypeLabel(AppL10n l10n, String t) => switch (t) {
  'NEAR_MISS' => l10n.inTypeNear,
  'HAZARD' => l10n.inTypeHazard,
  'MEDICAL_TREATMENT' => l10n.inTypeMedical,
  'LOST_TIME' => l10n.inTypeLost,
  'SPILL_LEAK' => l10n.inTypeSpill,
  'FIRE_THERMAL' => l10n.inTypeFire,
  'EQUIPMENT_DAMAGE' => l10n.inTypeEquip,
  'VEHICLE_ACCIDENT' => l10n.inTypeVehicle,
  'ENVIRONMENTAL' => l10n.inTypeEnv,
  'PRESSURE_PIPING' => l10n.inTypePipe,
  'FATALITY' => l10n.inTypeFatal,
  _ => t,
};

String incidentStageLabel(AppL10n l10n, String s) => switch (s) {
  'REPORTED' => l10n.inStageReported,
  'TRIAGED' => l10n.inStageTriaged,
  'UNDER_INVESTIGATION' => l10n.inStageInvest,
  'CAPA_EXECUTION' => l10n.inStageCapa,
  'MANAGEMENT_REVIEW' => l10n.inStageReview,
  _ => l10n.inStageClosed,
};

StatusTone incidentStageTone(String s) => switch (s) {
  'REPORTED' => StatusTone.warning,
  'TRIAGED' => StatusTone.info,
  'UNDER_INVESTIGATION' => StatusTone.info,
  'CAPA_EXECUTION' => StatusTone.warning,
  'MANAGEMENT_REVIEW' => StatusTone.success,
  _ => StatusTone.neutral,
};

String incidentRiskLabel(AppL10n l10n, String c) => switch (c) {
  'EXTREME' => l10n.inRiskExtreme,
  'HIGH' => l10n.inRiskHigh,
  'MEDIUM' => l10n.inRiskMedium,
  _ => l10n.inRiskLow,
};

StatusTone incidentRiskTone(String c) => switch (c) {
  'EXTREME' => StatusTone.danger,
  'HIGH' => StatusTone.danger,
  'MEDIUM' => StatusTone.warning,
  _ => StatusTone.info,
};

bool incidentNeedsMe(SafetyIncident i) {
  final m = i.me;
  return m.canTriage ||
      m.canInvestigate ||
      m.canRca ||
      m.canAddCapa ||
      m.canReview ||
      m.canCloseSafety ||
      m.canCloseManager ||
      m.canStatutory ||
      i.capas.any((c) => c.me.canStart || c.me.canComplete || c.me.canVerify);
}

String incidentNextLine(
  AppL10n l10n,
  SafetyIncident i, {
  required bool bangla,
}) {
  final m = i.me;
  final who = i.reporter?.display(bangla: bangla) ?? l10n.inAnonymous;
  return switch (i.stage) {
    'REPORTED' when m.canTriage => l10n.inNextTriage(who),
    'REPORTED' when m.isReporter => l10n.inNextWaitHse,
    'REPORTED' => l10n.inNextReported,
    'TRIAGED' when m.canInvestigate => l10n.inNextStart,
    'TRIAGED' => l10n.inNextTriaged,
    'UNDER_INVESTIGATION' when m.canRca => l10n.inNextRca,
    'UNDER_INVESTIGATION' => l10n.inNextInvest,
    'CAPA_EXECUTION'
        when i.capas.any((c) => c.me.canComplete || c.me.canStart) =>
      l10n.inNextMyCapa,
    'CAPA_EXECUTION' when i.capas.any((c) => c.me.canVerify) =>
      l10n.inNextVerify,
    'CAPA_EXECUTION' when m.canReview => l10n.inNextReview,
    'CAPA_EXECUTION' => l10n.inNextCapa,
    'MANAGEMENT_REVIEW' when m.canCloseSafety => l10n.inNextSignSafety,
    'MANAGEMENT_REVIEW' when m.canCloseManager => l10n.inNextSignGm,
    'MANAGEMENT_REVIEW' => l10n.inNextReviewWait,
    _ => l10n.inNextClosed,
  };
}

String incidentWhen(SafetyIncident i, String lang) =>
    DateFmt.dateTime(i.occurredAt, lang);
