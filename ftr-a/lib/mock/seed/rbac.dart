import 'package:bogcl_oneops/mock/http.dart';

/// Grant scope, narrowest to widest (doc 03 §1.7).
enum GrantScope { self, team, department, site, company }

GrantScope scopeFromWire(String wire) => GrantScope.values.firstWhere(
  (s) => s.name.toUpperCase() == wire,
  orElse: () => GrantScope.self,
);

typedef _Spec = (String key, GrantScope scope, String? maxAmount);

_Spec _g(String key, GrantScope scope, [String? maxAmount]) =>
    (key, scope, maxAmount);

const GrantScope _self = GrantScope.self;
const GrantScope _team = GrantScope.team;
const GrantScope _dept = GrantScope.department;
const GrantScope _site = GrantScope.site;
const GrantScope _co = GrantScope.company;

/// Grants every signed-in employee holds (doc 03 Appendix A).
final List<_Spec> _base = [
  _g('dashboards:read', _self),
  _g('notices:read', _co),
  _g('briefings:read', _self),
  _g('note-sheets:read', _self),
  _g('note-sheets:create', _self),
  _g('note-sheets:submit', _self),
  _g('parcels:read', _self),
  _g('parcels:create', _self),
  _g('assets:read', _self),
  _g('assets:flag-defect', _self),
  _g('incidents:read', _self),
  _g('incidents:report', _self),
  _g('attendance:punch', _self),
  _g('attendance:read', _self),
  _g('leave:request', _self),
  _g('leave:read', _self),
  _g('claims:read', _self),
  _g('claims:create', _self),
  _g('claims:submit', _self),
  _g('claims:advance', _self),
  _g('files:upload', _self),
  _g('files:read', _self),
  _g('search:use', _self),
  _g('due-items:read', _self),
];

final Map<String, List<_Spec>> _roleGrants = {
  'SUPER_ADMIN': [_g('admin:audit-read', _co), _g('workflow:templates', _co)],
  'EMPLOYEE': [
    _g('fleet:read', _self),
    _g('fleet:request', _self),
    _g('bus:read', _self),
    _g('bus:seat-self', _self),
    _g('visitors:read', _self),
    _g('visitors:create', _self),
  ],
  'DRIVER': [
    _g('fleet:read', _self),
    _g('fleet:drive', _self),
    _g('fleet:chat', _self),
    _g('parcels:scan', _self),
    _g('parcels:deliver', _self),
  ],
  'LINE_MANAGER': [
    _g('workflow:inbox', _self),
    _g('workflow:act', _team),
    _g('leave:read', _team),
    _g('leave:approve', _team),
    _g('attendance:read', _team),
    _g('attendance:approve-regularisation', _team),
  ],
  'HOD': [
    _g('dashboards:read', _dept),
    _g('workflow:inbox', _self),
    _g('workflow:act', _dept),
    _g('note-sheets:read', _dept),
    _g('note-sheets:sign', _dept),
    _g('claims:read', _dept),
    _g('claims:approve', _dept, '500000.00'),
    _g('leave:read', _dept),
    _g('leave:approve', _dept),
    _g('attendance:read', _dept),
    _g('attendance:approve-regularisation', _dept),
    _g('fleet:read', _self),
    _g('fleet:request', _self),
    _g('fleet:endorse', _dept),
    _g('assets:read', _dept),
    _g('assets:approve-requisition', _dept),
    _g('visitors:read', _self),
    _g('visitors:create', _self),
    _g('incidents:read', _dept),
    _g('compliance:read', _co),
    _g('employees:read', _dept),
    _g('notices:create', _dept),
    _g('notices:publish', _dept),
    _g('chat:use', _self),
  ],
  'FINANCE': [
    _g('claims:read', _co),
    _g('claims:finance', _co),
    _g('claims:settle', _co),
    _g('claims:policy-manage', _co),
    _g('note-sheets:read', _co),
    _g('note-sheets:sign', _co),
    _g('fleet:tolls-pay', _co),
    _g('assets:write-off', _co),
    _g('assets:depreciation-policy', _co),
  ],
  'HR_ADMIN': [
    _g('dashboards:hr', _co),
    _g('workflow:inbox', _self),
    _g('workflow:act', _co),
    _g('employees:read', _co),
    _g('employees:read-full', _co),
    _g('employees:pii', _co),
    _g('employees:create', _co),
    _g('employees:update', _co),
    _g('employees:offboard', _co),
    _g('employees:clearance', _co),
    _g('notices:create', _co),
    _g('notices:update', _co),
    _g('notices:publish', _co),
    _g('notices:manage', _co),
    _g('leave:read', _co),
    _g('leave:approve', _co),
    _g('leave:manage', _co),
    _g('leave:manage-balances', _co),
    _g('attendance:read', _co),
    _g('attendance:export', _co),
    _g('attendance:approve-regularisation', _co),
    _g('attendance:manage-shifts', _co),
    _g('note-sheets:read', _co),
    _g('claims:read', _co),
    _g('fleet:read', _co),
    _g('fleet:request', _self),
    _g('bus:read', _co),
    _g('bus:seat-self', _self),
    _g('bus:manage', _co),
    _g('bus:allocate', _co),
    _g('bus:broadcast', _co),
    _g('bus:manifest', _co),
    _g('visitors:read', _co),
    _g('visitors:create', _self),
    _g('visitors:gate', _site),
    _g('incidents:read', _co),
    _g('compliance:read', _co),
    _g('assets:read', _co),
    _g('assets:update', _co),
    _g('assets:custody-assign', _co),
    _g('parcels:read', _co),
    _g('parcels:dispatch', _co),
    _g('chat:use', _self),
    _g('admin:users-read', _co),
  ],
  'TRANSPORT_ADMIN': [
    _g('dashboards:transport', _site),
    _g('fleet:read', _co),
    _g('fleet:request', _self),
    _g('fleet:endorse', _co),
    _g('fleet:dispatch', _co),
    _g('fleet:gate', _co),
    _g('fleet:fuel', _co),
    _g('fleet:tolls-approve', _co),
    _g('fleet:manage-vehicles', _co),
    _g('fleet:manage-drivers', _co),
    _g('fleet:chat', _co),
    _g('bus:read', _co),
    _g('bus:seat-self', _self),
    _g('bus:manage', _co),
    _g('bus:allocate', _co),
    _g('bus:broadcast', _co),
    _g('bus:manifest', _co),
    _g('bus:scan', _co),
    _g('note-sheets:read', _site),
    _g('claims:read', _co),
    _g('attendance:read', _team),
    _g('assets:read', _co),
    _g('incidents:read', _site),
  ],
  'SECURITY_GATE': [
    _g('visitors:read', _site),
    _g('visitors:gate', _site),
    _g('visitors:inspect', _site),
    _g('visitors:watchlist', _site),
    _g('parcels:read', _site),
    _g('parcels:scan', _site),
    _g('fleet:gate', _site),
    _g('incidents:triage', _site),
  ],
  'MAILROOM': [
    _g('parcels:read', _co),
    _g('parcels:dispatch', _co),
    _g('parcels:scan', _co),
    _g('parcels:deliver', _co),
    _g('parcels:return', _co),
    _g('parcels:manage', _co),
  ],
  'HSE_OFFICER': [
    _g('visitors:read', _site),
    _g('visitors:gate', _site),
    _g('incidents:read', _site),
    _g('incidents:triage', _site),
    _g('incidents:manage', _site),
    _g('incidents:capa', _site),
    _g('incidents:capa-verify', _site),
    _g('incidents:statutory', _site),
    _g('notices:create', _site),
    _g('notices:publish', _site),
  ],
  'PLANT_GM': [
    _g('dashboards:plant', _site),
    _g('workflow:inbox', _self),
    _g('workflow:act', _site),
    _g('note-sheets:read', _co),
    _g('note-sheets:sign', _site),
    _g('leave:read', _site),
    _g('leave:approve', _site),
    _g('attendance:read', _site),
    _g('attendance:approve-regularisation', _site),
    _g('visitors:read', _site),
    _g('visitors:create', _self),
    _g('visitors:approve', _site),
    _g('incidents:read', _site),
    _g('incidents:close', _site),
    _g('compliance:read', _co),
    _g('compliance:create', _site),
    _g('compliance:update', _site),
    _g('compliance:manage', _site),
    _g('assets:read', _site),
    _g('assets:update', _site),
    _g('assets:custody-assign', _site),
    _g('assets:maintain', _site),
    _g('assets:calibrate', _site),
    _g('assets:commission', _site),
    _g('assets:decommission', _site),
    _g('parcels:read', _site),
    _g('parcels:dispatch', _site),
    _g('fleet:read', _site),
    _g('notices:create', _site),
    _g('notices:publish', _site),
    _g('chat:use', _self),
  ],
  'CHAIRMAN': [
    _g('dashboards:read', _co),
    _g('dashboards:roi', _co),
    _g('dashboards:inner-circle', _co),
    _g('workflow:inbox', _self),
    _g('workflow:act', _co),
    _g('workflow:view-all', _co),
    _g('note-sheets:read', _co),
    _g('note-sheets:sign', _co),
    _g('notices:broadcast', _co),
    _g('notices:create', _co),
    _g('notices:publish', _co),
    _g('briefings:create', _co),
    _g('chat:use', _self),
    _g('chat:create-channel', _co),
    _g('chat:directive-issue', _co),
    _g('compliance:read', _co),
    _g('compliance:dispatch-letter', _co),
    _g('visitors:read', _co),
    _g('visitors:approve', _co),
    _g('fleet:read', _co),
    _g('incidents:read', _co),
    _g('attendance:read', _co),
    _g('employees:read', _co),
    _g('assets:read', _co),
    _g('assets:write-off', _co),
    _g('claims:read', _co),
    _g('leave:read', _co),
  ],
};

/// Flattened grants for a set of roles; the widest scope wins per key.
List<Json> grantsForRoles(List<String> roles) {
  final byKey = <String, Json>{};
  void add(_Spec spec, String via) {
    final (key, scope, maxAmount) = spec;
    final existing = byKey[key];
    final existingScope = existing == null
        ? null
        : scopeFromWire(existing['scope']! as String);
    if (existingScope == null || scope.index > existingScope.index) {
      byKey[key] = {
        'key': key,
        'scope': scope.name.toUpperCase(),
        'via': via,
        'maxAmount': maxAmount,
      };
    }
  }

  for (final g in _base) {
    add(g, 'ROLE:EMPLOYEE');
  }
  for (final role in roles) {
    for (final g in _roleGrants[role] ?? const <_Spec>[]) {
      add(g, 'ROLE:$role');
    }
  }
  return byKey.values.toList()
    ..sort((a, b) => a.str('key').compareTo(b.str('key')));
}

typedef _NavRule = ({String module, List<String> anyOf, String? readAbove});

const List<_NavRule> _navRules = [
  (module: 'dashboards', anyOf: ['dashboards:read'], readAbove: null),
  (module: 'approvals', anyOf: ['workflow:inbox'], readAbove: null),
  (module: 'notices', anyOf: ['notices:read'], readAbove: null),
  (module: 'note-sheets', anyOf: ['note-sheets:read'], readAbove: null),
  (module: 'attendance', anyOf: ['attendance:punch'], readAbove: null),
  (module: 'leave', anyOf: ['leave:request'], readAbove: null),
  (module: 'claims', anyOf: ['claims:create'], readAbove: null),
  (
    module: 'fleet',
    anyOf: [
      'fleet:request',
      'fleet:drive',
      'fleet:dispatch',
      'fleet:endorse',
      'fleet:gate',
      'fleet:read',
    ],
    readAbove: null,
  ),
  (module: 'bus', anyOf: ['bus:seat-self', 'bus:manage'], readAbove: null),
  (module: 'parcels', anyOf: ['parcels:read'], readAbove: null),
  (
    module: 'visitors',
    anyOf: ['visitors:create', 'visitors:gate'],
    readAbove: 'visitors:read',
  ),
  (module: 'incidents', anyOf: ['incidents:report'], readAbove: null),
  (module: 'assets', anyOf: ['assets:read'], readAbove: null),
  (module: 'compliance', anyOf: ['compliance:read'], readAbove: null),
  (module: 'employees', anyOf: ['employees:read'], readAbove: null),
  (module: 'chat', anyOf: ['chat:use'], readAbove: null),
];

/// Modules the shell may show for these grants. A module with `readAbove`
/// also appears when that read key is held above SELF scope.
List<String> navigationFor(List<Json> grants) {
  final held = {for (final g in grants) g.str('key'): g.str('scope')};
  return [
    for (final r in _navRules)
      if (r.anyOf.any(held.containsKey) ||
          (r.readAbove != null &&
              held[r.readAbove] != null &&
              held[r.readAbove] != 'SELF'))
        r.module,
  ];
}

const roleNames = <String, String>{
  'SUPER_ADMIN': 'Super Admin',
  'CHAIRMAN': 'Chairman',
  'DIRECTOR': 'Director',
  'PLANT_GM': 'Plant General Manager',
  'HOD': 'Head of Department',
  'LINE_MANAGER': 'Line Manager',
  'HR_ADMIN': 'HR Administrator',
  'FINANCE': 'Finance',
  'TRANSPORT_ADMIN': 'Transport Administrator',
  'COMPLIANCE_OFFICER': 'Compliance Officer',
  'HSE_OFFICER': 'HSE Officer',
  'SECURITY_GATE': 'Security Gate',
  'RECEPTION': 'Reception',
  'MAILROOM': 'Mailroom',
  'IT_ADMIN': 'IT Administrator',
  'DRIVER': 'Driver',
  'EMPLOYEE': 'Employee',
  'EXECUTIVE_ASSISTANT': 'Executive Assistant',
};

const roleNamesBn = <String, String>{
  'SUPER_ADMIN': 'সুপার অ্যাডমিন',
  'CHAIRMAN': 'চেয়ারম্যান',
  'DIRECTOR': 'পরিচালক',
  'PLANT_GM': 'প্ল্যান্ট জেনারেল ম্যানেজার',
  'HOD': 'বিভাগীয় প্রধান',
  'LINE_MANAGER': 'লাইন ম্যানেজার',
  'HR_ADMIN': 'এইচআর প্রশাসক',
  'FINANCE': 'অর্থ বিভাগ',
  'TRANSPORT_ADMIN': 'পরিবহন প্রশাসক',
  'COMPLIANCE_OFFICER': 'কমপ্লায়েন্স কর্মকর্তা',
  'HSE_OFFICER': 'এইচএসই কর্মকর্তা',
  'SECURITY_GATE': 'নিরাপত্তা গেট',
  'RECEPTION': 'অভ্যর্থনা',
  'MAILROOM': 'মেইলরুম',
  'IT_ADMIN': 'আইটি প্রশাসক',
  'DRIVER': 'চালক',
  'EMPLOYEE': 'কর্মচারী',
  'EXECUTIVE_ASSISTANT': 'নির্বাহী সহকারী',
};
