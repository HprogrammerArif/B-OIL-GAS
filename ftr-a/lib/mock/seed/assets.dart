import 'package:bogcl_oneops/mock/engines/asset_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/seed/seed_auth.dart';
import 'package:bogcl_oneops/mock/seed/seed_photo.dart';
import 'package:bogcl_oneops/mock/store.dart';

void seedAssets(MockStore store) {
  final gm = seedAuthFor(store, 'EMP-0012');
  final emp = seedAuthFor(store, 'EMP-1042');
  final drv = seedAuthFor(store, 'EMP-0821');
  final desk = seedAuthFor(store, 'EMP-0045');
  final fin = seedAuthFor(store, 'EMP-0062');
  final tanvir = emp.user.str('id');
  final harun = gm.user.str('id');
  final rafiq = drv.user.str('id');
  final kamruz = desk.user.str('id');

  DateTime wall() => DateTime.parse(store.nowIso());
  void at(Duration ago) =>
      AssetEngine.seedClock = wall().subtract(ago).toIso8601String();

  Json add({
    required String id,
    required String categoryId,
    required String name,
    required String nameBn,
    required String siteId,
    required double cost,
    required int life,
    String criticality = 'GENERAL_C',
    String? location,
    String? oem,
    String? serial,
    String? vehicleId,
    double opex = 0,
    double hours = 0,
    int health = 86,
    String? purchaseDate,
    String? warranty,
    String? nextCal,
    String? nextService,
    String? custodian,
    bool commissionNow = false,
    String? departmentId,
    AuthContext? who,
  }) {
    // Finance can register/commission; only Plant GM / HR can hand over.
    final registrar = who ?? gm;
    final photos = putSeedPhotos(
      store,
      prefix: 'file_ast_$id',
      uploaderUserId: registrar.user.str('id'),
      createdAt: AssetEngine.seedClock ?? store.nowIso(),
      count: 1,
    );
    final rec = AssetEngine.register(store, registrar, {
      'id': id,
      'categoryId': categoryId,
      'name': name,
      'nameBn': nameBn,
      'siteId': siteId,
      'departmentId': departmentId ?? 'dept_plant',
      'purchaseCost': cost,
      'usefulLifeYears': life,
      'criticality': criticality,
      'location': location,
      'oem': oem,
      'serialNo': serial,
      'vehicleId': vehicleId,
      'opexToDate': opex,
      'runtimeHours': hours,
      'healthScore': health,
      'purchaseDate': ?purchaseDate,
      'warrantyExpiresAt': warranty,
      'nextCalibrationAt': ?nextCal,
      'nextServiceAt': nextService,
      'commissionNow': commissionNow,
      'photoFileId': photos.first,
    });
    if (custodian != null) {
      AssetEngine.assignCustody(store, gm, rec, {'employeeUserId': custodian});
    }
    return store.get(Col.assets, id)!;
  }

  // 1. Working plant generator — Harunur holds it, signed.
  at(const Duration(days: 1220));
  add(
    id: 'ast_gen',
    categoryId: 'cat_plant',
    name: 'Stand-by generator G-02',
    nameBn: 'স্ট্যান্ড-বাই জেনারেটর জি-০২',
    siteId: 'site_plant',
    cost: 24000000,
    life: 15,
    criticality: 'ESSENTIAL_B',
    location: 'Utility bay',
    oem: 'Cummins',
    serial: 'CUM-G02-2019',
    opex: 1800000,
    hours: 6500,
    health: 72,
    custodian: harun,
    commissionNow: true,
  );
  AssetEngine.ackCustody(store, gm, store.get(Col.assets, 'ast_gen')!);

  // 2. Tank due for calibration within 12 days (tick → CALIBRATION_DUE).
  at(const Duration(days: 350));
  add(
    id: 'ast_tank',
    categoryId: 'cat_plant',
    name: 'Bitumen storage tank TK-104',
    nameBn: 'বিটুমিন স্টোরেজ ট্যাংক টিকে-১০৪',
    siteId: 'site_plant',
    cost: 18500000,
    life: 20,
    criticality: 'CRITICAL_A',
    location: 'Tank yard',
    oem: 'Local fab',
    serial: 'TK-104',
    health: 81,
    nextCal: wall().add(const Duration(days: 12)).toIso8601String(),
    custodian: harun,
    commissionNow: true,
  );
  AssetEngine.ackCustody(store, gm, store.get(Col.assets, 'ast_tank')!);

  // 3. Tanvir's laptop — waiting for his signature.
  at(const Duration(days: 40));
  add(
    id: 'ast_laptop',
    categoryId: 'cat_it',
    name: 'Sales laptop',
    nameBn: 'বিক্রয় ল্যাপটপ',
    siteId: 'site_hq',
    departmentId: 'dept_sales',
    cost: 145000,
    life: 4,
    location: 'Sales desk',
    oem: 'Dell',
    serial: 'DL-1042',
    health: 90,
    custodian: tanvir,
    commissionNow: true,
    who: fin,
  );

  // 4. Workshop pump in repair — Tanvir owns the job (no LOTO, office class).
  at(const Duration(days: 200));
  add(
    id: 'ast_pump',
    categoryId: 'cat_corp',
    name: 'Workshop transfer pump',
    nameBn: 'ওয়ার্কশপ পাম্প',
    siteId: 'site_plant',
    cost: 220000,
    life: 8,
    location: 'Workshop',
    oem: 'Grundfos',
    serial: 'GF-882',
    health: 48,
    custodian: harun,
    commissionNow: true,
  );
  AssetEngine.ackCustody(store, gm, store.get(Col.assets, 'ast_pump')!);
  at(const Duration(days: 2));
  AssetEngine.flagDefect(store, gm, store.get(Col.assets, 'ast_pump')!, {
    'description': 'Seal leak and noisy bearing on the workshop pump.',
    'severity': 'HIGH',
    'assigneeUserId': tanvir,
  });
  final pumpWo = AssetEngine.openWos(store, 'ast_pump').first;
  AssetEngine.startWo(store, emp, pumpWo);

  // 5. In store — ready for Harunur to put into service.
  at(const Duration(days: 5));
  add(
    id: 'ast_stock',
    categoryId: 'cat_safety',
    name: 'Gas detector kit',
    nameBn: 'গ্যাস ডিটেক্টর কিট',
    siteId: 'site_plant',
    cost: 86000,
    life: 6,
    location: 'HSE store',
    oem: 'Drager',
    serial: 'DR-551',
    health: 100,
  );

  // 6. Locked out mixer — Harunur must release LOTO.
  at(const Duration(days: 800));
  add(
    id: 'ast_loto',
    categoryId: 'cat_plant',
    name: 'Bitumen mixer MX-2',
    nameBn: 'বিটুমিন মিক্সার এমএক্স-২',
    siteId: 'site_plant',
    cost: 9800000,
    life: 12,
    criticality: 'CRITICAL_A',
    location: 'Process unit 2',
    oem: 'Pumptrex',
    serial: 'MX-2',
    hours: 4100,
    health: 61,
    custodian: harun,
    commissionNow: true,
  );
  AssetEngine.ackCustody(store, gm, store.get(Col.assets, 'ast_loto')!);
  at(const Duration(hours: 6));
  AssetEngine.loto(store, gm, store.get(Col.assets, 'ast_loto')!, {
    'action': 'APPLY',
    'permitNo': 'LOTO-2026-0007',
  });

  // 7. Radio on the way to head office.
  at(const Duration(days: 90));
  add(
    id: 'ast_xfer',
    categoryId: 'cat_safety',
    name: 'Plant radio set',
    nameBn: 'প্ল্যান্ট রেডিও সেট',
    siteId: 'site_plant',
    cost: 42000,
    life: 5,
    location: 'Gate house',
    oem: 'Motorola',
    serial: 'MOT-19',
    health: 84,
    custodian: kamruz,
    commissionNow: true,
  );
  AssetEngine.ackCustody(store, desk, store.get(Col.assets, 'ast_xfer')!);
  at(const Duration(hours: 8));
  AssetEngine.transfer(store, gm, store.get(Col.assets, 'ast_xfer')!, {
    'toSiteId': 'site_hq',
    'toLocation': 'Reception',
    'toEmployeeUserId': tanvir,
    'reason': 'Head office night desk needs a spare radio.',
  });

  // 8. Photocopier retired — waiting for finance boxes and write-off.
  at(const Duration(days: 2800));
  add(
    id: 'ast_eol',
    categoryId: 'cat_corp',
    name: 'Accounts photocopier',
    nameBn: 'হিসাব ফটোকপিয়ার',
    siteId: 'site_plant',
    departmentId: 'dept_fin',
    cost: 380000,
    life: 6,
    location: 'Accounts room',
    oem: 'Canon',
    serial: 'CN-220',
    opex: 210000,
    health: 31,
    custodian: harun,
    commissionNow: true,
  );
  AssetEngine.ackCustody(store, gm, store.get(Col.assets, 'ast_eol')!);
  at(const Duration(days: 3));
  AssetEngine.decommission(store, gm, store.get(Col.assets, 'ast_eol')!, {
    'reason': 'Economic life exhausted',
    'surveyNotes': 'Drum scored, spare parts no longer stocked, repair would exceed half the book value.',
  });
  AssetEngine.patchChecklist(store, gm, store.get(Col.assets, 'ast_eol')!, {
    'technicalSurveySigned': true,
    'decontaminationCertified': true,
    'sparesHarvested': true,
  });

  // 9–10. Fleet cars stay in sync with MOD-09 (BR-05-15).
  at(const Duration(days: 900));
  add(
    id: 'ast_sedan',
    categoryId: 'cat_vehicle',
    name: 'Pool sedan 12-4401',
    nameBn: 'পুল সেডান ১২-৪৪০১',
    siteId: 'site_hq',
    departmentId: 'dept_trans',
    cost: 3200000,
    life: 8,
    location: 'HQ car park',
    oem: 'Toyota',
    serial: 'TM-4401',
    vehicleId: 'veh_sedan',
    health: 78,
    custodian: rafiq,
    commissionNow: true,
    who: fin,
  );
  AssetEngine.ackCustody(store, drv, store.get(Col.assets, 'ast_sedan')!);

  at(const Duration(days: 1100));
  add(
    id: 'ast_tanker',
    categoryId: 'cat_vehicle',
    name: 'Bitumen tanker 31-0092',
    nameBn: 'বিটুমিন ট্যাংকার ৩১-০০৯২',
    siteId: 'site_plant',
    departmentId: 'dept_trans',
    cost: 11800000,
    life: 10,
    location: 'Plant tanker bay',
    oem: 'Hino',
    serial: 'HN-0092',
    vehicleId: 'veh_tanker',
    hours: 6500,
    health: 69,
    custodian: kamruz,
    commissionNow: true,
  );
  AssetEngine.ackCustody(store, desk, store.get(Col.assets, 'ast_tanker')!);

  AssetEngine.seedClock = null;
}
