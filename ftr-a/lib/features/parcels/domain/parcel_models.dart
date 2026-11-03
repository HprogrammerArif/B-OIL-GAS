import 'package:bogcl_oneops/features/approvals/domain/approval_models.dart';
import 'package:flutter/foundation.dart';

Person? _person(Object? v) =>
    v == null ? null : Person.fromJson(Map<String, Object?>.from(v as Map));

@immutable
class SiteRef {
  const SiteRef({required this.id, required this.name, required this.nameBn});

  factory SiteRef.fromJson(Map<String, Object?> j) => SiteRef(
    id: j['id']! as String,
    name: j['name']! as String,
    nameBn: (j['nameBn'] as String?) ?? j['name']! as String,
  );

  final String id;
  final String name;
  final String nameBn;

  String label({required bool bangla}) => bangla ? nameBn : name;
}

@immutable
class ParcelEvent {
  const ParcelEvent({
    required this.seqNo,
    required this.type,
    required this.createdAt,
    required this.eventHash,
    this.actor,
    this.location,
    this.note,
    this.photoFileId,
  });

  factory ParcelEvent.fromJson(Map<String, Object?> j) => ParcelEvent(
    seqNo: (j['seqNo']! as num).toInt(),
    type: j['type']! as String,
    actor: _person(j['actor']),
    location: j['location'] as String?,
    note: j['note'] as String?,
    photoFileId: j['photoFileId'] as String?,
    createdAt: DateTime.parse(j['createdAt']! as String),
    eventHash: j['eventHash']! as String,
  );

  final int seqNo;
  final String type;
  final Person? actor;
  final String? location;
  final String? note;
  final String? photoFileId;
  final DateTime createdAt;
  final String eventHash;
}

/// What the signed-in person may do with this parcel right now. The server
/// decides; the app only shows buttons that will work.
@immutable
class ParcelAccess {
  const ParcelAccess({
    required this.isSender,
    required this.isRecipient,
    required this.isCourier,
    required this.canEdit,
    required this.canCancel,
    required this.canDispatch,
    required this.canCheckpoint,
    required this.canGateIn,
    required this.canOutForDelivery,
    required this.canVerifyOtp,
    required this.canAccept,
    required this.canResendOtp,
    required this.canFlag,
    required this.canReturn,
    required this.canException,
    required this.canNote,
    required this.photoRequiredForDelivery,
    required this.sealRequired,
  });

  factory ParcelAccess.fromJson(Map<String, Object?> j) {
    bool b(String k) => j[k] == true;
    return ParcelAccess(
      isSender: b('isSender'),
      isRecipient: b('isRecipient'),
      isCourier: b('isCourier'),
      canEdit: b('canEdit'),
      canCancel: b('canCancel'),
      canDispatch: b('canDispatch'),
      canCheckpoint: b('canCheckpoint'),
      canGateIn: b('canGateIn'),
      canOutForDelivery: b('canOutForDelivery'),
      canVerifyOtp: b('canVerifyOtp'),
      canAccept: b('canAccept'),
      canResendOtp: b('canResendOtp'),
      canFlag: b('canFlag'),
      canReturn: b('canReturn'),
      canException: b('canException'),
      canNote: b('canNote'),
      photoRequiredForDelivery: b('photoRequiredForDelivery'),
      sealRequired: b('sealRequired'),
    );
  }

  final bool isSender;
  final bool isRecipient;
  final bool isCourier;
  final bool canEdit;
  final bool canCancel;
  final bool canDispatch;
  final bool canCheckpoint;
  final bool canGateIn;
  final bool canOutForDelivery;
  final bool canVerifyOtp;
  final bool canAccept;
  final bool canResendOtp;
  final bool canFlag;
  final bool canReturn;
  final bool canException;
  final bool canNote;
  final bool photoRequiredForDelivery;
  final bool sealRequired;
}

@immutable
class Parcel {
  const Parcel({
    required this.id,
    required this.trackingNo,
    required this.category,
    required this.urgency,
    required this.status,
    required this.tamperStatus,
    required this.isConfidential,
    required this.hidden,
    required this.sender,
    required this.recipient,
    required this.origin,
    required this.dest,
    required this.intraSite,
    required this.dwellHours,
    required this.stuck,
    required this.lastEventAt,
    required this.createdAt,
    required this.me,
    this.description,
    this.declaredValue,
    this.courier,
    this.sealNo,
    this.waybillNo,
    this.specialHandling = const [],
    this.weightKg,
    this.deliveredAt,
    this.deliveredMethod,
    this.returnNo,
    this.returnReason,
    this.returnDetails,
    this.events = const [],
    this.chainValid = true,
  });

  factory Parcel.fromJson(Map<String, Object?> j) {
    final ret = j['return'] == null
        ? null
        : Map<String, Object?>.from(j['return']! as Map);
    return Parcel(
      id: j['id']! as String,
      trackingNo: j['trackingNo']! as String,
      waybillNo: j['waybillNo'] as String?,
      category: j['category']! as String,
      urgency: j['urgency']! as String,
      status: j['status']! as String,
      tamperStatus: j['tamperStatus']! as String,
      description: j['description'] as String?,
      declaredValue: (j['declaredValue'] as num?)?.toDouble(),
      isConfidential: j['isConfidential'] == true,
      hidden: j['hidden'] == true,
      sender: _person(j['sender'])!,
      recipient: _person(j['recipient'])!,
      courier: _person(j['courier']),
      origin: SiteRef.fromJson(Map<String, Object?>.from(j['origin']! as Map)),
      dest: SiteRef.fromJson(Map<String, Object?>.from(j['dest']! as Map)),
      intraSite: j['intraSite'] == true,
      sealNo: j['sealNo'] as String?,
      specialHandling: [
        for (final h in (j['specialHandling'] as List<Object?>? ?? const []))
          h! as String,
      ],
      weightKg: (j['weightKg'] as num?)?.toDouble(),
      dwellHours: (j['dwellHours'] as num?)?.toInt() ?? 0,
      stuck: j['stuck'] == true,
      deliveredAt: j['deliveredAt'] == null
          ? null
          : DateTime.parse(j['deliveredAt']! as String),
      deliveredMethod: j['deliveredMethod'] as String?,
      lastEventAt: DateTime.parse(j['lastEventAt']! as String),
      createdAt: DateTime.parse(j['createdAt']! as String),
      me: ParcelAccess.fromJson(Map<String, Object?>.from(j['me']! as Map)),
      returnNo: ret?['returnNo'] as String?,
      returnReason: ret?['reason'] as String?,
      returnDetails: ret?['details'] as String?,
      events: [
        for (final e in (j['events'] as List<Object?>? ?? const []))
          ParcelEvent.fromJson(Map<String, Object?>.from(e! as Map)),
      ],
      chainValid: j['chainValid'] != false,
    );
  }

  final String id;
  final String trackingNo;
  final String? waybillNo;
  final String category;
  final String urgency;
  final String status;
  final String tamperStatus;
  final String? description;
  final double? declaredValue;
  final bool isConfidential;
  final bool hidden;
  final Person sender;
  final Person recipient;
  final Person? courier;
  final SiteRef origin;
  final SiteRef dest;
  final bool intraSite;
  final String? sealNo;
  final List<String> specialHandling;
  final double? weightKg;
  final int dwellHours;
  final bool stuck;
  final DateTime? deliveredAt;
  final String? deliveredMethod;
  final DateTime lastEventAt;
  final DateTime createdAt;
  final ParcelAccess me;
  final String? returnNo;
  final String? returnReason;
  final String? returnDetails;
  final List<ParcelEvent> events;
  final bool chainValid;

  bool get isOpen => !const {
    'DELIVERED',
    'RETURNED',
    'LOST',
    'CANCELLED',
  }.contains(status);
}
