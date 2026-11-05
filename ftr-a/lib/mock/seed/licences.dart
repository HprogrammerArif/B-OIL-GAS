import 'package:bogcl_oneops/mock/engines/licence_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/seed/seed_auth.dart';
import 'package:bogcl_oneops/mock/store.dart';

void seedLicences(MockStore store) {
  final gm = seedAuthFor(store, 'EMP-0012');
  final fin = seedAuthFor(store, 'EMP-0062');
  final harun = gm.user.str('id');
  final farida = fin.user.str('id');
  final wall = DateTime.parse(store.nowIso());

  String day(int offset) => wall.add(Duration(days: offset)).toIso8601String();

  Json add({
    required String id,
    required String typeId,
    required String title,
    required String titleBn,
    required String licenceNo,
    required String siteId,
    required String owner,
    required int days,
    double fee = 0,
    double risk = 0,
    String criticality = 'ESSENTIAL_B',
  }) => LicenceEngine.create(store, gm, {
    'id': id,
    'typeId': typeId,
    'title': title,
    'titleBn': titleBn,
    'licenceNo': licenceNo,
    'siteId': siteId,
    'ownerUserId': owner,
    'expiresAt': day(days),
    'issuedAt': day(days - 360),
    'feeAmount': fee,
    'shutdownRiskPerDay': risk,
    'criticality': criticality,
  });

  void passAll(Json lic) {
    final r = LicenceEngine.openRenewal(store, lic.str('id'));
    if (r == null) return;
    for (final raw in r['checklist']! as List) {
      final item = Map<String, Object?>.from(raw as Map);
      LicenceEngine.tickItem(store, gm, lic, item.str('id'), {
        'status': 'PASSED',
      });
    }
  }

  // HQ BSTI — Farida holds it, plenty of time.
  add(
    id: 'lic_bsti',
    typeId: 'lt_bsti',
    title: 'Bitumen grade certificate',
    titleBn: 'বিটুমিন গ্রেড সনদ',
    licenceNo: 'BSTI-BM-2025-118',
    siteId: 'site_plant',
    owner: farida,
    days: 200,
  );

  // Plant fire — inside lead time, auto-opens a renewal.
  add(
    id: 'lic_fscd',
    typeId: 'lt_fire',
    title: 'Plant fire licence',
    titleBn: 'প্ল্যান্ট ফায়ার লাইসেন্স',
    licenceNo: 'FSCD-KER-441',
    siteId: 'site_plant',
    owner: harun,
    days: 50,
    risk: 180000,
  );

  // Explosives — 18 days, fee waiting on Farida.
  add(
    id: 'lic_doexp',
    typeId: 'lt_expl',
    title: 'Explosives magazine',
    titleBn: 'বিস্ফোরক ম্যাগাজিন',
    licenceNo: 'DOEXP/DHK/MAG/09',
    siteId: 'site_plant',
    owner: harun,
    days: 18,
    fee: 250000,
    risk: 850000,
    criticality: 'CRITICAL_A',
  );

  // Quota — inspection booked.
  add(
    id: 'lic_emrd',
    typeId: 'lt_quota',
    title: 'Bitumen import quota',
    titleBn: 'বিটুমিন আমদানি কোটা',
    licenceNo: 'EMRD-Q-2026-07',
    siteId: 'site_plant',
    owner: harun,
    days: 40,
    risk: 420000,
  );
  final emrd = store.get(Col.compliance, 'lic_emrd')!;
  passAll(emrd);
  LicenceEngine.advance(store, gm, emrd, {});
  LicenceEngine.advance(store, gm, emrd, {
    'inspectorName': 'A. K. Rahman, EMRD',
    'inspectionAt': day(5),
  });

  // Environment — waiting for the new certificate.
  add(
    id: 'lic_doe',
    typeId: 'lt_env',
    title: 'Environmental clearance',
    titleBn: 'পরিবেশ ছাড়পত্র',
    licenceNo: 'DOE/CLR/KER/31',
    siteId: 'site_plant',
    owner: harun,
    days: 22,
    risk: 310000,
  );
  final doe = store.get(Col.compliance, 'lic_doe')!;
  passAll(doe);
  LicenceEngine.advance(store, gm, doe, {});
  LicenceEngine.advance(store, gm, doe, {
    'inspectorName': 'DoE field team',
    'inspectionAt': day(-4),
  });
  LicenceEngine.advance(store, gm, doe, {
    'auditFindings': 'Stack test acceptable. Housekeeping note on drum yard.',
  });

  // Boiler — already lapsed. Chairman can send a letter.
  add(
    id: 'lic_boiler',
    typeId: 'lt_boiler',
    title: 'Utility boiler BR-2',
    titleBn: 'ইউটিলিটি বয়লার বিআর-২',
    licenceNo: 'CIB-KER-882',
    siteId: 'site_plant',
    owner: harun,
    days: -6,
    fee: 80000,
    risk: 960000,
    criticality: 'CRITICAL_A',
  );

  add(
    id: 'lic_factory',
    typeId: 'lt_fire',
    title: 'Factory licence, Keraniganj',
    titleBn: 'কারখানা লাইসেন্স, কেরানীগঞ্জ',
    licenceNo: 'DIFE-KER-2025-14',
    siteId: 'site_plant',
    owner: harun,
    days: 9,
    fee: 40000,
    risk: 220000,
    criticality: 'CRITICAL_A',
  );
}
