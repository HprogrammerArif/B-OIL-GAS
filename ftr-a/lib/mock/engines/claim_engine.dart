import 'dart:math' as math;

import 'package:bogcl_oneops/core/network/api_error.dart';
import 'package:bogcl_oneops/mock/engines/audit_engine.dart';
import 'package:bogcl_oneops/mock/engines/file_engine.dart';
import 'package:bogcl_oneops/mock/engines/notification_engine.dart';
import 'package:bogcl_oneops/mock/engines/work_calendar.dart';
import 'package:bogcl_oneops/mock/engines/workflow_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Expense policy for one grade band (doc 06 §12.4 BR-11-02).
class ExpensePolicy {
  const ExpensePolicy({
    required this.band,
    required this.daDhaka,
    required this.daDistrict,
    required this.hotelCap,
    required this.conveyanceCap,
    required this.modes,
  });

  final String band;
  final int daDhaka;
  final int daDistrict;

  /// Per night; null = actuals allowed.
  final int? hotelCap;
  final int conveyanceCap;
  final List<String> modes;

  Json toWire() => {
    'band': band,
    'daDhaka': daDhaka,
    'daDistrict': daDistrict,
    'hotelCapPerNight': hotelCap,
    'conveyanceMonthlyCap': conveyanceCap,
    'mileageRatePerKm': ClaimPolicy.mileageRate,
    'receiptRequiredAbove': ClaimPolicy.receiptAbove,
    'allowedTravelModes': modes,
  };
}

abstract final class ClaimPolicy {
  static const int mileageRate = 18;
  static const int receiptAbove = 500;
  static const int declarationMax = 1000;
  static const Set<String> declarationCategories = {'RICKSHAW', 'CNG', 'MEALS'};
  static const int fullDayHours = 8;
  static const int halfDayHours = 4;
  static const int mileageMaxKmPerLine = 300;
  static const int submitWithinDays = 60;
  static const int maxResubmits = 3;
  static const int advanceSettlementDays = 30;
  static const int maxAdvance = 500000;
  static const int maxLines = 30;

  static const List<String> allModes = [
    'EXECUTIVE_CAR',
    'COMPANY_CAR',
    'POOL_CAR',
    'DOMESTIC_AIR',
    'AC_TRAIN',
    'FIRST_CLASS_TRAIN',
    'TRAIN',
    'AC_BUS',
    'BUS',
    'CNG',
    'RIDE_SHARE',
    'RICKSHAW',
  ];

  static const List<String> types = ['TADA', 'CONVEYANCE', 'TOUR_EVENT'];

  static const Map<String, List<String>> categories = {
    'TADA': ['TICKET', 'HOTEL', 'MEALS', 'MILEAGE', 'CNG', 'RICKSHAW', 'OTHER'],
    'TOUR_EVENT': [
      'TICKET',
      'HOTEL',
      'MEALS',
      'EVENT',
      'MILEAGE',
      'CNG',
      'RICKSHAW',
      'OTHER',
    ],
    'CONVEYANCE': [
      'CNG',
      'RICKSHAW',
      'RIDE_SHARE',
      'BUS_FARE',
      'MILEAGE',
      'OTHER',
    ],
  };

  static const _bands = <String, ExpensePolicy>{
    'A': ExpensePolicy(
      band: 'G1–G2',
      daDhaka: 5000,
      daDistrict: 6000,
      hotelCap: null,
      conveyanceCap: 50000,
      modes: allModes,
    ),
    'B': ExpensePolicy(
      band: 'G3–G4',
      daDhaka: 3500,
      daDistrict: 4500,
      hotelCap: 8000,
      conveyanceCap: 25000,
      modes: ['COMPANY_CAR', 'DOMESTIC_AIR', 'AC_TRAIN', 'POOL_CAR'],
    ),
    'C': ExpensePolicy(
      band: 'G5–G6',
      daDhaka: 2500,
      daDistrict: 3200,
      hotelCap: 5500,
      conveyanceCap: 15000,
      modes: ['POOL_CAR', 'AC_TRAIN', 'AC_BUS'],
    ),
    'D': ExpensePolicy(
      band: 'G7–G8',
      daDhaka: 1500,
      daDistrict: 2000,
      hotelCap: 3000,
      conveyanceCap: 8000,
      modes: ['AC_BUS', 'FIRST_CLASS_TRAIN', 'CNG', 'RIDE_SHARE'],
    ),
    'E': ExpensePolicy(
      band: 'G9–G10',
      daDhaka: 800,
      daDistrict: 1200,
      hotelCap: 1800,
      conveyanceCap: 5000,
      modes: ['BUS', 'TRAIN', 'CNG', 'RICKSHAW'],
    ),
  };

  static const _gradeBand = <String, String>{
    'E10': 'A',
    'E9': 'A',
    'E8': 'A',
    'E7': 'B',
    'M1': 'B',
    'M2': 'B',
    'M3': 'C',
    'O5': 'C',
    'O4': 'C',
    'O3': 'D',
    'S2': 'D',
  };

  static ExpensePolicy forGrade(String code) =>
      _bands[_gradeBand[code] ?? 'E']!;
}

/// Claims: TA/DA, conveyance, tour & event (doc 06 §12).
abstract final class ClaimEngine {
  static const String claimObject = 'Claim';
  static const String advanceObject = 'Advance';

  static void registerHooks() {
    WorkflowHooks.register(claimObject, _onClaimEvent);
    WorkflowHooks.register(advanceObject, _onAdvanceEvent);
  }

  static ExpensePolicy policyFor(Json employee) =>
      ClaimPolicy.forGrade(employee.obj('grade').str('code'));

  static String _prefix(String type) => switch (type) {
    'TADA' => 'TADA',
    'CONVEYANCE' => 'CNV',
    _ => 'TOUR',
  };

  static String nextNo(
    MockStore store,
    String prefix,
    int year, {
    int pad = 4,
  }) {
    var max = 0;
    final col = prefix == 'ADV' ? Col.advances : Col.claims;
    final field = prefix == 'ADV' ? 'advanceNo' : 'claimNo';
    for (final c in store.all(col)) {
      final no = c.str(field);
      if (no.startsWith('$prefix-$year-')) {
        final n = int.tryParse(no.substring(no.lastIndexOf('-') + 1)) ?? 0;
        if (n > max) max = n;
      }
    }
    return '$prefix-$year-${(max + 1).toString().padLeft(pad, '0')}';
  }

  static String nextVoucher(MockStore store, int year) {
    var max = 0;
    for (final c in store.all(Col.claims)) {
      final no = c.strOrNull('voucherNo');
      if (no != null && no.startsWith('VCH-$year-')) {
        final n = int.tryParse(no.substring(no.lastIndexOf('-') + 1)) ?? 0;
        if (n > max) max = n;
      }
    }
    return 'VCH-$year-${(max + 1).toString().padLeft(5, '0')}';
  }

  // ---- Computation (BR-11-03 … BR-11-12) ----

  /// System DA lines for each Dhaka calendar day between depart and return.
  static List<Json> daLines(
    ExpensePolicy policy, {
    required DateTime departAt,
    required DateTime returnAt,
    required bool dhaka,
  }) {
    final out = <Json>[];
    final rate = dhaka ? policy.daDhaka : policy.daDistrict;
    final firstDay = WorkCalendar.dateOf(departAt);
    final lastDay = WorkCalendar.dateOf(returnAt);
    for (
      var d = firstDay;
      d.compareTo(lastDay) <= 0;
      d = WorkCalendar.addDays(d, 1)
    ) {
      final dayStart = WorkCalendar.atTime(d, '00:00');
      final dayEnd = dayStart.add(const Duration(hours: 24));
      final from = departAt.isAfter(dayStart) ? departAt : dayStart;
      final to = returnAt.isBefore(dayEnd) ? returnAt : dayEnd;
      final hours = to.difference(from).inMinutes / 60;
      final factor = hours >= ClaimPolicy.fullDayHours
          ? 1.0
          : hours >= ClaimPolicy.halfDayHours
          ? 0.5
          : 0.0;
      if (factor == 0) continue;
      out.add({
        'id': 'da_$d',
        'category': 'DA',
        'date': d,
        'description': factor == 1
            ? 'Daily allowance'
            : 'Daily allowance (half day)',
        'amount': rate * factor,
        'system': true,
        'isDeclaration': true,
      });
    }
    return out;
  }

  /// Recomputes DA, mileage amounts, flags and totals. Does not save.
  static void recompute(MockStore store, Json claim) {
    final emp = store.get(Col.employees, claim.str('employeeId'))!;
    final policy = policyFor(emp);
    final type = claim.str('type');
    final userLines = [
      for (final l in claim.objList('lines'))
        if (l['system'] != true) l,
    ];
    for (final l in userLines) {
      if (l['category'] == 'MILEAGE') {
        final km = (l['distanceKm'] as num?)?.toDouble() ?? 0;
        l['amount'] = (km * ClaimPolicy.mileageRate * 100).round() / 100;
      }
    }
    final lines = <Json>[];
    if (type != 'CONVEYANCE' &&
        claim['departAt'] != null &&
        claim['returnAt'] != null) {
      final dhaka = claim['destination'] == 'DHAKA';
      lines.addAll(
        daLines(
          policy,
          departAt: DateTime.parse(claim.str('departAt')).toUtc(),
          returnAt: DateTime.parse(claim.str('returnAt')).toUtc(),
          dhaka: dhaka,
        ),
      );
      claim
        ..['periodStart'] = WorkCalendar.dateOf(
          DateTime.parse(claim.str('departAt')),
        )
        ..['periodEnd'] = WorkCalendar.dateOf(
          DateTime.parse(claim.str('returnAt')),
        );
    }
    lines.addAll(userLines);
    claim['lines'] = lines;

    final total = lines.fold<double>(0, (s, l) => s + (l['amount']! as num));
    var entitled = 0.0;
    for (final l in lines) {
      final amount = (l['amount']! as num).toDouble();
      if (l['category'] == 'HOTEL' && policy.hotelCap != null) {
        final nights = math.max(1, (l['nights'] as num?)?.toInt() ?? 1);
        entitled += math.min(amount, policy.hotelCap! * nights);
      } else {
        entitled += amount;
      }
    }
    claim
      ..['totalAmount'] = _r2(total)
      ..['policyAmount'] = _r2(entitled);
    final advance = claim.strOrNull('advanceId') == null
        ? null
        : store.get(Col.advances, claim.str('advanceId'));
    claim['netSettlement'] = advance == null
        ? null
        : _r2(total - (advance['amount']! as num));
    claim['flags'] = flags(store, claim, emp, policy);
  }

  static double _r2(num v) => (v * 100).round() / 100;

  static List<Json> flags(
    MockStore store,
    Json claim,
    Json emp,
    ExpensePolicy policy,
  ) {
    final out = <Json>[];
    void add(String code, String sev, {String? lineId, num? amount}) => out.add(
      {'code': code, 'severity': sev, 'lineId': ?lineId, 'amount': ?amount},
    );
    final lines = claim.objList('lines');
    final type = claim.str('type');
    if (lines.isEmpty) add('NO_LINES', 'HARD');
    for (final l in lines) {
      if (l['system'] == true) continue;
      final amount = (l['amount']! as num).toDouble();
      final cat = l.str('category');
      final declared =
          l['isDeclaration'] == true &&
          ClaimPolicy.declarationCategories.contains(cat) &&
          amount <= ClaimPolicy.declarationMax;
      final needsReceipt =
          cat == 'HOTEL' || (amount > ClaimPolicy.receiptAbove && !declared);
      if (needsReceipt && l['receiptFileId'] == null) {
        add('RECEIPT_REQUIRED', 'HARD', lineId: l.str('id'));
      }
      if (cat == 'HOTEL' && policy.hotelCap != null) {
        final nights = math.max(1, (l['nights'] as num?)?.toInt() ?? 1);
        if (amount / nights > policy.hotelCap!) {
          add(
            'HOTEL_CAP_EXCEEDED',
            'HARD',
            lineId: l.str('id'),
            amount: _r2(amount - policy.hotelCap! * nights),
          );
        }
      }
      if (cat == 'MILEAGE' &&
          ((l['distanceKm'] as num?) ?? 0) > ClaimPolicy.mileageMaxKmPerLine) {
        add('MILEAGE_LONG', 'SOFT', lineId: l.str('id'));
      }
      final rid = l.strOrNull('receiptFileId');
      if (rid != null && _receiptUsedElsewhere(store, claim, rid)) {
        add('DUPLICATE_RECEIPT', 'HARD', lineId: l.str('id'));
      }
    }
    final mode = claim.strOrNull('travelMode');
    if (type != 'CONVEYANCE' && mode != null && !policy.modes.contains(mode)) {
      add('MODE_ABOVE_ENTITLEMENT', 'SOFT');
    }
    final start = claim.strOrNull('periodStart');
    final end = claim.strOrNull('periodEnd');
    if (start != null && end != null) {
      final other = _open(store, claim).where(
        (c) =>
            c['type'] == type &&
            c.str('periodStart').compareTo(end) <= 0 &&
            start.compareTo(c.str('periodEnd')) <= 0,
      );
      if (other.isNotEmpty) add('OVERLAPPING_PERIOD', 'HARD');
      if (type == 'CONVEYANCE') {
        final month = start.substring(0, 7);
        final others = _open(store, claim)
            .where(
              (c) =>
                  c['type'] == 'CONVEYANCE' &&
                  c.str('periodStart').startsWith(month),
            )
            .fold<double>(0, (s, c) => s + (c['totalAmount']! as num));
        final total = others + (claim['totalAmount']! as num);
        if (total > policy.conveyanceCap) {
          add(
            'CONVEYANCE_CAP_EXCEEDED',
            'HARD',
            amount: _r2(total - policy.conveyanceCap),
          );
        }
      }
      if (WorkCalendar.daysBetween(end, WorkCalendar.today()) >
          ClaimPolicy.submitWithinDays) {
        add('LATE_SUBMISSION', 'HARD');
      }
    }
    return out;
  }

  static Iterable<Json> _open(MockStore store, Json claim) => store
      .all(Col.claims)
      .where(
        (c) =>
            c['employeeId'] == claim['employeeId'] &&
            c['id'] != claim['id'] &&
            c['status'] != 'REJECTED' &&
            c['status'] != 'CANCELLED',
      );

  static bool _receiptUsedElsewhere(
    MockStore store,
    Json claim,
    String fileId,
  ) => _open(
    store,
    claim,
  ).any((c) => c.objList('lines').any((l) => l['receiptFileId'] == fileId));

  // ---- Input ----

  static Json create(MockStore store, AuthContext auth, Json body) {
    final type = body['type'];
    if (type is! String || !ClaimPolicy.types.contains(type)) {
      throw validationError('type', 'Choose a claim type');
    }
    final now = store.nowIso();
    final id =
        'clm_${store.collection(Col.claims).length + 1}_${store.nowMs()}';
    final claim = <String, Object?>{
      'id': id,
      'claimNo': nextNo(store, _prefix(type), DateTime.now().year),
      'type': type,
      'employeeId': auth.employeeId,
      'status': 'DRAFT',
      'lines': <Json>[],
      'flags': <Json>[],
      'totalAmount': 0,
      'policyAmount': 0,
      'netSettlement': null,
      'advanceId': null,
      'workflowInstanceId': null,
      'voucherNo': null,
      'paidAt': null,
      'submittedAt': null,
      'resubmits': 0,
      'reviewComment': null,
      'createdAt': now,
      'updatedAt': now,
    };
    apply(store, auth, claim, body);
    return claim;
  }

  /// Validates [body] and writes it onto an editable claim, then saves.
  static void apply(MockStore store, AuthContext auth, Json claim, Json body) {
    if (claim['status'] != 'DRAFT' && claim['status'] != 'RETURNED') {
      throw invalidTransition('This claim can no longer be edited');
    }
    final type = claim.str('type');
    final purpose = body['purpose'];
    if (purpose is! String ||
        purpose.trim().length < 3 ||
        purpose.trim().length > 200) {
      throw validationError('purpose', 'Enter the purpose (3–200 characters)');
    }
    claim['purpose'] = purpose.trim();

    if (type == 'CONVEYANCE') {
      final s = body['periodStart'];
      final e = body['periodEnd'] ?? s;
      if (s is! String || !WorkCalendar.isValidKey(s)) {
        throw validationError('periodStart', 'Enter a valid date');
      }
      if (e is! String || !WorkCalendar.isValidKey(e) || e.compareTo(s) < 0) {
        throw validationError('periodEnd', 'Enter a valid period');
      }
      if (e.compareTo(WorkCalendar.today()) > 0) {
        throw validationError(
          'periodEnd',
          'The period cannot be in the future',
        );
      }
      claim
        ..['periodStart'] = s
        ..['periodEnd'] = e
        ..['departAt'] = null
        ..['returnAt'] = null
        ..['destination'] = null
        ..['travelMode'] = null;
    } else {
      final dep = _instant(body['departAt'], 'departAt');
      final ret = _instant(body['returnAt'], 'returnAt');
      if (!ret.isAfter(dep)) {
        throw validationError('returnAt', 'Return must be after departure');
      }
      if (ret.isAfter(DateTime.now().toUtc())) {
        throw validationError('returnAt', 'Return cannot be in the future');
      }
      final dest = body['destination'];
      if (dest != 'DHAKA' && dest != 'OTHER') {
        throw validationError('destination', 'Choose a destination');
      }
      final place = body['destinationName'];
      final mode = body['travelMode'];
      if (mode != null && !ClaimPolicy.allModes.contains(mode)) {
        throw validationError('travelMode', 'Unknown travel mode');
      }
      claim
        ..['departAt'] = dep.toIso8601String()
        ..['returnAt'] = ret.toIso8601String()
        ..['destination'] = dest
        ..['destinationName'] = place is String && place.trim().isNotEmpty
            ? place.trim()
            : null
        ..['travelMode'] = mode;
    }

    final rawLines = body['lines'];
    if (rawLines is! List) throw validationError('lines', 'lines is required');
    if (rawLines.length > ClaimPolicy.maxLines) {
      throw validationError('lines', 'Too many lines');
    }
    final allowed = ClaimPolicy.categories[type]!;
    final lines = <Json>[];
    for (final (i, raw) in rawLines.indexed) {
      if (raw is! Map) throw validationError('lines[$i]', 'Invalid line');
      final l = Map<String, Object?>.from(raw);
      final cat = l['category'];
      if (cat is! String || !allowed.contains(cat)) {
        throw validationError('lines[$i].category', 'Choose a category');
      }
      final date = l['date'];
      if (date is! String || !WorkCalendar.isValidKey(date)) {
        throw validationError('lines[$i].date', 'Enter a valid date');
      }
      final desc = l['description'];
      final line = <String, Object?>{
        'id': l['id'] is String && (l['id']! as String).isNotEmpty
            ? l['id']
            : 'ln_${store.nowMs()}_$i',
        'category': cat,
        'date': date,
        'description': desc is String ? desc.trim() : '',
        'isDeclaration': l['isDeclaration'] == true,
        'system': false,
      };
      if (cat == 'MILEAGE') {
        final km = l['distanceKm'];
        if (km is! num || km <= 0 || km > 5000) {
          throw validationError('lines[$i].distanceKm', 'Enter the distance');
        }
        final from = l['fromPlace'];
        final to = l['toPlace'];
        if (from is! String ||
            from.trim().isEmpty ||
            to is! String ||
            to.trim().isEmpty) {
          throw validationError('lines[$i].fromPlace', 'Enter from and to');
        }
        line
          ..['distanceKm'] = km
          ..['fromPlace'] = from.trim()
          ..['toPlace'] = to.trim()
          ..['amount'] = 0;
      } else {
        final amount = l['amount'];
        if (amount is! num || amount <= 0 || amount > 10000000) {
          throw validationError('lines[$i].amount', 'Enter a valid amount');
        }
        line['amount'] = _r2(amount);
        if (cat == 'HOTEL') {
          final nights = l['nights'];
          if (nights is! num || nights < 1 || nights > 60) {
            throw validationError('lines[$i].nights', 'Enter the nights');
          }
          line['nights'] = nights.toInt();
        }
      }
      final fid = l['receiptFileId'];
      if (fid is String) {
        final f = store.get(Col.files, fid);
        if (f == null ||
            (f['uploaderUserId'] != auth.user['id']) ||
            f['status'] != 'UPLOADED' ||
            f['scanStatus'] == 'INFECTED') {
          throw validationError(
            'lines[$i].receiptFileId',
            'Receipt is not usable',
          );
        }
        line['receiptFileId'] = fid;
      }
      lines.add(line);
    }
    claim['lines'] = lines;

    // Advance link (tour & event only).
    final adv = body['advanceId'];
    final oldAdv = claim.strOrNull('advanceId');
    if (adv != null && type == 'TOUR_EVENT') {
      final a = store.get(Col.advances, adv as String);
      if (a == null ||
          a['employeeId'] != auth.employeeId ||
          a['status'] != 'DISBURSED' ||
          (a['claimId'] != null && a['claimId'] != claim['id'])) {
        throw validationError('advanceId', 'This advance cannot be linked');
      }
      claim['advanceId'] = adv;
      a['claimId'] = claim['id'];
      store.put(Col.advances, a);
    } else {
      claim['advanceId'] = null;
    }
    if (oldAdv != null && oldAdv != claim['advanceId']) {
      final a = store.get(Col.advances, oldAdv);
      if (a != null && a['claimId'] == claim['id']) {
        a['claimId'] = null;
        store.put(Col.advances, a);
      }
    }

    claim['updatedAt'] = store.nowIso();
    recompute(store, claim);
    store.put(Col.claims, claim);
    // Receipts become attached to this claim.
    for (final l in lines) {
      final fid = l.strOrNull('receiptFileId');
      if (fid != null) {
        FileEngine.attach(
          store,
          fid,
          ownerType: 'Claim',
          ownerId: claim.str('id'),
        );
      }
    }
  }

  static DateTime _instant(Object? raw, String key) {
    final p = raw is String ? DateTime.tryParse(raw) : null;
    if (p == null) throw validationError(key, '$key must be a timestamp');
    return p.toUtc();
  }

  // ---- Lifecycle ----

  static void submit(MockStore store, AuthContext auth, Json claim) {
    if (claim['status'] != 'DRAFT' && claim['status'] != 'RETURNED') {
      throw invalidTransition('This claim cannot be submitted');
    }
    if (claim['status'] == 'RETURNED' &&
        claim.intVal('resubmits') >= ClaimPolicy.maxResubmits) {
      throw policyViolation(
        'MAX_RESUBMITS',
        'This claim was returned too many times. Create a new claim.',
      );
    }
    recompute(store, claim);
    final hard = [
      for (final f in claim.objList('flags'))
        if (f['severity'] == 'HARD') f,
    ];
    if (hard.isNotEmpty) {
      throw HttpError(
        ApiErrorCode.policyViolation,
        'Fix the blocking policy checks before submitting',
        details: [
          for (final f in hard) {'rule': f['code'], 'lineId': f['lineId']},
        ],
      );
    }
    final returned = claim['status'] == 'RETURNED';
    final emp = auth.employee;
    final now = store.nowIso();
    claim
      ..['submittedAt'] = now
      ..['resubmits'] = returned
          ? claim.intVal('resubmits') + 1
          : claim['resubmits']
      ..['reviewComment'] = null
      ..['updatedAt'] = now;
    if (emp['lineManager'] == null) {
      claim['status'] = 'APPROVED';
      store.put(Col.claims, claim);
    } else {
      claim['status'] = 'PENDING_MANAGER';
      store.put(Col.claims, claim);
      fileWorkflow(store, auth.user, claim);
    }
    AuditEngine.log(
      store,
      action: 'CLAIM_SUBMITTED',
      entityType: 'Claim',
      actorUserId: auth.user.str('id'),
      entityId: claim.str('id'),
      after: {'claimNo': claim['claimNo'], 'total': claim['totalAmount']},
    );
  }

  /// Files the `CLAIM` workflow for a submitted claim.
  static void fileWorkflow(MockStore store, Json user, Json claim) {
    final amount = claim['totalAmount']! as num;
    final inst = WorkflowEngine.submit(
      store,
      templateKey: 'CLAIM',
      objectType: claimObject,
      objectId: claim.str('id'),
      initiatorUserId: user.str('id'),
      summary: {
        'refNo': claim['claimNo'],
        'title': '${_typeName(claim.str('type'))} — ${claim['purpose']}',
        'titleBn': '${_typeNameBn(claim.str('type'))} — ${claim['purpose']}',
        'details': claim['purpose'],
        'detailsBn': claim['purpose'],
        'amount': amount,
        'currency': 'BDT',
        'urgency': amount > 50000 ? 'HIGH' : 'NORMAL',
        'category': 'CLAIM',
      },
    );
    claim['workflowInstanceId'] = inst['id'];
    store.put(Col.claims, claim);
  }

  static String _typeName(String t) => switch (t) {
    'TADA' => 'TA/DA claim',
    'CONVEYANCE' => 'Conveyance claim',
    _ => 'Tour & event claim',
  };

  static String _typeNameBn(String t) => switch (t) {
    'TADA' => 'টিএ/ডিএ দাবি',
    'CONVEYANCE' => 'যাতায়াত দাবি',
    _ => 'ভ্রমণ ও ইভেন্ট দাবি',
  };

  static void cancel(MockStore store, AuthContext auth, Json claim) {
    final status = claim.str('status');
    if (status == 'PENDING_MANAGER' && claim['workflowInstanceId'] != null) {
      WorkflowEngine.act(
        store,
        instanceId: claim.str('workflowInstanceId'),
        actorUserId: auth.user.str('id'),
        type: 'WITHDRAW',
      );
    } else if (status == 'DRAFT' || status == 'RETURNED') {
      claim
        ..['status'] = 'CANCELLED'
        ..['updatedAt'] = store.nowIso();
      store.put(Col.claims, claim);
      _unlinkAdvance(store, claim);
    } else {
      throw invalidTransition('This claim can no longer be cancelled');
    }
    AuditEngine.log(
      store,
      action: 'CLAIM_CANCELLED',
      entityType: 'Claim',
      actorUserId: auth.user.str('id'),
      entityId: claim.str('id'),
      after: {'claimNo': claim['claimNo']},
    );
  }

  static void _unlinkAdvance(MockStore store, Json claim) {
    final aid = claim.strOrNull('advanceId');
    final a = aid == null ? null : store.get(Col.advances, aid);
    if (a != null && a['claimId'] == claim['id']) {
      a['claimId'] = null;
      store.put(Col.advances, a);
    }
  }

  static void pay(MockStore store, AuthContext auth, Json claim) {
    if (claim['status'] != 'APPROVED') {
      throw invalidTransition('Only approved claims can be paid');
    }
    if (claim['employeeId'] == auth.employeeId) {
      throw forbidden('You cannot pay your own claim');
    }
    final now = store.nowIso();
    claim
      ..['status'] = 'SETTLED'
      ..['voucherNo'] = nextVoucher(store, DateTime.now().year)
      ..['paidAt'] = now
      ..['updatedAt'] = now;
    store.put(Col.claims, claim);
    final aid = claim.strOrNull('advanceId');
    final a = aid == null ? null : store.get(Col.advances, aid);
    if (a != null) {
      a
        ..['status'] = 'SETTLED'
        ..['settledAt'] = now;
      store.put(Col.advances, a);
    }
    _notifyOwner(
      store,
      claim,
      'CLAIM_SETTLED',
      Bi('Claim paid', 'দাবির অর্থ পরিশোধিত'),
      Bi(
        '${claim['claimNo']} was paid, voucher ${claim['voucherNo']}.',
        '${claim['claimNo']} পরিশোধিত, ভাউচার ${claim['voucherNo']}।',
      ),
    );
    AuditEngine.log(
      store,
      action: 'CLAIM_SETTLED',
      entityType: 'Claim',
      actorUserId: auth.user.str('id'),
      entityId: claim.str('id'),
      after: {'voucherNo': claim['voucherNo']},
    );
  }

  static void _notifyOwner(
    MockStore store,
    Json claim,
    String type,
    Bi title,
    Bi body,
  ) {
    final emp = store.get(Col.employees, claim.str('employeeId'));
    final uid = emp?.strOrNull('userId');
    if (uid == null) return;
    NotificationEngine.notify(
      store,
      userId: uid,
      type: type,
      title: title,
      body: body,
      data: {'module': 'claims', 'route': '/home/claims/${claim['id']}'},
    );
  }

  static void _onClaimEvent(
    MockStore store,
    Json instance,
    WorkflowEvent event,
  ) {
    final c = store.get(Col.claims, instance.str('objectId'));
    if (c == null) return;
    final now = store.nowIso();
    String? commentOf() => WorkflowEngine.stepsOf(store, instance)
        .where((s) => s['decision'] != null)
        .map((s) => s.strOrNull('comment'))
        .whereType<String>()
        .lastOrNull;
    switch (event) {
      case WorkflowEvent.submitted || WorkflowEvent.stepApproved:
        final active = WorkflowEngine.stepsOf(store, instance)
            .where((s) => s['status'] == 'ACTIVE')
            .map((s) => s.str('key'))
            .firstOrNull;
        c['status'] = active == 'FINANCE' || active == 'GM'
            ? 'PENDING_FINANCE'
            : 'PENDING_MANAGER';
      case WorkflowEvent.approved:
        c['status'] = 'APPROVED';
        _notifyOwner(
          store,
          c,
          'CLAIM_APPROVED',
          Bi('Claim approved', 'দাবি অনুমোদিত'),
          Bi(
            '${c['claimNo']} is approved and queued for payment.',
            '${c['claimNo']} অনুমোদিত হয়েছে, পরিশোধের অপেক্ষায়।',
          ),
        );
      case WorkflowEvent.rejected:
        c
          ..['status'] = 'REJECTED'
          ..['reviewComment'] = commentOf();
        _unlinkAdvance(store, c);
      case WorkflowEvent.returned:
        c
          ..['status'] = 'RETURNED'
          ..['reviewComment'] = commentOf();
      case WorkflowEvent.withdrawn:
        c['status'] = 'CANCELLED';
        _unlinkAdvance(store, c);
    }
    c['updatedAt'] = now;
    store.put(Col.claims, c);
  }

  // ---- Advances ----

  static Json createAdvance(MockStore store, AuthContext auth, Json body) {
    final amount = body['amount'];
    if (amount is! num || amount <= 0 || amount > ClaimPolicy.maxAdvance) {
      throw validationError('amount', 'Enter an amount up to ৳500,000');
    }
    final purpose = body['purpose'];
    if (purpose is! String ||
        purpose.trim().length < 5 ||
        purpose.trim().length > 200) {
      throw validationError('purpose', 'Enter the purpose');
    }
    final start = body['tourStart'];
    final end = body['tourEnd'];
    if (start is! String || !WorkCalendar.isValidKey(start)) {
      throw validationError('tourStart', 'Enter a valid date');
    }
    if (end is! String ||
        !WorkCalendar.isValidKey(end) ||
        end.compareTo(start) < 0) {
      throw validationError('tourEnd', 'Enter a valid date');
    }
    final today = WorkCalendar.today();
    final overdue = store
        .all(Col.advances)
        .where(
          (a) =>
              a['employeeId'] == auth.employeeId &&
              a['status'] == 'DISBURSED' &&
              a['claimId'] == null &&
              WorkCalendar.daysBetween(a.str('tourEnd'), today) >
                  ClaimPolicy.advanceSettlementDays,
        );
    if (overdue.isNotEmpty) {
      throw HttpError(
        ApiErrorCode.conflict,
        'Settle your earlier advance first',
        details: [
          {'rule': 'ADVANCE_OVERDUE', 'advanceNo': overdue.first['advanceNo']},
        ],
      );
    }
    final now = store.nowIso();
    final id =
        'adv_${store.collection(Col.advances).length + 1}_${store.nowMs()}';
    final adv = <String, Object?>{
      'id': id,
      'advanceNo': nextNo(store, 'ADV', DateTime.now().year),
      'employeeId': auth.employeeId,
      'amount': _r2(amount),
      'purpose': purpose.trim(),
      'tourStart': start,
      'tourEnd': end,
      'status': 'PENDING_MANAGER',
      'claimId': null,
      'workflowInstanceId': null,
      'disbursedAt': null,
      'settledAt': null,
      'createdAt': now,
      'updatedAt': now,
    };
    store.put(Col.advances, adv);
    submitAdvance(store, auth.user, auth.employee, adv);
    AuditEngine.log(
      store,
      action: 'ADVANCE_REQUESTED',
      entityType: 'Advance',
      actorUserId: auth.user.str('id'),
      entityId: id,
      after: {'advanceNo': adv['advanceNo'], 'amount': adv['amount']},
    );
    return adv;
  }

  static void submitAdvance(MockStore store, Json user, Json emp, Json adv) {
    if (emp['lineManager'] == null) {
      adv['status'] = 'APPROVED';
      store.put(Col.advances, adv);
      return;
    }
    final inst = WorkflowEngine.submit(
      store,
      templateKey: 'TOUR_ADVANCE',
      objectType: advanceObject,
      objectId: adv.str('id'),
      initiatorUserId: user.str('id'),
      summary: {
        'refNo': adv['advanceNo'],
        'title': 'Tour advance — ${adv['purpose']}',
        'titleBn': 'ভ্রমণ অগ্রিম — ${adv['purpose']}',
        'details': adv['purpose'],
        'detailsBn': adv['purpose'],
        'amount': adv['amount'],
        'currency': 'BDT',
        'urgency': 'NORMAL',
        'category': 'ADVANCE',
      },
    );
    adv['workflowInstanceId'] = inst['id'];
    store.put(Col.advances, adv);
  }

  static void disburse(MockStore store, AuthContext auth, Json adv) {
    if (adv['status'] != 'APPROVED') {
      throw invalidTransition('Only approved advances can be disbursed');
    }
    if (adv['employeeId'] == auth.employeeId) {
      throw forbidden('You cannot disburse your own advance');
    }
    final now = store.nowIso();
    adv
      ..['status'] = 'DISBURSED'
      ..['disbursedAt'] = now
      ..['updatedAt'] = now;
    store.put(Col.advances, adv);
    final emp = store.get(Col.employees, adv.str('employeeId'));
    final uid = emp?.strOrNull('userId');
    if (uid != null) {
      NotificationEngine.notify(
        store,
        userId: uid,
        type: 'ADVANCE_DISBURSED',
        title: const Bi('Advance disbursed', 'অগ্রিম বিতরণ হয়েছে'),
        body: Bi(
          '${adv['advanceNo']}: ৳${adv['amount']} is on its way.',
          '${adv['advanceNo']}: ৳${adv['amount']} প্রদান করা হয়েছে।',
        ),
        data: {'module': 'claims', 'route': '/home/claims'},
      );
    }
    AuditEngine.log(
      store,
      action: 'ADVANCE_DISBURSED',
      entityType: 'Advance',
      actorUserId: auth.user.str('id'),
      entityId: adv.str('id'),
      after: {'advanceNo': adv['advanceNo']},
    );
  }

  static void cancelAdvance(MockStore store, AuthContext auth, Json adv) {
    final status = adv.str('status');
    if (status == 'PENDING_MANAGER' || status == 'PENDING_FINANCE') {
      final inst = adv.strOrNull('workflowInstanceId');
      if (inst != null) {
        WorkflowEngine.act(
          store,
          instanceId: inst,
          actorUserId: auth.user.str('id'),
          type: 'WITHDRAW',
        );
        return;
      }
    }
    if (status == 'APPROVED') {
      adv
        ..['status'] = 'CANCELLED'
        ..['updatedAt'] = store.nowIso();
      store.put(Col.advances, adv);
      return;
    }
    throw invalidTransition('This advance can no longer be cancelled');
  }

  static void _onAdvanceEvent(
    MockStore store,
    Json instance,
    WorkflowEvent event,
  ) {
    final a = store.get(Col.advances, instance.str('objectId'));
    if (a == null) return;
    switch (event) {
      case WorkflowEvent.submitted || WorkflowEvent.stepApproved:
        final active = WorkflowEngine.stepsOf(store, instance)
            .where((s) => s['status'] == 'ACTIVE')
            .map((s) => s.str('key'))
            .firstOrNull;
        a['status'] = active == 'FINANCE'
            ? 'PENDING_FINANCE'
            : 'PENDING_MANAGER';
      case WorkflowEvent.approved:
        a['status'] = 'APPROVED';
      case WorkflowEvent.rejected:
        a['status'] = 'REJECTED';
      case WorkflowEvent.returned:
        a['status'] = 'REJECTED';
      case WorkflowEvent.withdrawn:
        a['status'] = 'CANCELLED';
    }
    a['updatedAt'] = store.nowIso();
    store.put(Col.advances, a);
  }

  // ---- Wire ----

  static Json personRef(MockStore store, String employeeId) {
    final e = store.get(Col.employees, employeeId);
    return {
      'id': employeeId,
      'fullName': e?['fullName'] ?? '',
      'fullNameBn': e?['fullNameBn'] ?? '',
      'department': e?.obj('department')['name'],
    };
  }

  static Json claimWire(MockStore store, Json c, {bool detail = false}) {
    return {
      'id': c['id'],
      'claimNo': c['claimNo'],
      'type': c['type'],
      'purpose': c['purpose'],
      'status': c['status'],
      'employee': personRef(store, c.str('employeeId')),
      'periodStart': c['periodStart'],
      'periodEnd': c['periodEnd'],
      'totalAmount': c['totalAmount'],
      'policyAmount': c['policyAmount'],
      'netSettlement': c['netSettlement'],
      'hardFlags': c
          .objList('flags')
          .where((f) => f['severity'] == 'HARD')
          .length,
      'softFlags': c
          .objList('flags')
          .where((f) => f['severity'] == 'SOFT')
          .length,
      'voucherNo': c['voucherNo'],
      'paidAt': c['paidAt'],
      'submittedAt': c['submittedAt'],
      'createdAt': c['createdAt'],
      if (detail) ...{
        'destination': c['destination'],
        'destinationName': c['destinationName'],
        'travelMode': c['travelMode'],
        'departAt': c['departAt'],
        'returnAt': c['returnAt'],
        'lines': c['lines'],
        'flags': c['flags'],
        'advance': c['advanceId'] == null
            ? null
            : advanceWire(store, store.get(Col.advances, c.str('advanceId'))!),
        'reviewComment': c['reviewComment'],
        'resubmits': c['resubmits'],
        'workflowInstanceId': c['workflowInstanceId'],
      },
    };
  }

  static Json advanceWire(MockStore store, Json a) => {
    'id': a['id'],
    'advanceNo': a['advanceNo'],
    'employee': personRef(store, a.str('employeeId')),
    'amount': a['amount'],
    'purpose': a['purpose'],
    'tourStart': a['tourStart'],
    'tourEnd': a['tourEnd'],
    'status': a['status'],
    'claimId': a['claimId'],
    'disbursedAt': a['disbursedAt'],
    'createdAt': a['createdAt'],
    'workflowInstanceId': a['workflowInstanceId'],
  };

  static Json policyWire(MockStore store, Json emp) {
    final policy = policyFor(emp);
    final month = WorkCalendar.today().substring(0, 7);
    final used = store
        .all(Col.claims)
        .where(
          (c) =>
              c['employeeId'] == emp['id'] &&
              c['type'] == 'CONVEYANCE' &&
              c['status'] != 'REJECTED' &&
              c['status'] != 'CANCELLED' &&
              c.str('periodStart').startsWith(month),
        )
        .fold<double>(0, (s, c) => s + (c['totalAmount']! as num));
    return {
      ...policy.toWire(),
      'conveyanceUsedThisMonth': _r2(used),
      'declarationMaxAmount': ClaimPolicy.declarationMax,
      'declarationCategories': ClaimPolicy.declarationCategories.toList(),
      'categories': ClaimPolicy.categories,
      'submitWithinDays': ClaimPolicy.submitWithinDays,
    };
  }
}
