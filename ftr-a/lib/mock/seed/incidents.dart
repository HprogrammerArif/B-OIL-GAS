import 'package:bogcl_oneops/mock/engines/incident_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/seed_auth.dart';
import 'package:bogcl_oneops/mock/seed/seed_photo.dart';
import 'package:bogcl_oneops/mock/store.dart';

void seedIncidents(MockStore store) {
  final emp = seedAuthFor(store, 'EMP-1042');
  final hse = seedAuthFor(store, 'EMP-0012');
  final drv = seedAuthFor(store, 'EMP-0821');
  final tanvir = emp.user.str('id');
  final harun = hse.user.str('id');

  DateTime wall() => DateTime.parse(store.nowIso());
  void at(Duration ago) =>
      IncidentEngine.seedClock = wall().subtract(ago).toIso8601String();

  Json report({
    required AuthContext who,
    required String type,
    required String title,
    required String description,
    required String siteId,
    required String zone,
    required DateTime when,
    required int severity,
    required int likelihood,
    String? id,
    bool anonymous = false,
    List<Json> people = const [],
  }) {
    final recId = id ?? 'inc_${store.nowMs()}';
    final photos = putSeedPhotos(
      store,
      prefix: 'file_inc_$recId',
      uploaderUserId: who.user.str('id'),
      createdAt: IncidentEngine.seedClock ?? store.nowIso(),
    );
    return IncidentEngine.create(store, who, {
      'id': recId,
      'type': type,
      'title': title,
      'description': description,
      'siteId': siteId,
      'zone': zone,
      'occurredAt': when.toIso8601String(),
      'severity': severity,
      'likelihood': likelihood,
      'isAnonymous': anonymous,
      'people': people,
      'attachmentFileIds': photos,
    });
  }

  // 1. Waiting for Harunur to triage (Tanvir, HQ near-miss).
  at(const Duration(hours: 3));
  report(
    who: emp,
    id: 'inc_near',
    type: 'NEAR_MISS',
    title: 'Loose grating on the workshop stairs',
    description: 'The middle step on the workshop stair has a loose grating. A fitter nearly fell this morning. The area is not taped off.',
    siteId: 'site_plant',
    zone: 'Central Workshop & Fabrication Shed',
    when: wall().subtract(const Duration(hours: 4)),
    severity: 2,
    likelihood: 3,
  );

  // 2. On investigation — Harunur fills the root cause.
  at(const Duration(hours: 20));
  final spill = report(
    who: emp,
    id: 'inc_spill',
    type: 'SPILL_LEAK',
    title: 'Bitumen seepage at the TK-102 flange',
    description: 'A slow drip of hot bitumen from the TK-102 outlet flange during the morning transfer. The bund is holding it. Two operators were nearby; no one was burned.',
    siteId: 'site_plant',
    zone: 'Storage Tank Yard TK-101–108',
    when: wall().subtract(const Duration(hours: 22)),
    severity: 3,
    likelihood: 3,
  );
  IncidentEngine.triage(store, hse, spill, {
    'severity': 3,
    'likelihood': 3,
    'investigatorUserId': harun,
  });
  IncidentEngine.investigate(store, hse, spill);

  // 3. Fix assigned to Tanvir — he can start and finish it.
  at(const Duration(days: 2));
  final fire = report(
    who: emp,
    id: 'inc_fire',
    type: 'FIRE_THERMAL',
    title: 'Small flare at the gantry drip tray',
    description: 'A drip tray under the loading arm caught a brief flame when a tanker was connected. The watchman used the nearby extinguisher. No injury. The gantry was stopped for twenty minutes.',
    siteId: 'site_plant',
    zone: 'Bulk Tanker Loading Gantry',
    when: wall().subtract(const Duration(days: 2, hours: 2)),
    severity: 3,
    likelihood: 4,
  );
  IncidentEngine.triage(store, hse, fire, {
    'severity': 3,
    'likelihood': 4,
    'investigatorUserId': harun,
  });
  IncidentEngine.investigate(store, hse, fire);
  IncidentEngine.saveRca(store, hse, fire, {
    'why1': 'Flame appeared in the drip tray',
    'why2': 'Product residue was left from the last load',
    'why3': 'The tray is not drained after each tanker',
    'rootCause': 'No written rule to drain and wipe the gantry drip tray after every load.',
  });
  IncidentEngine.addCapa(store, hse, fire, {
    'type': 'IMMEDIATE_CONTAINMENT',
    'description': 'Drain and sand the drip tray after every tanker today.',
    'ownerUserId': tanvir,
  });

  // 4. Ready for Harunur to sign as safety, then as plant head.
  at(const Duration(days: 8));
  final review = report(
    who: emp,
    id: 'inc_review',
    type: 'EQUIPMENT_DAMAGE',
    title: 'Bent ladder on the circulation pump house',
    description: 'The access ladder to pump P-204 is bent at the third rung. A fitter reported it after a near slip. The pump is still running.',
    siteId: 'site_plant',
    zone: 'Circulation Pump House, Unit-2',
    when: wall().subtract(const Duration(days: 8)),
    severity: 2,
    likelihood: 2,
  );
  IncidentEngine.triage(store, hse, review, {
    'severity': 2,
    'likelihood': 2,
    'investigatorUserId': harun,
  });
  IncidentEngine.investigate(store, hse, review);
  IncidentEngine.saveRca(store, hse, review, {
    'why1': 'Ladder is bent',
    'why2': 'A drum was dropped against it last month',
    'why3': 'No one tagged the ladder out of use',
    'rootCause': 'Damaged access equipment is not tagged and replaced at once.',
  });
  final capa = IncidentEngine.addCapa(store, hse, review, {
    'type': 'CORRECTIVE',
    'description': 'Replace the ladder and tag any damaged access kit red.',
    'ownerUserId': tanvir,
  });
  IncidentEngine.startCapa(store, emp, capa);
  IncidentEngine.completeCapa(store, emp, capa, {
    'evidence': 'New ladder fitted yesterday. The old one is in the scrap bay with a red tag.',
  });
  IncidentEngine.verifyCapa(store, hse, capa);

  // 5. Closed lost-time — history.
  at(const Duration(days: 40));
  final closed = report(
    who: emp,
    id: 'inc_closed',
    type: 'LOST_TIME',
    title: 'Sprain at the truck gate while chocking a tanker',
    description: 'A helper sprained an ankle placing a wheel chock on wet concrete at the main truck gate. He was sent to the plant clinic and missed the next two shifts.',
    siteId: 'site_plant',
    zone: 'Main truck gate',
    when: wall().subtract(const Duration(days: 40)),
    severity: 3,
    likelihood: 2,
    people: [
      {
        'name': 'Abdul Karim',
        'role': 'INJURED',
        'injuryDesc': 'Right ankle sprain',
      },
    ],
  );
  IncidentEngine.triage(store, hse, closed, {
    'severity': 3,
    'likelihood': 2,
    'investigatorUserId': harun,
  });
  IncidentEngine.investigate(store, hse, closed);
  IncidentEngine.saveRca(store, hse, closed, {
    'why1': 'Helper slipped',
    'why2': 'Concrete was wet and had no grit',
    'why3': 'Rain water sits at the chock point',
    'rootCause': 'The gate apron has no drainage or grit after rain.',
  });
  final done = IncidentEngine.addCapa(store, hse, closed, {
    'type': 'PREVENTIVE',
    'description': 'Add grit bins and a drain channel at the chock point.',
    'ownerUserId': tanvir,
  });
  IncidentEngine.startCapa(store, emp, done);
  IncidentEngine.completeCapa(store, emp, done, {
    'evidence': 'Grit bins installed and a shallow drain cut along the apron.',
  });
  IncidentEngine.verifyCapa(store, hse, done);
  IncidentEngine.fileStatutory(store, hse, closed, {
    'receiptNo': 'DIFE-2026-118',
  });
  IncidentEngine.close(store, hse, closed, {
    'remarks': 'Safety checks complete.',
  });
  IncidentEngine.close(store, hse, closed, {
    'remarks': 'Plant head agrees. Keep the grit bins full.',
  });

  // 6. Driver anonymous hazard — HSE sees it without a name.
  at(const Duration(hours: 6));
  report(
    who: drv,
    id: 'inc_anon',
    type: 'HAZARD',
    title: 'Oil on the plant approach road after last night’s rain',
    description: 'The bend before the weighbridge is slick with oil and rain water. Two trucks locked wheels this morning. Please grit it before the afternoon line-up.',
    siteId: 'site_plant',
    zone: 'Main truck gate',
    when: wall().subtract(const Duration(hours: 7)),
    severity: 2,
    likelihood: 4,
    anonymous: true,
  );

  // 7–8. Still open, so the plant list and the home count are not a single case.
  at(const Duration(hours: 10));
  report(
    who: emp,
    id: 'inc_hose',
    type: 'NEAR_MISS',
    title: 'Steam hose parted at the drum heater',
    description: 'The steam hose on drum heater 2 blew off the clip while an operator was standing beside it. Nobody was scalded. The clip is the original one from commissioning.',
    siteId: 'site_plant',
    zone: 'Drum filling bay',
    when: wall().subtract(const Duration(hours: 11)),
    severity: 3,
    likelihood: 3,
  );
  at(const Duration(hours: 2));
  report(
    who: drv,
    id: 'inc_gate',
    type: 'HAZARD',
    title: 'Weighbridge barrier stays down after a truck passes',
    description: 'The exit barrier at the weighbridge did not lift after two tankers. Drivers are walking around it. The loop sensor looks flooded.',
    siteId: 'site_plant',
    zone: 'Weighbridge',
    when: wall().subtract(const Duration(hours: 3)),
    severity: 2,
    likelihood: 4,
  );

  IncidentEngine.seedClock = null;
}
