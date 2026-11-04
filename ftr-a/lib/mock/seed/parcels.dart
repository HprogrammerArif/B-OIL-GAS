import 'package:bogcl_oneops/mock/engines/parcel_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/seed/seed_auth.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// Parcels through the real engine, with history placed in the past so the
/// list shows every stage: waiting, on the road (one stuck), out for
/// delivery with a live code in the recipient's inbox, and delivered.
void seedParcels(MockStore store) {
  final sender = seedAuthFor(store, 'EMP-1042'); // Employee, HQ
  final gm = seedAuthFor(store, 'EMP-0012'); // Plant GM, Keraniganj
  final hod = seedAuthFor(store, 'EMP-0062'); // Finance HOD, HQ
  final chairman = seedAuthFor(store, 'EMP-0001'); // HQ
  final mailroom = seedAuthFor(store, 'EMP-0045'); // Mailroom + gate, Plant
  final driver = seedAuthFor(store, 'EMP-0821');
  final driverId = driver.user.str('id');

  DateTime now() => DateTime.parse(store.nowIso());
  void at(Duration ago) =>
      ParcelEngine.seedClock = now().subtract(ago).toIso8601String();

  // 1. Sealed tender bid, HQ to Plant: at the plant mailroom, code sent.
  at(const Duration(hours: 20));
  final bid = ParcelEngine.create(store, sender, {
    'category': 'TENDER_BID',
    'urgency': 'CRITICAL',
    'description': 'Sealed bid for the terminal expansion contract',
    'declaredValue': 14500000,
    'weightKg': 1.2,
    'recipientUserId': gm.user.str('id'),
    'specialHandling': ['KEEP_UPRIGHT'],
  });
  at(const Duration(hours: 19));
  ParcelEngine.dispatch(store, mailroom, bid, {
    'courierUserId': driverId,
    'sealNo': 'BG-48213',
  });
  at(const Duration(hours: 14));
  ParcelEngine.checkpoint(store, driver, bid, {
    'location': 'Savar toll plaza',
    'sealIntact': true,
  });
  at(const Duration(hours: 9));
  ParcelEngine.gateIn(store, mailroom, bid, {'sealIntact': true});
  ParcelEngine.seedClock = null;
  ParcelEngine.outForDelivery(store, mailroom, bid);

  // 2. Spare laptop inside HQ: handed to the courier, not yet delivered.
  at(const Duration(hours: 3));
  final laptop = ParcelEngine.create(store, sender, {
    'category': 'IT_HARDWARE',
    'description': 'Replacement laptop for the finance team',
    'declaredValue': 85000,
    'recipientUserId': hod.user.str('id'),
  });
  ParcelEngine.dispatch(store, mailroom, laptop, {
    'courierUserId': driverId,
    'sealNo': 'BG-48216',
  });

  // 3. Legal papers Plant to HQ: on the road for 30 hours with no update.
  at(const Duration(hours: 31));
  final legal = ParcelEngine.create(store, gm, {
    'category': 'LEGAL_DOCS',
    'urgency': 'HIGH',
    'description': 'Signed land lease papers for the chairman',
    'recipientUserId': chairman.user.str('id'),
  });
  at(const Duration(hours: 30));
  ParcelEngine.dispatch(store, mailroom, legal, {
    'courierUserId': driverId,
    'sealNo': 'BG-48190',
  });
  ParcelEngine.checkpoint(store, driver, legal, {
    'location': 'Keraniganj gate',
    'sealIntact': true,
  });

  // 4. Draft: not handed to the mailroom yet.
  ParcelEngine.seedClock = null;
  ParcelEngine.create(store, sender, {
    'category': 'GENERAL',
    'description': 'Signed vendor agreements, 3 copies',
    'recipientUserId': hod.user.str('id'),
  });

  // 5. History: delivered three days ago, accepted in the app.
  at(const Duration(days: 3, hours: 4));
  final done = ParcelEngine.create(store, hod, {
    'category': 'SPARES',
    'description': 'Printer toner cartridges, 4 boxes',
    'recipientUserId': sender.user.str('id'),
  });
  at(const Duration(days: 3, hours: 3));
  ParcelEngine.dispatch(store, mailroom, done, {'courierUserId': driverId});
  at(const Duration(days: 3, hours: 1));
  ParcelEngine.outForDelivery(store, mailroom, done);
  at(const Duration(days: 3));
  ParcelEngine.accept(store, sender, done);
  ParcelEngine.seedClock = null;
  store.put(Col.parcels, done);
}
