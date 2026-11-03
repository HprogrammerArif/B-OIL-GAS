import 'package:bogcl_oneops/core/utils/hash.dart';
import 'package:bogcl_oneops/mock/engines/audit_engine.dart';
import 'package:bogcl_oneops/mock/engines/file_engine.dart';
import 'package:bogcl_oneops/mock/engines/workflow_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

const noteSheetObject = 'NoteSheet';

/// Settings behind doc 06 MOD-03 (BR-03-06, BR-03-07).
abstract final class NoteSheetPolicy {
  static const quotesRequiredAbove = 200000;
  static const minQuotes = 3;
  static const criticalAmount = 500000;
  static const maxQuotes = 6;
  static const urgencies = {'NORMAL', 'HIGH', 'CRITICAL'};
  static const confidentiality = {'INTERNAL', 'CONFIDENTIAL', 'SECRET'};
  static const signMethods = {'DRAWN', 'TYPED', 'STAMP'};

  /// The pitch app has no SMS gateway; this code stands in for the OTP.
  static const demoOtp = '123456';
}

/// Note-sheets: a file noting with a hash-chained paragraph trail, vendor
/// quotes and one signature per approver (doc 06 MOD-03).
abstract final class NoteSheetEngine {
  static void registerHooks() =>
      WorkflowHooks.register(noteSheetObject, _onEvent);

  // ---- Numbers and hashes ----

  static String nextFileNo(MockStore store, String deptCode, int year) {
    var max = 0;
    final prefix = 'BOGCL/$deptCode/$year/';
    for (final s in store.all(Col.noteSheets)) {
      final no = s.strOrNull('fileNo');
      if (no != null && no.startsWith(prefix)) {
        final n = int.tryParse(no.substring(prefix.length)) ?? 0;
        if (n > max) max = n;
      }
    }
    return '$prefix${(max + 1).toString().padLeft(4, '0')}';
  }

  /// BR-03-01: SHA-256(prevHash | seqNo | authorId | kind | body | createdAt).
  static String paragraphHash({
    required String prevHash,
    required int seqNo,
    required String authorId,
    required String kind,
    required String body,
    required String createdAt,
  }) => Hash.sha256Hex('$prevHash|$seqNo|$authorId|$kind|$body|$createdAt');

  static Json _paragraph(
    MockStore store,
    Json sheet, {
    required String kind,
    required String body,
    required String authorUserId,
  }) {
    final list = sheet.objList('paragraphs');
    final seq = list.length + 1;
    final prev = list.isEmpty ? '' : list.last.str('contentHash');
    final at = store.nowIso();
    return {
      'seqNo': seq,
      'kind': kind,
      'body': body,
      'authorUserId': authorUserId,
      'createdAt': at,
      'contentHash': paragraphHash(
        prevHash: prev,
        seqNo: seq,
        authorId: authorUserId,
        kind: kind,
        body: body,
        createdAt: at,
      ),
    };
  }

  /// Canonical content signed by approvers (BR-03-03).
  static String documentHash(Json sheet) => Hash.sha256Hex(
    Hash.canonicalJson({
      'fileNo': sheet['fileNo'],
      'title': sheet['title'],
      'subject': sheet['subject'],
      'amount': sheet['amount'],
      'paragraphs': [
        for (final p in sheet.objList('paragraphs')) p['contentHash'],
      ],
      'quotes': [
        for (final q in sheet.objList('quotes'))
          {'v': q['vendorName'], 'a': q['amount']},
      ],
    }),
  );

  // ---- Create and edit ----

  static Json create(MockStore store, AuthContext auth, Json body) {
    final now = store.nowIso();
    final sheet = <String, Object?>{
      'id':
          'ns_${store.collection(Col.noteSheets).length + 1}_${store.nowMs()}',
      'fileNo': null,
      'status': 'DRAFT',
      'initiatorEmployeeId': auth.employeeId,
      'initiatorUserId': auth.user.str('id'),
      'paragraphs': <Json>[],
      'quotes': <Json>[],
      'signatures': <Json>[],
      'workflowInstanceId': null,
      'verificationCode': null,
      'finalHash': null,
      'submittedAt': null,
      'approvedAt': null,
      'createdAt': now,
      'updatedAt': now,
    };
    apply(store, sheet, body);
    return sheet;
  }

  /// Validates [body] and writes it onto a DRAFT or RETURNED sheet.
  static void apply(MockStore store, Json sheet, Json body) {
    final status = sheet.str('status');
    if (status != 'DRAFT' && status != 'RETURNED') {
      throw invalidTransition('This note-sheet can no longer be edited');
    }
    final title = body['title'];
    if (title is! String || title.trim().length < 5 || title.length > 200) {
      throw validationError('title', 'Enter a title (5–200 characters)');
    }
    final subject = body['subject'];
    if (subject is! String ||
        subject.trim().length < 3 ||
        subject.length > 200) {
      throw validationError('subject', 'Enter the subject');
    }
    final amount = body['amount'];
    if (amount != null && (amount is! num || amount < 0 || amount > 1e11)) {
      throw validationError('amount', 'Enter a valid amount');
    }
    final urgency = body['urgency'] ?? 'NORMAL';
    if (!NoteSheetPolicy.urgencies.contains(urgency)) {
      throw validationError('urgency', 'Unknown urgency');
    }
    final conf = body['confidentiality'] ?? 'INTERNAL';
    if (!NoteSheetPolicy.confidentiality.contains(conf)) {
      throw validationError('confidentiality', 'Unknown level');
    }
    if (status == 'DRAFT') {
      final j = body['justification'];
      if (j is! String || j.trim().length < 10 || j.length > 10000) {
        throw validationError(
          'justification',
          'Explain the request (10–10,000 characters)',
        );
      }
      sheet['justification'] = j.trim();
    }
    final note = body['recommendationNote'];
    if (note != null && (note is! String || note.length > 1000)) {
      throw validationError('recommendationNote', 'Too long');
    }
    final rawQuotes = body['quotes'] ?? const <Object?>[];
    if (rawQuotes is! List || rawQuotes.length > NoteSheetPolicy.maxQuotes) {
      throw validationError('quotes', 'At most 6 quotations');
    }
    final quotes = <Json>[];
    for (final (i, raw) in rawQuotes.indexed) {
      if (raw is! Map) throw validationError('quotes[$i]', 'Invalid quotation');
      final q = Map<String, Object?>.from(raw);
      final vendor = q['vendorName'];
      final qa = q['amount'];
      final days = q['deliveryDays'] ?? 0;
      final warranty = q['warrantyMonths'] ?? 0;
      if (vendor is! String ||
          vendor.trim().length < 2 ||
          vendor.length > 120) {
        throw validationError('quotes[$i].vendorName', 'Enter the supplier');
      }
      if (qa is! num || qa <= 0 || qa > 1e11) {
        throw validationError('quotes[$i].amount', 'Enter the quoted price');
      }
      if (days is! int || days < 0 || warranty is! int || warranty < 0) {
        throw validationError('quotes[$i].deliveryDays', 'Invalid number');
      }
      quotes.add({
        'id': 'q${i + 1}',
        'vendorName': vendor.trim(),
        'amount': qa,
        'deliveryDays': days,
        'warrantyMonths': warranty,
        'isRecommended': q['isRecommended'] == true,
      });
    }
    sheet
      ..['title'] = title.trim()
      ..['subject'] = subject.trim()
      ..['amount'] = amount
      ..['urgency'] = urgency
      ..['confidentiality'] = conf
      ..['recommendationNote'] = (note as String?)?.trim()
      ..['quotes'] = quotes
      ..['updatedAt'] = store.nowIso();
    store.put(Col.noteSheets, sheet);
  }

  // ---- Submit ----

  static void submit(MockStore store, AuthContext auth, Json sheet) {
    final status = sheet.str('status');
    if (status != 'DRAFT' && status != 'RETURNED') {
      throw invalidTransition('This note-sheet cannot be submitted');
    }
    final amount = (sheet['amount'] as num?) ?? 0;
    final quotes = sheet.objList('quotes');
    if (amount >= NoteSheetPolicy.quotesRequiredAbove) {
      if (quotes.length < NoteSheetPolicy.minQuotes) {
        throw policyViolation(
          'QUOTES_REQUIRED',
          'At least ${NoteSheetPolicy.minQuotes} quotations are required',
        );
      }
      final rec = quotes.where((q) => q['isRecommended'] == true).toList();
      if (rec.length != 1) {
        throw policyViolation(
          'RECOMMENDATION_REQUIRED',
          'Mark exactly one quotation as recommended',
        );
      }
      final lowest = quotes
          .map((q) => q['amount']! as num)
          .reduce((a, b) => a < b ? a : b);
      final note = sheet.strOrNull('recommendationNote') ?? '';
      if ((rec.first['amount']! as num) > lowest && note.trim().length < 30) {
        throw policyViolation(
          'RECOMMENDATION_NOTE_REQUIRED',
          'Explain why the recommended quotation is not the lowest',
        );
      }
    }
    final emp = auth.employee;
    if (status == 'DRAFT') {
      final year = DateTime.now().year;
      sheet['fileNo'] = nextFileNo(
        store,
        emp.obj('department').strOrNull('code') ?? 'GEN',
        year,
      );
      final list = <Json>[];
      sheet['paragraphs'] = list;
      list.add(
        _paragraph(
          store,
          sheet,
          kind: 'NOTE',
          body: sheet.str('justification'),
          authorUserId: auth.user.str('id'),
        ),
      );
      final note = sheet.strOrNull('recommendationNote');
      if (note != null && note.trim().isNotEmpty) {
        list.add(
          _paragraph(
            store,
            sheet,
            kind: 'NOTE',
            body: note,
            authorUserId: auth.user.str('id'),
          ),
        );
      }
    }
    if (sheet['urgency'] == 'NORMAL' &&
        amount >= NoteSheetPolicy.criticalAmount) {
      sheet['urgency'] = 'HIGH';
    }
    final inst = WorkflowEngine.submit(
      store,
      templateKey: 'NOTE_SHEET',
      objectType: noteSheetObject,
      objectId: sheet.str('id'),
      initiatorUserId: auth.user.str('id'),
      summary: {
        'refNo': sheet['fileNo'],
        'title': sheet['title'],
        'titleBn': sheet['title'],
        'details': sheet['subject'],
        'detailsBn': sheet['subject'],
        'amount': sheet['amount'],
        'currency': 'BDT',
        'urgency': sheet['urgency'],
        'category': 'PROCUREMENT',
      },
    );
    sheet
      ..['workflowInstanceId'] = inst['id']
      ..['status'] = 'IN_REVIEW'
      ..['submittedAt'] = store.nowIso()
      ..['updatedAt'] = store.nowIso();
    store.put(Col.noteSheets, sheet);
    AuditEngine.log(
      store,
      action: 'NOTE_SHEET_SUBMITTED',
      entityType: 'NoteSheet',
      actorUserId: auth.user.str('id'),
      entityId: sheet.str('id'),
      after: {'fileNo': sheet['fileNo']},
    );
  }

  // ---- Paragraphs ----

  static Json appendParagraph(
    MockStore store,
    AuthContext auth,
    Json sheet,
    Json body,
  ) {
    final status = sheet.str('status');
    if (status != 'IN_REVIEW' && status != 'RETURNED') {
      throw invalidTransition('Notes can be added while the file is open');
    }
    final me = auth.user.str('id');
    final inst = store.get(
      Col.workflowInstances,
      sheet.str('workflowInstanceId'),
    );
    final allowed =
        sheet['initiatorUserId'] == me ||
        (inst != null && WorkflowEngine.isParticipant(store, inst, me));
    if (!allowed) throw forbidden();
    final text = body['body'];
    if (text is! String || text.trim().isEmpty || text.length > 10000) {
      throw validationError('body', 'Write the note (up to 10,000 characters)');
    }
    final kind = body['kind'] ?? 'NOTE';
    if (kind != 'NOTE' && kind != 'QUERY') {
      throw validationError('kind', 'Unknown kind');
    }
    final p = _paragraph(
      store,
      sheet,
      kind: kind as String,
      body: text.trim(),
      authorUserId: me,
    );
    sheet
      ..['paragraphs'] = [...sheet.objList('paragraphs'), p]
      ..['updatedAt'] = store.nowIso();
    store.put(Col.noteSheets, sheet);
    return p;
  }

  // ---- Sign ----

  /// BR-03-03: one signature per step. Validates the OTP unless [skipOtp]
  /// (seed data), records the evidence, then drives the workflow step.
  static void sign(
    MockStore store,
    AuthContext auth,
    Json sheet,
    Json body, {
    bool skipOtp = false,
  }) {
    final me = auth.user.str('id');
    final inst = store.get(
      Col.workflowInstances,
      sheet.str('workflowInstanceId'),
    );
    if (sheet['status'] != 'IN_REVIEW' || inst == null) {
      throw invalidTransition('This note-sheet is not waiting for signatures');
    }
    final step = WorkflowEngine.actionableStep(store, inst, me);
    if (step == null) throw forbidden();
    final method = body['method'];
    if (method is! String || !NoteSheetPolicy.signMethods.contains(method)) {
      throw validationError('method', 'Choose how to sign');
    }
    final image = body['imageFileId'];
    if (method == 'DRAWN' &&
        (image is! String || store.get(Col.files, image) == null)) {
      throw validationError('imageFileId', 'Draw your signature');
    }
    if (!skipOtp) {
      final otp = body['otp'];
      if (otp is! String ||
          !Hash.constantTimeEquals(otp, NoteSheetPolicy.demoOtp)) {
        throw validationError('otp', 'The code is not correct');
      }
    }
    final comment = (body['comment'] as String?)?.trim();
    final paragraphsBefore = [...sheet.objList('paragraphs')];
    if (comment != null && comment.isNotEmpty) {
      // The signed content includes the signer's own remark.
      sheet['paragraphs'] = [
        ...sheet.objList('paragraphs'),
        _paragraph(store, sheet, kind: 'NOTE', body: comment, authorUserId: me),
      ];
    }
    final signedAt = store.nowIso();
    final docHash = documentHash(sheet);
    final emp = auth.employee;
    final signature = <String, Object?>{
      'stepKey': step['key'],
      'stepName': step['name'],
      'signerUserId': me,
      'signerName': emp['fullName'],
      'signerNameBn': emp['fullNameBn'],
      'roleTitle': emp.obj('designation')['title'],
      'method': method,
      'typedName': body['typedName'],
      'imageFileId': body['imageFileId'],
      'documentHash': docHash,
      'stampCode':
          'BG-${Hash.sha256Hex('$docHash|$me|$signedAt').substring(0, 8).toUpperCase()}',
      'signedAt': signedAt,
    };
    if (image is String) {
      FileEngine.attach(
        store,
        image,
        ownerType: 'NoteSheet',
        ownerId: sheet.str('id'),
      );
    }
    final before = [...sheet.objList('signatures')];
    sheet['signatures'] = [...before, signature];
    store.put(Col.noteSheets, sheet);
    try {
      WorkflowEngine.act(
        store,
        instanceId: inst.str('id'),
        actorUserId: me,
        type: 'APPROVE',
        comment: comment,
        signature: {
          'method': method,
          'imageFileId': body['imageFileId'],
          'typedName': body['typedName'],
          'stampCode': signature['stampCode'],
        },
      );
    } catch (_) {
      sheet
        ..['signatures'] = before
        ..['paragraphs'] = paragraphsBefore;
      store.put(Col.noteSheets, sheet);
      rethrow;
    }
    AuditEngine.log(
      store,
      action: 'NOTE_SHEET_SIGNED',
      entityType: 'NoteSheet',
      actorUserId: me,
      entityId: sheet.str('id'),
      after: {'stampCode': signature['stampCode']},
    );
  }

  // ---- Workflow events ----

  static void _onEvent(MockStore store, Json instance, WorkflowEvent event) {
    final s = store.get(Col.noteSheets, instance.str('objectId'));
    if (s == null) return;
    switch (event) {
      case WorkflowEvent.submitted || WorkflowEvent.stepApproved:
        s['status'] = 'IN_REVIEW';
      case WorkflowEvent.approved:
        final sigs = s.objList('signatures');
        s
          ..['status'] = 'APPROVED'
          ..['approvedAt'] = store.nowIso()
          ..['finalHash'] = Hash.sha256Hex(
            Hash.canonicalJson({
              'doc': documentHash(s),
              'stamps': [for (final g in sigs) g['stampCode']],
            }),
          );
        s['verificationCode'] =
            'NS-${s.str('finalHash').substring(0, 10).toUpperCase()}';
      case WorkflowEvent.rejected:
        s['status'] = 'REJECTED';
      case WorkflowEvent.returned:
        s['status'] = 'RETURNED';
        final last = WorkflowEngine.actionsOf(
          store,
          instance.str('id'),
        ).where((a) => a['type'] == 'RETURN').lastOrNull;
        if (last != null) {
          s['paragraphs'] = [
            ...s.objList('paragraphs'),
            _paragraph(
              store,
              s,
              kind: 'RETURN',
              body: last.strOrNull('comment') ?? '',
              authorUserId: last.str('actorId'),
            ),
          ];
        }
        s['signatures'] = <Json>[];
      case WorkflowEvent.withdrawn:
        s['status'] = 'WITHDRAWN';
    }
    s['updatedAt'] = store.nowIso();
    store.put(Col.noteSheets, s);
  }

  // ---- Wire ----

  static Json _person(MockStore store, String userId) =>
      WorkflowEngine.personRef(store, userId) ??
      {'userId': userId, 'name': '', 'nameBn': '', 'title': null};

  static Json wire(
    MockStore store,
    Json s, {
    required String viewerUserId,
    bool detail = false,
  }) {
    final inst = s.strOrNull('workflowInstanceId') == null
        ? null
        : store.get(Col.workflowInstances, s.str('workflowInstanceId'));
    final emp = store.get(Col.employees, s.str('initiatorEmployeeId'));
    final dept = emp?.obj('department');
    final active = inst == null
        ? const <Json>[]
        : WorkflowEngine.stepsOf(
            store,
            inst,
          ).where((x) => x['status'] == 'ACTIVE').toList();
    final mine = inst == null || s['status'] != 'IN_REVIEW'
        ? null
        : WorkflowEngine.actionableStep(store, inst, viewerUserId);
    final isInitiator = s['initiatorUserId'] == viewerUserId;
    final status = s.str('status');
    final quotes = s.objList('quotes');
    final out = <String, Object?>{
      'id': s['id'],
      'fileNo': s['fileNo'],
      'title': s['title'],
      'subject': s['subject'],
      'status': status,
      'amount': s['amount'],
      'urgency': s['urgency'],
      'confidentiality': s['confidentiality'],
      'department': {
        'id': dept?['id'],
        'name': dept?['name'],
        'nameBn': dept?['nameBn'],
      },
      'initiator': _person(store, s.str('initiatorUserId')),
      'quoteCount': quotes.length,
      'signedCount': s.objList('signatures').length,
      'waitingFor': [
        for (final st in active)
          for (final u in st.strList('approverUserIds')) _person(store, u),
      ],
      'currentStepName': active.isEmpty ? null : active.first['name'],
      'submittedAt': s['submittedAt'],
      'approvedAt': s['approvedAt'],
      'updatedAt': s['updatedAt'],
      'createdAt': s['createdAt'],
      'workflowInstanceId': s['workflowInstanceId'],
      'me': {
        'isInitiator': isInitiator,
        'canEdit': isInitiator && (status == 'DRAFT' || status == 'RETURNED'),
        'canSubmit': isInitiator && (status == 'DRAFT' || status == 'RETURNED'),
        'canSign': mine != null,
        'canWithdraw':
            isInitiator && (status == 'IN_REVIEW' || status == 'RETURNED'),
        'canAppend':
            (isInitiator || mine != null) &&
            (status == 'IN_REVIEW' || status == 'RETURNED'),
      },
    };
    if (detail) {
      out
        ..['justification'] = s['justification']
        ..['recommendationNote'] = s['recommendationNote']
        ..['quotes'] = quotes
        ..['paragraphs'] = [
          for (final p in s.objList('paragraphs'))
            {...p, 'author': _person(store, p.str('authorUserId'))},
        ]
        ..['signatures'] = s.objList('signatures')
        ..['verificationCode'] = s['verificationCode']
        ..['finalHash'] = s['finalHash'];
    }
    return out;
  }
}
