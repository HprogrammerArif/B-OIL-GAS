import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:flutter/foundation.dart';

Person? _person(Object? v) =>
    v == null ? null : Person.fromJson(Map<String, Object?>.from(v as Map));

Map<String, Object?> _map(Object? v) => Map<String, Object?>.from(v! as Map);

DateTime? _t(Object? v) =>
    v == null ? null : DateTime.parse(v as String).toUtc();

@immutable
class LicenceMe {
  const LicenceMe({
    required this.isOwner,
    required this.canRenew,
    required this.canChecklist,
    required this.canFund,
    required this.canAdvance,
    required this.canBack,
    required this.canLetter,
  });

  factory LicenceMe.fromJson(Map<String, Object?> j) => LicenceMe(
    isOwner: j['isOwner'] == true,
    canRenew: j['canRenew'] == true,
    canChecklist: j['canChecklist'] == true,
    canFund: j['canFund'] == true,
    canAdvance: j['canAdvance'] == true,
    canBack: j['canBack'] == true,
    canLetter: j['canLetter'] == true,
  );

  final bool isOwner;
  final bool canRenew;
  final bool canChecklist;
  final bool canFund;
  final bool canAdvance;
  final bool canBack;
  final bool canLetter;
}

@immutable
class LicenceCheckItem {
  const LicenceCheckItem({
    required this.id,
    required this.label,
    required this.labelBn,
    required this.status,
    this.note,
  });

  factory LicenceCheckItem.fromJson(Map<String, Object?> j) => LicenceCheckItem(
    id: j['id']! as String,
    label: j['label'] as String? ?? '',
    labelBn: j['labelBn'] as String? ?? '',
    status: j['status'] as String? ?? 'PENDING',
    note: j['note'] as String?,
  );

  final String id;
  final String label;
  final String labelBn;
  final String status;
  final String? note;

  String display({required bool bangla}) => bangla ? labelBn : label;
}

@immutable
class LicenceRenewal {
  const LicenceRenewal({
    required this.id,
    required this.cycleNo,
    required this.stage,
    required this.fundApproved,
    required this.feeAmount,
    required this.checklist,
    required this.readinessPct,
    this.inspectorName,
    this.auditFindings,
    this.certificateNo,
  });

  factory LicenceRenewal.fromJson(Map<String, Object?> j) => LicenceRenewal(
    id: j['id']! as String,
    cycleNo: (j['cycleNo'] as num?)?.toInt() ?? 1,
    stage: j['stage'] as String? ?? 'INTERNAL_REVIEW',
    fundApproved: j['fundApproved'] == true,
    feeAmount: (j['feeAmount'] as num?)?.toDouble() ?? 0,
    readinessPct: (j['readinessPct'] as num?)?.toDouble() ?? 0,
    inspectorName: j['inspectorName'] as String?,
    auditFindings: j['auditFindings'] as String?,
    certificateNo: j['certificateNo'] as String?,
    checklist: [
      for (final e in (j['checklist'] as List? ?? const []))
        if (e is Map) LicenceCheckItem.fromJson(Map<String, Object?>.from(e)),
    ],
  );

  final String id;
  final int cycleNo;
  final String stage;
  final bool fundApproved;
  final double feeAmount;
  final double readinessPct;
  final String? inspectorName;
  final String? auditFindings;
  final String? certificateNo;
  final List<LicenceCheckItem> checklist;
}

@immutable
class LicenceLetter {
  const LicenceLetter({
    required this.id,
    required this.memoNo,
    required this.channel,
    required this.subject,
    this.body,
    this.parcelId,
    this.createdAt,
    this.createdBy,
  });

  factory LicenceLetter.fromJson(Map<String, Object?> j) => LicenceLetter(
    id: j['id']! as String,
    memoNo: j['memoNo'] as String? ?? '',
    channel: (j['channel'] as String? ?? 'EMAIL').toUpperCase(),
    subject: j['subject'] as String? ?? '',
    body: j['body'] as String?,
    parcelId: j['parcelId'] as String?,
    createdAt: _t(j['createdAt']),
    createdBy: j['createdBy'] as String?,
  );

  final String id;
  final String memoNo;
  final String channel;
  final String subject;
  final String? body;
  final String? parcelId;
  final DateTime? createdAt;
  final String? createdBy;
}

@immutable
class LicenceType {
  const LicenceType({
    required this.id,
    required this.name,
    required this.nameBn,
    required this.bodyCode,
  });

  factory LicenceType.fromJson(Map<String, Object?> j) => LicenceType(
    id: j['id']! as String,
    name: j['name'] as String? ?? '',
    nameBn: j['nameBn'] as String? ?? '',
    bodyCode: j['bodyCode'] as String? ?? '',
  );

  final String id;
  final String name;
  final String nameBn;
  final String bodyCode;

  String display({required bool bangla}) => bangla ? nameBn : name;
}

@immutable
class Licence {
  const Licence({
    required this.id,
    required this.ref,
    required this.title,
    required this.titleBn,
    required this.licenceNo,
    required this.status,
    required this.bodyCode,
    required this.daysToExpiry,
    required this.urgency,
    required this.feeAmount,
    required this.me,
    required this.createdAt,
    this.shutdownRiskPerDay = 0,
    this.exposurePerDay = 0,
    this.siteName,
    this.siteNameBn,
    this.owner,
    this.expiresAt,
    this.typeName,
    this.typeNameBn,
    this.validityMonths = 12,
    this.renewal,
    this.letters = const [],
    this.letterCount = 0,
  });

  factory Licence.fromJson(Map<String, Object?> j) {
    final site = j['site'] is Map ? _map(j['site']) : null;
    final typ = j['type'] is Map ? _map(j['type']) : null;
    final rawLetters = j['letters'] as List? ?? const [];
    final lettersList = [
      for (final l in rawLetters)
        if (l is Map) LicenceLetter.fromJson(Map<String, Object?>.from(l)),
    ];
    return Licence(
      id: j['id']! as String,
      ref: j['ref'] as String? ?? '',
      title: j['title'] as String? ?? '',
      titleBn: j['titleBn'] as String? ?? j['title'] as String? ?? '',
      licenceNo: j['licenceNo'] as String? ?? '',
      status: j['status'] as String? ?? 'ACTIVE',
      bodyCode: j['bodyCode'] as String? ?? '',
      daysToExpiry: (j['daysToExpiry'] as num?)?.toInt() ?? 0,
      urgency: j['urgency'] as String? ?? 'OK',
      feeAmount: (j['feeAmount'] as num?)?.toDouble() ?? 0,
      shutdownRiskPerDay:
          (j['shutdownRiskPerDay'] as num?)?.toDouble() ??
          (j['exposurePerDay'] as num?)?.toDouble() ??
          0,
      exposurePerDay: (j['exposurePerDay'] as num?)?.toDouble() ?? 0,
      me: LicenceMe.fromJson(j['me'] is Map ? _map(j['me']) : {}),
      createdAt: _t(j['createdAt']) ?? DateTime.now().toUtc(),
      siteName: site?['name'] as String?,
      siteNameBn: site?['nameBn'] as String?,
      owner: _person(j['owner']),
      expiresAt: _t(j['expiresAt']),
      typeName: typ?['name'] as String?,
      typeNameBn: typ?['nameBn'] as String?,
      validityMonths: (typ?['validityMonths'] as num?)?.toInt() ?? 12,
      renewal: j['renewal'] is Map
          ? LicenceRenewal.fromJson(_map(j['renewal']))
          : null,
      letters: lettersList,
      letterCount: lettersList.isNotEmpty
          ? lettersList.length
          : rawLetters.length,
    );
  }

  final String id;
  final String ref;
  final String title;
  final String titleBn;
  final String licenceNo;
  final String status;
  final String bodyCode;
  final int daysToExpiry;
  final String urgency;
  final double feeAmount;
  final double shutdownRiskPerDay;
  final double exposurePerDay;
  final LicenceMe me;
  final DateTime createdAt;
  final String? siteName;
  final String? siteNameBn;
  final Person? owner;
  final DateTime? expiresAt;
  final String? typeName;
  final String? typeNameBn;
  final int validityMonths;
  final LicenceRenewal? renewal;
  final List<LicenceLetter> letters;
  final int letterCount;

  String heading({required bool bangla}) => bangla ? titleBn : title;

  String siteLabel({required bool bangla}) =>
      bangla ? (siteNameBn ?? siteName ?? '') : (siteName ?? '');

  String statutoryLaw({required bool bangla}) {
    return switch (bodyCode) {
      'DOEXP' =>
        bangla
            ? 'বাংলাদেশ পেট্রোলিয়াম আইন ২০১৬ (ধারা ১৪) ও বিস্ফোরক বিধিমালা ২০০৪'
            : 'Bangladesh Petroleum Act 2016 (Sec 14) & Explosives Rules 2004',
      'FSCD' =>
        bangla
            ? 'অগ্নি প্রতিরোধ ও নির্বাপণ আইন ২০০৩ (ধারা ৭)'
            : 'Fire Prevention and Extinguishing Act 2003 (Sec 7)',
      'DOENV' =>
        bangla
            ? 'বাংলাদেশ পরিবেশ সংরক্ষণ আইন ১৯৯৫ (ধারা ১২)'
            : 'Bangladesh Environment Conservation Act 1995 (Sec 12)',
      'BSTI' =>
        bangla
            ? 'বাংলাদেশ মান নিয়ন্ত্রণ ও পরীক্ষণ ইনস্টিটিউশন আইন ২০১৮'
            : 'Bangladesh Standards and Testing Institution Act 2018',
      'EMRD' =>
        bangla
            ? 'জাতীয় জ্বালানি নীতি ও পেট্রোলিয়াম আমদানি কোটা নীতিমালা'
            : 'Petroleum Product Import Quota & National Energy Policy',
      'BOILER' =>
        bangla ? 'বয়লার আইন ১৯২৩ (ধারা ৬)' : 'Boilers Act 1923 (Sec 6)',
      _ =>
        bangla
            ? 'প্রযোজ্য শিল্প ও নিরাপত্তা আইন'
            : 'Applicable Statutory Industrial Act',
    };
  }

  String statutoryPenalty({required bool bangla}) {
    return switch (bodyCode) {
      'DOEXP' =>
        bangla
            ? 'প্ল্যান্ট সিলগালা, বিটুমিন মজুদ বাজেয়াপ্ত এবং ৫০ লাখ টাকা জরিমানা।'
            : 'Immediate plant closure, seizure of bitumen storage & BDT 50,00,000 fine.',
      'FSCD' =>
        bangla
            ? 'প্রাঙ্গণ সিলগালা, ইউটিলিটি সংযোগ বিচ্ছিন্ন এবং ২০ লাখ টাকা জরিমানা।'
            : 'Sealing of plant premises, utility disconnection & BDT 20,00,000 fine.',
      'DOENV' =>
        bangla ? 'পরিবেশ ক্ষতিপূরণ আদেশ এবং প্রতিদিন ৫০ হাজার টাকা জরিমানা।' : 'Environmental compensation order and ongoing fine of BDT 50,000 / day.',
      'BSTI' =>
        bangla
            ? 'বাণিজ্যিক বিক্রয় নিষেধাজ্ঞা ও বাজার থেকে পণ্য প্রত্যাহার।'
            : 'Prohibition on commercial bitumen dispatch & product recall.',
      'EMRD' =>
        bangla
            ? 'আমদানি কোটা বাতিল এবং চট্টগ্রাম বন্দরে জাহাজ খালাস স্থগিত।'
            : 'Cancellation of import quota & customs port cargo hold.',
      'BOILER' =>
        bangla
            ? 'স্টিম প্ল্যান্ট তাৎক্ষণিক বন্ধের নির্দেশ ও ১০ লাখ টাকা জরিমানা।'
            : 'Immediate steam generation halt order & BDT 10,00,000 statutory penalty.',
      _ =>
        bangla
            ? 'কার্যক্রম স্থগিত ও জরিমানা।'
            : 'Operational suspension and statutory penalty.',
    };
  }
}
