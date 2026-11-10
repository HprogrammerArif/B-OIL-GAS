import 'package:bogcl_oneops/mock/engines/visitor_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/seed/seed_auth.dart';
import 'package:bogcl_oneops/mock/seed/seed_photo.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Visits through the real engine so the list shows every stage a persona
/// can act on: waiting for approval, ready at the gate, inside and overdue.
void seedVisits(MockStore store) {
  store.put(Col.watchlist, {
    'id': 'wl_1',
    'fullName': 'Nobody On The List',
    'phoneNorm': '+8801999000000',
    'reason': 'Demo watchlist row (not used by seeded visits)',
  });

  final emp = seedAuthFor(store, 'EMP-1042');
  final gm = seedAuthFor(store, 'EMP-0012');
  final gate = seedAuthFor(store, 'EMP-0045');
  final hr = seedAuthFor(store, 'EMP-0028');

  DateTime now() => DateTime.parse(store.nowIso());
  void at(Duration ago) =>
      VisitEngine.seedClock = now().subtract(ago).toIso8601String();

  // 1. Regular guest at HQ, pass ready — HR can check them in.
  at(const Duration(hours: 3));
  VisitEngine.create(store, emp, {
    'fullName': 'Kamrul Hasan',
    'organisation': 'Eastern Petrochemical Ltd',
    'phone': '+8801711445566',
    'category': 'VENDOR',
    'purpose': 'Quarterly review of the bitumen supply contract',
    'expectedAt': now().add(const Duration(hours: 1)).toIso8601String(),
    'siteId': 'site_hq',
    'zones': [
      {'id': 'z_hq_rec'},
      {'id': 'z_hq_board'},
    ],
    'vehiclePlate': 'DHA-G-11-2234',
  });

  // 2. Government inspector at the plant, waiting for the GM to approve.
  at(const Duration(hours: 20));
  VisitEngine.create(store, gm, {
    'fullName': 'Taherul Alam',
    'organisation': 'Department of Explosives',
    'phone': '+8801812009988',
    'category': 'GOVT',
    'vipTier': 'GOVT',
    'idProofType': 'GOVT_BADGE',
    'idProofNo': 'DEX-2026-112',
    'purpose': 'Annual statutory safety inspection of the process units',
    'expectedAt': now().add(const Duration(hours: 2)).toIso8601String(),
    'siteId': 'site_plant',
    'escortUserId': gm.user.str('id'),
    'zones': [
      {'id': 'z_pl_tank'},
      {'id': 'z_pl_lab'},
    ],
    'vehiclePlate': 'MET-GA-77-5500',
  });

  // 3. Contractor already inside the plant, overdue — gate checks out,
  // host can extend.
  at(const Duration(hours: 6));
  final inside = VisitEngine.create(store, gm, {
    'fullName': 'Arif Mahmud Khan',
    'organisation': 'Keraniganj Mechanical Works',
    'phone': '+8801641009978',
    'category': 'CONTRACTOR',
    'idProofType': 'NID',
    'idProofNo': '1993445566778',
    'purpose': 'Pump house gasket replacement',
    'expectedAt': now().subtract(const Duration(hours: 5)).toIso8601String(),
    'expectedEndAt': now()
        .subtract(const Duration(hours: 1, minutes: 40))
        .toIso8601String(),
    'siteId': 'site_plant',
    'zones': [
      {'id': 'z_pl_pump'},
    ],
  });
  VisitEngine.ppe(store, gate, inside, {
    'hardHat': true,
    'shoes': true,
    'hiVisVest': true,
  });
  store.put(
    Col.files,
    seedPhotoFile(
      id: 'file_vis_seed_1',
      uploaderUserId: gate.user.str('id'),
      createdAt: store.nowIso(),
    ),
  );
  VisitEngine.checkIn(store, gate, inside, {
    'photoFileId': 'file_vis_seed_1',
    'ndaSigned': true,
    'safetyBriefingDone': true,
  });

  // 4. Client who left HQ yesterday.
  at(const Duration(hours: 30));
  final left = VisitEngine.create(store, emp, {
    'fullName': 'Zulaikha Parveen',
    'organisation': 'Meghna Polymers and Chemicals',
    'phone': '+8801920333444',
    'category': 'CLIENT',
    'purpose': 'Polymer raw material procurement meeting',
    'expectedAt': now().subtract(const Duration(hours: 28)).toIso8601String(),
    'siteId': 'site_hq',
    'zones': [
      {'id': 'z_hq_board'},
    ],
  });
  store.put(
    Col.files,
    seedPhotoFile(
      id: 'file_vis_seed_2',
      uploaderUserId: hr.user.str('id'),
      createdAt: store.nowIso(),
      fileName: 'gate2.png',
    ),
  );
  at(const Duration(hours: 27));
  VisitEngine.checkIn(store, hr, left, {
    'photoFileId': 'file_vis_seed_2',
    'ndaSigned': true,
  });
  at(const Duration(hours: 25));
  VisitEngine.checkOut(store, hr, left, {'badgeReturned': true});

  VisitEngine.seedClock = null;
  VisitEngine.tick(store);
}
