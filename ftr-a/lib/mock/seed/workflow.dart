import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/store.dart';

Json _step(
  String key,
  String name,
  String rule, {
  String? ref,
  String? condition,
  int sla = 24,
  bool signature = false,
  bool isFinal = false,
  String? escalateTo,
}) => {
  'key': key,
  'name': name,
  'approverRule': rule,
  'approverRef': ref,
  'condition': condition,
  'slaHours': sla,
  'requiresSignature': signature,
  'isFinal': isFinal,
  'escalateTo': escalateTo,
};

/// Seeds the templates modules need first (doc 06 Appendix B). Modules that
/// ship later add theirs next to their own seed. Amounts are BDT.
void seedWorkflowTemplates(MockStore store) {
  void add(String key, String objectType, String name, List<Json> steps) {
    store.put(Col.workflowTemplates, {
      'id': 'wft_${key.toLowerCase()}_1',
      'key': key,
      'objectType': objectType,
      'version': 1,
      'name': name,
      'definition': {'steps': steps},
      'isActive': true,
    });
  }

  add('LEAVE_REQUEST', 'LeaveRequest', 'Leave request', [
    _step('MANAGER', 'Line manager', 'LINE_MANAGER'),
    _step(
      'HR_REVIEW',
      'HR review',
      'ROLE',
      ref: 'HR_ADMIN',
      condition: "hrReview == 'true'",
    ),
  ]);
  add(
    'ATTENDANCE_REGULARISATION',
    'Regularisation',
    'Attendance regularisation',
    [
      _step('MANAGER', 'Line manager', 'LINE_MANAGER'),
      _step(
        'HR_REVIEW',
        'HR review',
        'ROLE',
        ref: 'HR_ADMIN',
        condition: 'daysBack > 3',
      ),
    ],
  );
  add('CLAIM', 'Claim', 'Expense claim', [
    _step('MANAGER', 'Line manager', 'LINE_MANAGER'),
    _step(
      'HOD',
      'Head of department',
      'DEPARTMENT_HEAD',
      condition: 'amount > 50000',
    ),
    _step('FINANCE', 'Finance', 'ROLE', ref: 'FINANCE'),
    _step(
      'GM',
      'Plant GM',
      'ROLE',
      ref: 'PLANT_GM',
      condition: 'amount > 500000',
      isFinal: true,
    ),
  ]);
  add('NOTE_SHEET', 'NoteSheet', 'Note sheet', [
    _step('HOD', 'Head of department', 'DEPARTMENT_HEAD'),
    _step(
      'FINANCE',
      'Finance',
      'ROLE',
      ref: 'FINANCE',
      condition: 'amount > 0',
    ),
    _step(
      'GM',
      'Plant GM',
      'ROLE',
      ref: 'PLANT_GM',
      condition: 'amount > 500000',
    ),
    _step(
      'CHAIRMAN',
      'Chairman',
      'ROLE',
      ref: 'CHAIRMAN',
      condition: 'amount > 2500000',
      sla: 18,
      signature: true,
      isFinal: true,
    ),
  ]);
  add('VEHICLE_REQUISITION', 'VehicleRequisition', 'Vehicle requisition', [
    _step('HOD_ENDORSE', 'HOD endorsement', 'DEPARTMENT_HEAD', sla: 12),
  ]);
}
