import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:flutter/foundation.dart';

List<Map<String, Object?>> _list(Object? v) => [
  for (final e in (v as List<Object?>? ?? const <Object?>[]))
    Map<String, Object?>.from(e! as Map),
];

DateTime? _date(Object? v) => v == null ? null : DateTime.parse(v as String);

@immutable
class Quote {
  const Quote({
    required this.vendorName,
    required this.amount,
    this.deliveryDays = 0,
    this.warrantyMonths = 0,
    this.isRecommended = false,
  });

  factory Quote.fromJson(Map<String, Object?> j) => Quote(
    vendorName: j['vendorName']! as String,
    amount: (j['amount']! as num).toDouble(),
    deliveryDays: (j['deliveryDays'] as num?)?.toInt() ?? 0,
    warrantyMonths: (j['warrantyMonths'] as num?)?.toInt() ?? 0,
    isRecommended: j['isRecommended'] == true,
  );

  final String vendorName;
  final double amount;
  final int deliveryDays;
  final int warrantyMonths;
  final bool isRecommended;

  Map<String, Object?> toJson() => {
    'vendorName': vendorName,
    'amount': amount,
    'deliveryDays': deliveryDays,
    'warrantyMonths': warrantyMonths,
    'isRecommended': isRecommended,
  };

  Quote copyWith({bool? isRecommended}) => Quote(
    vendorName: vendorName,
    amount: amount,
    deliveryDays: deliveryDays,
    warrantyMonths: warrantyMonths,
    isRecommended: isRecommended ?? this.isRecommended,
  );
}

/// One entry of the append-only note trail (kind NOTE, QUERY or RETURN).
@immutable
class Paragraph {
  const Paragraph({
    required this.seqNo,
    required this.kind,
    required this.body,
    required this.author,
    required this.createdAt,
    required this.contentHash,
  });

  factory Paragraph.fromJson(Map<String, Object?> j) => Paragraph(
    seqNo: (j['seqNo']! as num).toInt(),
    kind: j['kind']! as String,
    body: j['body']! as String,
    author: Person.fromJson(Map<String, Object?>.from(j['author']! as Map)),
    createdAt: DateTime.parse(j['createdAt']! as String),
    contentHash: j['contentHash']! as String,
  );

  final int seqNo;
  final String kind;
  final String body;
  final Person author;
  final DateTime createdAt;
  final String contentHash;
}

@immutable
class NoteSignature {
  const NoteSignature({
    required this.stepName,
    required this.signerName,
    required this.signerNameBn,
    required this.method,
    required this.stampCode,
    required this.documentHash,
    required this.signedAt,
    this.roleTitle,
    this.departmentName,
    this.departmentNameBn,
    this.comment,
    this.typedName,
    this.imageFileId,
  });

  factory NoteSignature.fromJson(Map<String, Object?> j) => NoteSignature(
    stepName: j['stepName']! as String,
    signerName: j['signerName']! as String,
    signerNameBn: (j['signerNameBn'] as String?) ?? j['signerName']! as String,
    roleTitle: j['roleTitle'] as String?,
    departmentName: j['departmentName'] as String?,
    departmentNameBn: j['departmentNameBn'] as String?,
    comment: j['comment'] as String?,
    method: j['method']! as String,
    typedName: j['typedName'] as String?,
    imageFileId: j['imageFileId'] as String?,
    stampCode: j['stampCode']! as String,
    documentHash: j['documentHash']! as String,
    signedAt: DateTime.parse(j['signedAt']! as String),
  );

  final String stepName;
  final String signerName;
  final String signerNameBn;
  final String? roleTitle;
  final String? departmentName;
  final String? departmentNameBn;
  final String? comment;
  final String method;
  final String? typedName;
  final String? imageFileId;
  final String stampCode;
  final String documentHash;
  final DateTime signedAt;

  String name({required bool bangla}) => bangla ? signerNameBn : signerName;

  String? department({required bool bangla}) {
    final bn = departmentNameBn;
    if (bangla && bn != null && bn.isNotEmpty) return bn;
    final en = departmentName;
    if (en == null || en.isEmpty) return null;
    return en;
  }
}

@immutable
class NoteSheetAccess {
  const NoteSheetAccess({
    required this.isInitiator,
    required this.canEdit,
    required this.canSubmit,
    required this.canSign,
    required this.canWithdraw,
    required this.canAppend,
  });

  factory NoteSheetAccess.fromJson(Map<String, Object?> j) => NoteSheetAccess(
    isInitiator: j['isInitiator'] == true,
    canEdit: j['canEdit'] == true,
    canSubmit: j['canSubmit'] == true,
    canSign: j['canSign'] == true,
    canWithdraw: j['canWithdraw'] == true,
    canAppend: j['canAppend'] == true,
  );

  final bool isInitiator;
  final bool canEdit;
  final bool canSubmit;
  final bool canSign;
  final bool canWithdraw;
  final bool canAppend;
}

@immutable
class RouteSigner {
  const RouteSigner({
    required this.userId,
    required this.name,
    required this.nameBn,
    this.title,
  });

  factory RouteSigner.fromJson(Map<String, Object?> j) => RouteSigner(
    userId: j['userId']! as String,
    name: (j['name'] as String?) ?? '',
    nameBn: (j['nameBn'] as String?) ?? (j['name'] as String?) ?? '',
    title: j['title'] as String?,
  );

  final String userId;
  final String name;
  final String nameBn;
  final String? title;

  String display({required bool bangla}) =>
      bangla && nameBn.isNotEmpty ? nameBn : name;
}

/// List rows have no paragraphs, quotes or signatures (empty lists).
@immutable
class NoteSheet {
  const NoteSheet({
    required this.id,
    required this.title,
    required this.subject,
    required this.status,
    required this.urgency,
    required this.confidentiality,
    required this.departmentName,
    required this.departmentNameBn,
    required this.initiator,
    required this.waitingFor,
    required this.me,
    required this.quoteCount,
    required this.signedCount,
    required this.createdAt,
    required this.updatedAt,
    this.fileNo,
    this.amount,
    this.currentStepName,
    this.workflowInstanceId,
    this.submittedAt,
    this.approvedAt,
    this.justification,
    this.recommendationNote,
    this.quotes = const [],
    this.paragraphs = const [],
    this.signatures = const [],
    this.verificationCode,
    this.finalHash,
    this.budgetHead,
    this.budgetHeadBn,
    this.budgetAccount,
    this.budgetAvailable,
    this.signatoryCustom = false,
    this.plannedSigners = const [],
  });

  factory NoteSheet.fromJson(Map<String, Object?> j) {
    final dept = Map<String, Object?>.from(j['department']! as Map);
    final budget = j['budget'] is Map
        ? Map<String, Object?>.from(j['budget']! as Map)
        : null;
    return NoteSheet(
      id: j['id']! as String,
      fileNo: j['fileNo'] as String?,
      title: j['title']! as String,
      subject: j['subject']! as String,
      status: j['status']! as String,
      amount: (j['amount'] as num?)?.toDouble(),
      urgency: j['urgency']! as String,
      confidentiality: j['confidentiality']! as String,
      departmentName: (dept['name'] as String?) ?? '',
      departmentNameBn: (dept['nameBn'] as String?) ?? '',
      initiator: Person.fromJson(
        Map<String, Object?>.from(j['initiator']! as Map),
      ),
      waitingFor: [for (final p in _list(j['waitingFor'])) Person.fromJson(p)],
      currentStepName: j['currentStepName'] as String?,
      me: NoteSheetAccess.fromJson(Map<String, Object?>.from(j['me']! as Map)),
      quoteCount: (j['quoteCount'] as num?)?.toInt() ?? 0,
      signedCount: (j['signedCount'] as num?)?.toInt() ?? 0,
      workflowInstanceId: j['workflowInstanceId'] as String?,
      submittedAt: _date(j['submittedAt']),
      approvedAt: _date(j['approvedAt']),
      createdAt: DateTime.parse(j['createdAt']! as String),
      updatedAt: DateTime.parse(j['updatedAt']! as String),
      justification: j['justification'] as String?,
      recommendationNote: j['recommendationNote'] as String?,
      quotes: [for (final q in _list(j['quotes'])) Quote.fromJson(q)],
      paragraphs: [
        for (final p in _list(j['paragraphs'])) Paragraph.fromJson(p),
      ],
      signatures: [
        for (final s in _list(j['signatures'])) NoteSignature.fromJson(s),
      ],
      verificationCode: j['verificationCode'] as String?,
      finalHash: j['finalHash'] as String?,
      budgetHead: budget?['head'] as String?,
      budgetHeadBn: budget?['headBn'] as String?,
      budgetAccount: budget?['accountCode'] as String?,
      budgetAvailable: (budget?['available'] as num?)?.toDouble(),
      signatoryCustom: j['signatoryCustom'] == true,
      plannedSigners: [
        for (final p in _list(j['plannedSigners'])) RouteSigner.fromJson(p),
      ],
    );
  }

  final String id;
  final String? fileNo;
  final String title;
  final String subject;
  final String status;
  final double? amount;
  final String urgency;
  final String confidentiality;
  final String departmentName;
  final String departmentNameBn;
  final Person initiator;
  final List<Person> waitingFor;
  final String? currentStepName;
  final NoteSheetAccess me;
  final int quoteCount;
  final int signedCount;
  final String? workflowInstanceId;
  final DateTime? submittedAt;
  final DateTime? approvedAt;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String? justification;
  final String? recommendationNote;
  final List<Quote> quotes;
  final List<Paragraph> paragraphs;
  final List<NoteSignature> signatures;
  final String? verificationCode;
  final String? finalHash;
  final String? budgetHead;
  final String? budgetHeadBn;
  final String? budgetAccount;
  final double? budgetAvailable;
  final bool signatoryCustom;
  final List<RouteSigner> plannedSigners;

  String budgetName({required bool bangla}) =>
      bangla ? (budgetHeadBn ?? budgetHead ?? '') : (budgetHead ?? '');

  bool get isOpen => status == 'IN_REVIEW';
  bool get isApproved => status == 'APPROVED';

  String department({required bool bangla}) =>
      bangla ? departmentNameBn : departmentName;
}

/// Quotes need to be at least this much (BR-03-06).
const quotesRequiredAbove = 200000.0;
const minQuotes = 3;

/// "Energypac is cheapest" facts derived from the quotes.
@immutable
class PriceVerdict {
  const PriceVerdict({
    required this.count,
    required this.lowest,
    required this.recommended,
    required this.savingVsHighest,
  });

  final int count;
  final Quote lowest;
  final Quote? recommended;

  /// Highest minus lowest price.
  final double savingVsHighest;

  bool get recommendedIsLowest =>
      recommended != null && recommended!.amount <= lowest.amount;

  double get recommendedOverLowest =>
      recommended == null ? 0 : recommended!.amount - lowest.amount;

  static PriceVerdict? of(List<Quote> quotes) {
    if (quotes.isEmpty) return null;
    final sorted = [...quotes]..sort((a, b) => a.amount.compareTo(b.amount));
    final rec = quotes.where((q) => q.isRecommended).firstOrNull;
    return PriceVerdict(
      count: quotes.length,
      lowest: sorted.first,
      recommended: rec,
      savingVsHighest: sorted.last.amount - sorted.first.amount,
    );
  }
}
