import 'package:bogcl_oneops/mock/engines/notification_engine.dart';
import 'package:bogcl_oneops/mock/engines/workflow_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/seed/rbac.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Settings behind doc 06 MOD-06 (BR-06-01 … BR-06-12).
abstract final class LicencePolicy {
  static const criticalDays = 30;
  static const warningDays = 90;
  static const letterDays = 30;
  static const defaultLeadDays = 90;
  static const stages = [
    'INTERNAL_REVIEW',
    'APPLICATION_FILED',
    'FIELD_INSPECTION',
    'MINISTRY_VETTING',
    'RENEWED',
  ];
  static const bodies = <Json>[
    {
      'code': 'DOEXP',
      'name': 'Department of Explosives',
      'nameBn': 'বিস্ফোরক অধিদপ্তর',
    },
    {'code': 'FSCD', 'name': 'Fire Service', 'nameBn': 'ফায়ার সার্ভিস'},
    {
      'code': 'DOENV',
      'name': 'Department of Environment',
      'nameBn': 'পরিবেশ অধিদপ্তর',
    },
    {'code': 'BSTI', 'name': 'BSTI', 'nameBn': 'বিএসটিআই'},
    {
      'code': 'EMRD',
      'name': 'Energy and Mineral Resources',
      'nameBn': 'ইএমআরডি',
    },
    {
      'code': 'BOILER',
      'name': 'Chief Inspector of Boilers',
      'nameBn': 'বয়লার',
    },
    {'code': 'DIFE', 'name': 'DIFE', 'nameBn': 'ডিআইএফই'},
  ];
  static const types = <Json>[
    {
      'id': 'lt_expl',
      'bodyCode': 'DOEXP',
      'name': 'Explosives magazine licence',
      'nameBn': 'বিস্ফোরক ম্যাগাজিন লাইসেন্স',
      'leadTimeDays': 90,
      'validityMonths': 12,
      'checklist': [
        {'en': 'Site plan current', 'bn': 'সাইট প্ল্যান হালনাগাদ'},
        {
          'en': 'Magazine inventory signed',
          'bn': 'ম্যাগাজিন তালিকা স্বাক্ষরিত',
        },
        {'en': 'Fee challan ready', 'bn': 'ফি চালান প্রস্তুত'},
      ],
    },
    {
      'id': 'lt_fire',
      'bodyCode': 'FSCD',
      'name': 'Fire licence',
      'nameBn': 'অগ্নি নির্বাপণ লাইসেন্স',
      'leadTimeDays': 90,
      'validityMonths': 12,
      'checklist': [
        {'en': 'Extinguishers serviced', 'bn': 'অগ্নিনির্বাপক সার্ভিস'},
        {'en': 'Drill log attached', 'bn': 'ড্রিল লগ সংযুক্ত'},
      ],
    },
    {
      'id': 'lt_env',
      'bodyCode': 'DOENV',
      'name': 'Environmental clearance',
      'nameBn': 'পরিবেশ ছাড়পত্র',
      'leadTimeDays': 120,
      'validityMonths': 24,
      'checklist': [
        {'en': 'Stack test within 12 months', 'bn': 'স্ট্যাক পরীক্ষা'},
        {'en': 'Waste log complete', 'bn': 'বর্জ্য লগ সম্পূর্ণ'},
      ],
    },
    {
      'id': 'lt_bsti',
      'bodyCode': 'BSTI',
      'name': 'Product certification',
      'nameBn': 'পণ্য সনদ',
      'leadTimeDays': 90,
      'validityMonths': 12,
      'checklist': [
        {'en': 'Lab report attached', 'bn': 'ল্যাব রিপোর্ট সংযুক্ত'},
      ],
    },
    {
      'id': 'lt_quota',
      'bodyCode': 'EMRD',
      'name': 'Bitumen import quota',
      'nameBn': 'বিটুমিন আমদানি কোটা',
      'leadTimeDays': 90,
      'validityMonths': 12,
      'checklist': [
        {'en': 'Last year utilisation', 'bn': 'গত বছরের ব্যবহার'},
        {'en': 'Board sanction', 'bn': 'বোর্ড অনুমোদন'},
      ],
    },
    {
      'id': 'lt_boiler',
      'bodyCode': 'BOILER',
      'name': 'Boiler registration',
      'nameBn': 'বয়লার নিবন্ধন',
      'leadTimeDays': 90,
      'validityMonths': 12,
      'checklist': [
        {'en': 'Thickness survey', 'bn': 'পুরুত্ব জরিপ'},
        {'en': 'Safety valve certificate', 'bn': 'সেফটি ভালভ সনদ'},
      ],
    },
  ];
}

/// Licence register and renewal pipeline (doc 03 §12).
abstract final class LicenceEngine {
  static String? seedClock;

  static String _stamp(MockStore s) => seedClock ?? s.nowIso();

  static DateTime _now(MockStore s) => DateTime.parse(_stamp(s));

  static String _me(AuthContext a) => a.user.str('id');

  static num _n(Object? v, [num fallback = 0]) => v is num ? v : fallback;

  static bool _can(AuthContext a, String key) =>
      a.grants.any((g) => g['key'] == key);

  static GrantScope _scope(AuthContext a, String key) {
    for (final g in a.grants) {
      if (g['key'] == key) return scopeFromWire(g.str('scope'));
    }
    return GrantScope.self;
  }

  static Json typeOf(String id) => LicencePolicy.types.firstWhere(
    (t) => t['id'] == id,
    orElse: () => throw validationError('typeId', 'Unknown licence kind'),
  );

  static Json? bodyOf(String code) {
    final m = LicencePolicy.bodies.where((b) => b['code'] == code).toList();
    return m.isEmpty ? null : m.first;
  }

  static Json _data(Json lic) => {
    'module': 'compliance',
    'route': '/home/licences/${lic['id']}',
  };

  static void _notify(
    MockStore store,
    String userId,
    Json lic,
    String type,
    Bi title,
    Bi body, {
    String priority = 'NORMAL',
  }) => NotificationEngine.notify(
    store,
    userId: userId,
    type: type,
    title: title,
    body: body,
    priority: priority,
    data: _data(lic),
  );

  static int daysToExpiry(MockStore store, Json lic) {
    final exp = DateTime.parse(lic.str('expiresAt'));
    final now = _now(store);
    return DateTime(
      exp.year,
      exp.month,
      exp.day,
    ).difference(DateTime(now.year, now.month, now.day)).inDays;
  }

  static String urgency(int days) {
    if (days < 0) return 'EXPIRED';
    if (days <= LicencePolicy.criticalDays) return 'CRITICAL';
    if (days <= LicencePolicy.warningDays) return 'WARNING';
    return 'OK';
  }

  static Json? openRenewal(MockStore store, String licenceId) {
    for (final r in store.all(Col.licenceRenewals)) {
      if (r['licenceId'] == licenceId && r['stage'] != 'RENEWED') return r;
    }
    return null;
  }

  static List<Json> renewalsOf(MockStore store, String licenceId) {
    final list =
        store
            .all(Col.licenceRenewals)
            .where((r) => r['licenceId'] == licenceId)
            .toList()
          ..sort((a, b) => _n(b['cycleNo']).compareTo(_n(a['cycleNo'])));
    return list;
  }

  static Json tick(MockStore store, Json lic) {
    final days = daysToExpiry(store, lic);
    if (days < 0 &&
        lic['status'] != 'SUSPENDED' &&
        lic['status'] != 'REVOKED' &&
        openRenewal(store, lic.str('id'))?.str('stage') != 'RENEWED') {
      if (lic['status'] != 'EXPIRED' &&
          lic['status'] != 'RENEWAL_IN_PROGRESS') {
        lic['status'] = 'EXPIRED';
        lic['updatedAt'] = _stamp(store);
        store.put(Col.compliance, lic);
      } else if (lic['status'] == 'ACTIVE') {
        lic['status'] = 'EXPIRED';
        store.put(Col.compliance, lic);
      }
    }
    final typ = typeOf(lic.str('typeId'));
    final lead =
        (typ['leadTimeDays'] as num?)?.toInt() ?? LicencePolicy.defaultLeadDays;
    if (days <= lead &&
        lic['status'] != 'SUSPENDED' &&
        lic['status'] != 'REVOKED' &&
        openRenewal(store, lic.str('id')) == null) {
      final owner = store.get(Col.users, lic.str('ownerUserId'));
      if (owner != null) {
        final auth = AuthContext(
          user: owner,
          employee: store.get(Col.employees, owner.str('employeeId'))!,
          session: const {},
          grants: grantsForRoles(owner.strList('roles')),
        );
        startRenewal(store, auth, lic);
      }
    }
    return store.get(Col.compliance, lic.str('id')) ?? lic;
  }

  static Json create(MockStore store, AuthContext auth, Json body) {
    if (!_can(auth, 'compliance:create')) {
      throw policyViolation('FORBIDDEN', 'You cannot add a licence.');
    }
    final typeId = body['typeId'] as String? ?? '';
    final typ = typeOf(typeId);
    final siteId = body['siteId'] as String? ?? '';
    if (sites.every((s) => s['id'] != siteId)) {
      throw validationError('siteId', 'Unknown site');
    }
    if (_scope(auth, 'compliance:create') == GrantScope.site &&
        siteId != auth.employee.obj('site')['id']) {
      throw policyViolation(
        'FORBIDDEN',
        'You can only add licences at your site.',
      );
    }
    final title = (body['title'] as String? ?? '').trim();
    if (title.length < 3) throw validationError('title', 'Name is too short');
    final no = (body['licenceNo'] as String? ?? '').trim();
    if (no.length < 2) throw validationError('licenceNo', 'Enter the number');
    final exp = body['expiresAt'] as String?;
    if (exp == null) {
      throw validationError('expiresAt', 'Enter the expiry date');
    }
    final now = _stamp(store);
    final id =
        body['id'] as String? ?? 'lic_${store.all(Col.compliance).length + 1}';
    final y = _now(store).year;
    final seq = store.all(Col.compliance).length + 1;
    final lic = <String, Object?>{
      'id': id,
      'ref': 'LIC-$y-${seq.toString().padLeft(4, '0')}',
      'typeId': typeId,
      'bodyCode': typ['bodyCode'],
      'title': title,
      'titleBn': (body['titleBn'] as String?)?.trim(),
      'licenceNo': no,
      'siteId': siteId,
      'ownerUserId': body['ownerUserId'] as String? ?? _me(auth),
      'status': 'ACTIVE',
      'criticality': body['criticality'] as String? ?? 'ESSENTIAL_B',
      'feeAmount': (body['feeAmount'] as num?)?.toDouble() ?? 0,
      'shutdownRiskPerDay':
          (body['shutdownRiskPerDay'] as num?)?.toDouble() ?? 0,
      'issuedAt': body['issuedAt'] ?? now,
      'expiresAt': exp,
      'createdAt': now,
      'updatedAt': now,
    };
    store.put(Col.compliance, lic);
    return tick(store, lic);
  }

  static Json startRenewal(MockStore store, AuthContext auth, Json lic) {
    if (openRenewal(store, lic.str('id')) != null) {
      throw policyViolation('RENEWAL_OPEN', 'A renewal is already open.');
    }
    final typ = typeOf(lic.str('typeId'));
    final rawList = typ['checklist'] as List? ?? const [];
    final items = [
      for (var i = 0; i < rawList.length; i++)
        <String, Object?>{
          'id': 'cli_${lic['id']}_${i + 1}',
          'label': Map<String, Object?>.from(rawList[i]! as Map)['en'],
          'labelBn': Map<String, Object?>.from(rawList[i]! as Map)['bn'],
          'status': 'PENDING',
          'note': null,
        },
    ];
    final cycle = renewalsOf(store, lic.str('id')).length + 1;
    final r = <String, Object?>{
      'id': 'ren_${lic['id']}_$cycle',
      'licenceId': lic['id'],
      'cycleNo': cycle,
      'stage': 'INTERNAL_REVIEW',
      'checklist': items,
      'feeAmount': lic['feeAmount'],
      'fundApproved': _n(lic['feeAmount']) <= 0,
      'fundApprovedBy': null,
      'appliedAt': null,
      'inspectionAt': null,
      'inspectorName': null,
      'auditFindings': null,
      'feePaidAt': null,
      'chalanNo': null,
      'certificateNo': null,
      'newExpiresAt': null,
      'createdAt': _stamp(store),
    };
    store.put(Col.licenceRenewals, r);
    lic['status'] = 'RENEWAL_IN_PROGRESS';
    lic['updatedAt'] = _stamp(store);
    store.put(Col.compliance, lic);
    _notify(
      store,
      lic.str('ownerUserId'),
      lic,
      'LICENCE_RENEWAL_STARTED',
      Bi('Renew ${lic['title']}', '${lic['title']} নবায়ন'),
      const Bi(
        'The renewal file is open. Tick the checklist, then file it.',
        'নবায়ন ফাইল খোলা। চেকলিস্ট টিক করে দাখিল করুন।',
      ),
    );
    return r;
  }

  static void approveFund(MockStore store, AuthContext auth, Json lic) {
    if (!_can(auth, 'compliance:approve-fund')) {
      throw policyViolation('FORBIDDEN', 'Finance must approve the fee.');
    }
    final r = openRenewal(store, lic.str('id'));
    if (r == null) throw invalidTransition('No open renewal.');
    r['fundApproved'] = true;
    r['fundApprovedBy'] = _me(auth);
    r['fundApprovedAt'] = _stamp(store);
    store.put(Col.licenceRenewals, r);
  }

  static void tickItem(
    MockStore store,
    AuthContext auth,
    Json lic,
    String itemId,
    Json body,
  ) {
    final r = openRenewal(store, lic.str('id'));
    if (r == null) throw notFound('Renewal');
    final owner = lic['ownerUserId'] == _me(auth);
    if (!owner && !_can(auth, 'compliance:manage')) {
      throw policyViolation('FORBIDDEN', 'You cannot tick this box.');
    }
    final status = body['status'] as String? ?? 'PASSED';
    if (!const {'PASSED', 'FAILED', 'NA', 'PENDING'}.contains(status)) {
      throw validationError('status', 'Unknown mark');
    }
    if (status == 'FAILED' &&
        ((body['note'] as String?) ?? '').trim().length < 5) {
      throw validationError('note', 'Say why it failed');
    }
    final list = [
      for (final raw in r['checklist']! as List)
        Map<String, Object?>.from(raw as Map),
    ];
    final i = list.indexWhere((x) => x['id'] == itemId);
    if (i < 0) throw notFound('Checklist item');
    list[i]['status'] = status;
    list[i]['note'] = body['note'];
    r['checklist'] = list;
    store.put(Col.licenceRenewals, r);
  }

  static void advance(MockStore store, AuthContext auth, Json lic, Json body) {
    if (!_can(auth, 'compliance:manage')) {
      throw policyViolation('FORBIDDEN', 'You cannot move this file.');
    }
    final r = openRenewal(store, lic.str('id'));
    if (r == null) throw invalidTransition('Start a renewal first.');
    final stage = r.str('stage');
    final next = switch (stage) {
      'INTERNAL_REVIEW' => 'APPLICATION_FILED',
      'APPLICATION_FILED' => 'FIELD_INSPECTION',
      'FIELD_INSPECTION' => 'MINISTRY_VETTING',
      'MINISTRY_VETTING' => 'RENEWED',
      _ => throw invalidTransition('This file is already finished.'),
    };
    switch (next) {
      case 'APPLICATION_FILED':
        _requireChecklistReady(r);
        if (_n(r['feeAmount']) > 0 && r['fundApproved'] != true) {
          throw policyViolation(
            'FUND_NOT_APPROVED',
            'Finance must approve the fee first.',
          );
        }
        r['appliedAt'] = _stamp(store);
      case 'FIELD_INSPECTION':
        final name = (body['inspectorName'] as String? ?? '').trim();
        if (name.length < 3) {
          throw validationError('inspectorName', 'Name the inspector');
        }
        r['inspectorName'] = name;
        r['inspectionAt'] = body['inspectionAt'] ?? _stamp(store);
      case 'MINISTRY_VETTING':
        final findings = (body['auditFindings'] as String? ?? '').trim();
        if (findings.length < 10) {
          throw validationError('auditFindings', 'Write what they found');
        }
        r['auditFindings'] = findings;
      case 'RENEWED':
        _requireChecklistReady(r);
        final cert = (body['certificateNo'] as String? ?? '').trim();
        if (cert.isEmpty) {
          throw validationError('certificateNo', 'Enter the new certificate');
        }
        final rawExp = body['newExpiresAt'] as String?;
        if (rawExp == null) {
          throw validationError('newExpiresAt', 'Enter the new expiry');
        }
        final renewed = _now(store);
        final neu = DateTime.parse(rawExp);
        final months =
            (typeOf(lic.str('typeId'))['validityMonths'] as num?)?.toInt() ??
            12;
        final span = (neu.year - renewed.year) * 12 + neu.month - renewed.month;
        if (span < 1 || span > months + 1) {
          throw policyViolation(
            'VALIDITY_RANGE',
            'The new expiry must be about $months months away.',
          );
        }
        if (_n(r['feeAmount']) > 0) {
          final chalan = (body['chalanNo'] as String? ?? '').trim();
          if (chalan.isEmpty) {
            throw validationError('chalanNo', 'Enter the challan number');
          }
          r['chalanNo'] = chalan;
          r['feePaidAt'] = _stamp(store);
        }
        r['certificateNo'] = cert;
        r['newExpiresAt'] = neu.toIso8601String();
        lic['expiresAt'] = neu.toIso8601String();
        lic['status'] = 'ACTIVE';
        lic['issuedAt'] = _stamp(store);
    }
    r
      ..['stage'] = next
      ..['updatedAt'] = _stamp(store);
    store
      ..put(Col.licenceRenewals, r)
      ..put(Col.compliance, lic);
    _notify(
      store,
      lic.str('ownerUserId'),
      lic,
      'LICENCE_STAGE_CHANGED',
      Bi('${lic['title']} moved on', '${lic['title']} এগোল'),
      Bi(next, next),
    );
  }

  static void back(MockStore store, AuthContext auth, Json lic, Json body) {
    if (!_can(auth, 'compliance:manage')) {
      throw policyViolation('FORBIDDEN', 'You cannot send this back.');
    }
    final r = openRenewal(store, lic.str('id'));
    if (r == null) throw invalidTransition('No open renewal.');
    final reason = (body['reason'] as String? ?? '').trim();
    if (reason.length < 10) {
      throw validationError('reason', 'Say why, in a sentence');
    }
    final i = LicencePolicy.stages.indexOf(r.str('stage'));
    if (i <= 0) throw invalidTransition('Already at the first step.');
    r['stage'] = LicencePolicy.stages[i - 1];
    r['backReason'] = reason;
    store.put(Col.licenceRenewals, r);
  }

  static void letter(MockStore store, AuthContext auth, Json lic, Json body) {
    if (!_can(auth, 'compliance:dispatch-letter')) {
      throw policyViolation('FORBIDDEN', 'You cannot send this letter.');
    }
    final days = daysToExpiry(store, lic);
    final r = openRenewal(store, lic.str('id'));
    final late = days <= LicencePolicy.letterDays;
    final vetting =
        r != null && const {'MINISTRY_VETTING', 'RENEWED'}.contains(r['stage']);
    if (!late && !vetting) {
      throw policyViolation(
        'LETTER_NOT_DUE',
        'A chairman letter is only for licences inside 30 days or already with the ministry.',
      );
    }
    final y = _now(store).year;
    final n = store.all(Col.licenceLetters).length + 1;
    final memo =
        'BOGCL/CMD-DO/${lic['bodyCode']}-$y-${n.toString().padLeft(4, '0')}';
    store.put(Col.licenceLetters, {
      'id': 'ltr_$n',
      'licenceId': lic['id'],
      'memoNo': memo,
      'channel': body['channel'] ?? 'EMAIL',
      'subject': body['subject'] ?? 'Request for early renewal',
      'body': body['body'],
      'createdAt': _stamp(store),
      'createdBy': _me(auth),
    });
    NotificationEngine.notifyRole(
      store,
      role: 'PLANT_GM',
      type: 'LICENCE_DO_LETTER',
      title: Bi('Letter $memo', 'চিঠি $memo'),
      body: Bi(
        '${lic['title']} sent to the regulator.',
        '${lic['title']} নিয়ন্ত্রকের কাছে পাঠানো হয়েছে।',
      ),
      data: _data(lic),
    );
  }

  static void _requireChecklistReady(Json r) {
    final items = [
      for (final raw in r['checklist']! as List)
        Map<String, Object?>.from(raw as Map),
    ];
    if (items.any((i) => i['status'] == 'PENDING')) {
      throw policyViolation(
        'CHECKLIST_INCOMPLETE',
        'Every box must be marked first.',
      );
    }
    if (items.any((i) => i['status'] == 'FAILED')) {
      throw policyViolation(
        'CHECKLIST_FAILED',
        'A failed box is still open. Fix it or mark it not applicable.',
      );
    }
  }

  static bool visible(MockStore store, AuthContext auth, Json lic) {
    tick(store, lic);
    if (lic['ownerUserId'] == _me(auth)) return true;
    if (!_can(auth, 'compliance:read') &&
        !_can(auth, 'compliance:manage') &&
        !_can(auth, 'compliance:dispatch-letter')) {
      return false;
    }
    var sc = GrantScope.self;
    for (final key in [
      'compliance:read',
      'compliance:manage',
      'compliance:dispatch-letter',
    ]) {
      if (_can(auth, key)) {
        final s = _scope(auth, key);
        if (s.index > sc.index) sc = s;
      }
    }
    if (sc == GrantScope.company) return true;
    if (sc == GrantScope.site) {
      return lic['siteId'] == auth.employee.obj('site')['id'];
    }
    return false;
  }

  static Json wire(MockStore store, AuthContext auth, Json raw) {
    final lic = tick(store, raw);
    final days = daysToExpiry(store, lic);
    final band = urgency(days);
    final r = openRenewal(store, lic.str('id'));
    final typ = typeOf(lic.str('typeId'));
    final body = bodyOf(lic.str('bodyCode'));
    final letters = store
        .all(Col.licenceLetters)
        .where((l) => l['licenceId'] == lic['id'])
        .toList();
    final me = _me(auth);
    final owner = lic['ownerUserId'] == me;
    return {
      'id': lic['id'],
      'ref': lic['ref'],
      'title': lic['title'],
      'titleBn': lic['titleBn'] ?? lic['title'],
      'licenceNo': lic['licenceNo'],
      'status': lic['status'],
      'criticality': lic['criticality'],
      'bodyCode': lic['bodyCode'],
      'body': body,
      'type': {
        'id': typ['id'],
        'name': typ['name'],
        'nameBn': typ['nameBn'],
        'validityMonths': typ['validityMonths'],
      },
      'site': _site(lic.str('siteId')),
      'owner': WorkflowEngine.personRef(store, lic.strOrNull('ownerUserId')),
      'expiresAt': lic['expiresAt'],
      'issuedAt': lic['issuedAt'],
      'daysToExpiry': days,
      'urgency': band,
      'feeAmount': lic['feeAmount'],
      'shutdownRiskPerDay': lic['shutdownRiskPerDay'],
      'exposurePerDay': days <= LicencePolicy.criticalDays
          ? lic['shutdownRiskPerDay']
          : 0,
      'renewal': r == null ? null : {...r, 'readinessPct': _ready(r)},
      'letters': letters,
      'createdAt': lic['createdAt'],
      'me': {
        'isOwner': owner,
        'canRenew':
            r == null &&
            _can(auth, 'compliance:manage') &&
            lic['status'] != 'SUSPENDED',
        'canChecklist':
            r != null &&
            r['stage'] != 'RENEWED' &&
            (owner || _can(auth, 'compliance:manage')),
        'canFund':
            r != null &&
            r['fundApproved'] != true &&
            _n(r['feeAmount']) > 0 &&
            _can(auth, 'compliance:approve-fund'),
        'canAdvance':
            r != null &&
            r['stage'] != 'RENEWED' &&
            _can(auth, 'compliance:manage'),
        'canBack':
            r != null &&
            r['stage'] != 'INTERNAL_REVIEW' &&
            r['stage'] != 'RENEWED' &&
            _can(auth, 'compliance:manage'),
        'canLetter':
            _can(auth, 'compliance:dispatch-letter') &&
            (days <= LicencePolicy.letterDays ||
                (r != null &&
                    const {
                      'MINISTRY_VETTING',
                      'RENEWED',
                    }.contains(r['stage']))),
      },
    };
  }

  static double _ready(Json r) {
    final items = [
      for (final raw in r['checklist']! as List)
        Map<String, Object?>.from(raw as Map),
    ].where((i) => i['status'] != 'NA').toList();
    if (items.isEmpty) return 100;
    final passed = items.where((i) => i['status'] == 'PASSED').length;
    return ((passed / items.length) * 1000).round() / 10.0;
  }

  static Json? _site(String? id) {
    if (id == null) return null;
    final s = sites.where((x) => x['id'] == id).toList();
    if (s.isEmpty) return null;
    return {'id': id, 'name': s.first['name'], 'nameBn': s.first['nameBn']};
  }
}
