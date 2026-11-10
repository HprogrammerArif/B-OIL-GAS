import 'package:bogcl_oneops/mock/engines/note_sheet_engine.dart';
import 'package:bogcl_oneops/mock/engines/workflow_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
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
    signature: {
      'method': 'TYPED',
      'typedName': hod.employee.str('fullName'),
      'otp': NoteSheetPolicy.demoOtp,
    },
  );

  final gm = seedAuthFor(store, 'EMP-0012');
  _queueForHod(store, emp);
  _queueForGm(store, emp, hod);
  _queueForChairman(store, emp, hod, gm);
}

void _queueForHod(MockStore store, AuthContext emp) {
  void file(String title, String subject, int amount, String why) {
    final sheet = NoteSheetEngine.create(store, emp, {
      'title': title,
      'subject': subject,
      'amount': amount,
      'justification': why,
      if (amount >= 200000)
        'quotes': [
          _quote('City Office Supply', amount, 5, 6, rec: true),
          _quote('Delta Traders', amount + 40000, 8, 6),
          _quote('Meghna Stationers', amount + 75000, 12, 3),
        ],
    });
    NoteSheetEngine.submit(store, emp, sheet);
  }

  file(
    'Toner and paper for the finance floor',
    'Quarterly stationery for Finance',
    75000,
    'The finance floor runs out of toner before month-end close. '
        'This covers one quarter for the shared printers.',
  );
  file(
    'Winter uniforms for the depot staff',
    'Jackets and shoes, 40 sets',
    240000,
    'Depot staff still use last year’s jackets. Stores asked for '
        'one winter issue before the night shift starts.',
  );
  file(
    'Two network printers for the sales pit',
    'Replacement printers, sales floor',
    410000,
    'Both sales printers jam on every long run. Dispatch is '
        'printing bills on a borrowed machine.',
  );
}

void _queueForGm(MockStore store, AuthContext emp, AuthContext hod) {
  void file(String title, String subject, int amount, String why) {
    final sheet = NoteSheetEngine.create(store, emp, {
      'title': title,
      'subject': subject,
      'amount': amount,
      'urgency': 'HIGH',
      'justification': why,
      'quotes': [
        _quote('Energypac Engineering', amount, 14, 12, rec: true),
        _quote('Walton Industrial', amount + 120000, 21, 12),
        _quote('Rangs Services', amount + 180000, 28, 6),
      ],
    });
    NoteSheetEngine.submit(store, emp, sheet);
    _signUntil(store, sheet, [hod]);
  }

  file(
    'Overhaul the cooling-tower fans',
    'Fan motors and blades, cooling tower 2',
    900000,
    'Two fans are vibrating above the trip limit. The plant '
        'cannot hold summer throughput without the overhaul.',
  );
  file(
    'Replace the weighbridge load cells',
    'Load cells and calibration, truck weighbridge',
    1800000,
    'The weighbridge drifts by more than the customs tolerance. '
        'Every outbound tanker is being reweighed by hand.',
  );
}

void _queueForChairman(
  MockStore store,
  AuthContext emp,
  AuthContext hod,
  AuthContext gm,
) {
  void file(String title, String subject, int amount, String why) {
    final sheet = NoteSheetEngine.create(store, emp, {
      'title': title,
      'subject': subject,
      'amount': amount,
      'urgency': 'HIGH',
      'justification': why,
      'quotes': [
        _quote('Bashundhara Infrastructure', amount, 45, 24, rec: true),
        _quote('Max Group Projects', amount + 350000, 60, 18),
        _quote('Abdul Monem Ltd', amount + 520000, 75, 12),
      ],
    });
    NoteSheetEngine.submit(store, emp, sheet);
    _signUntil(store, sheet, [hod, gm]);
  }

  file(
    'New bitumen storage tank TK-109',
    'Tank, foundation and piping for 5,000 MT',
    3200000,
    'TK-102 cannot be taken offline for repair while the '
        'terminal is full. A spare tank is the only way to keep '
        'imports moving through the shutdown.',
  );
  file(
    'Fire-water ring main for the tank farm',
    'Ring main, hydrants and a jockey pump',
    4100000,
    'The fire licence renewal will fail unless the tank farm '
        'has a closed ring main. The inspector’s letter is on file.',
  );
  file(
    'Laboratory building extension',
    'Two extra test bays and a fume hood',
    2750000,
    'Bitumen samples queue for two days. The offtake contract '
        'requires same-day certificates from December.',
  );
  file(
    'Backup generator for the loading gantry',
    '750 kVA set and an automatic transfer switch',
    3600000,
    'A grid trip last month stopped four tankers on the gantry. '
        'The product set in the arms and took a day to clear.',
  );
}

/// What each earlier desk writes when the file is seeded already signed.
String? _deskRemark(String key) => switch (key) {
  'HOD' => 'I recommend this request against the department plan.',
  'FINANCE' => 'This is inside the capital budget.',
  'GM' => 'The plant can take the work. No safety objection.',
  _ => null,
};

/// Signs every step these people can sign, and stops before the Chairman.
void _signUntil(MockStore store, Json sheet, List<AuthContext> signers) {
  for (final who in signers) {
    for (var i = 0; i < 6 && sheet['status'] == 'IN_REVIEW'; i++) {
      final inst = store.get(
        Col.workflowInstances,
        sheet.str('workflowInstanceId'),
      );
      if (inst == null) return;
      final step = WorkflowEngine.actionableStep(
        store,
        inst,
        who.user.str('id'),
      );
      if (step == null) break;
      if (step['key'] == 'CHAIRMAN') return;
      NoteSheetEngine.sign(store, who, sheet, {
        'method': 'TYPED',
        'typedName': who.employee.str('fullName'),
        'comment': _deskRemark(step.str('key')),
      }, skipOtp: true);
    }
  }
}
