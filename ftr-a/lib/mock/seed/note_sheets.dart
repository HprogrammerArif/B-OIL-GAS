import 'package:bogcl_oneops/mock/engines/note_sheet_engine.dart';
import 'package:bogcl_oneops/mock/engines/workflow_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/seed/seed_auth.dart';
import 'package:bogcl_oneops/mock/store.dart';

Json _quote(
  String vendor,
  num amount,
  int days,
  int warranty, {
  bool rec = false,
}) => {
  'vendorName': vendor,
  'amount': amount,
  'deliveryDays': days,
  'warrantyMonths': warranty,
  'isRecommended': rec,
};

/// Four sheets through the real engine: a draft, one waiting for the head of
/// department, one signed by everyone, and one sent back for changes.
void seedNoteSheets(MockStore store) {
  NoteSheetEngine.registerHooks();
  final emp = seedAuthFor(store, 'EMP-1042');
  final hod = seedAuthFor(store, 'EMP-0062');

  NoteSheetEngine.create(store, emp, {
    'title': 'Replace two shop-floor laptops',
    'subject': 'Laptop replacement for the dispatch desk',
    'amount': 180000,
    'urgency': 'NORMAL',
    'justification':
        'Both dispatch laptops are over six years old and fail during '
        'peak hours. We ask approval to replace them.',
  });

  final waiting = NoteSheetEngine.create(store, emp, {
    'title': 'Annual maintenance contract for the cooling plant',
    'subject': 'AMC for the cooling plant, one year',
    'amount': 640000,
    'justification':
        'The current maintenance contract ends next month. Three '
        'suppliers quoted for a one year contract with 24 hour response.',
    'quotes': [
      _quote('Energypac Engineering', 640000, 7, 12, rec: true),
      _quote('Walton Industrial', 720000, 10, 12),
      _quote('Rangs Services', 810000, 14, 6),
    ],
  });
  NoteSheetEngine.submit(store, emp, waiting);

  final signed = NoteSheetEngine.create(store, emp, {
    'title': 'Safety signage for the loading bay',
    'subject': 'Printed PPE and hazard signs, 40 pieces',
    'amount': 150000,
    'urgency': 'HIGH',
    'justification':
        'New PPE rules start this month and the loading bay has no '
        'visible signs. The signs are needed before the first audit.',
  });
  NoteSheetEngine.submit(store, emp, signed);
  for (var i = 0; i < 4 && signed['status'] == 'IN_REVIEW'; i++) {
    NoteSheetEngine.sign(store, hod, signed, {
      'method': 'TYPED',
      'typedName': hod.employee.str('fullName'),
      'comment': i == 0 ? 'Needed for the audit. Recommended.' : null,
    }, skipOtp: true);
  }

  final returned = NoteSheetEngine.create(store, emp, {
    'title': 'Spare pump seals for the transfer line',
    'subject': 'Spare mechanical seals, 6 sets',
    'amount': 95000,
    'justification':
        'Two seals failed last quarter and the replacement took nine '
        'days. Keeping spares avoids a stoppage.',
  });
  NoteSheetEngine.submit(store, emp, returned);
  WorkflowEngine.act(
    store,
    instanceId: returned.str('workflowInstanceId'),
    actorUserId: hod.user.str('id'),
    type: 'RETURN',
    comment: 'Please add the failure dates and the part numbers.',
  );
}
