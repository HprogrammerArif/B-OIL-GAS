import 'package:bogcl_oneops/mock/engines/fleet_engine.dart';
import 'package:bogcl_oneops/mock/engines/workflow_engine.dart';
import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/seed/seed_auth.dart';
import 'package:bogcl_oneops/mock/store.dart';

void _vehicle(
  MockStore store, {
  required String id,
  required String plate,
  required String type,
  required int capacity,
  required String site,
  int odo = 42000,
  bool hazmat = false,
  int tank = 75,
}) {
  store.put(Col.fleetVehicles, {
    'id': id,
    'plateNo': plate,
    'type': type,
    'capacity': capacity,
    'status': 'AVAILABLE',
    'siteId': site,
    'odometerKm': odo,
    'isHazmat': hazmat,
    'tankLiters': tank,
    'reservedTripId': null,
    'documents': [
      {
        'kind': 'FITNESS',
        'expiresAt': DateTime.parse(store.nowIso())
            .add(const Duration(days: 200))
            .toIso8601String(),
      },
      {
        'kind': 'INSURANCE',
        'expiresAt': DateTime.parse(store.nowIso())
            .add(const Duration(days: 120))
            .toIso8601String(),
      },
      if (hazmat)
        {
          'kind': 'HAZMAT_PERMIT',
          'expiresAt': DateTime.parse(store.nowIso())
              .add(const Duration(days: 90))
              .toIso8601String(),
        },
    ],
  });
}

void seedFleet(MockStore store) {
  FleetEngine.registerHooks();
  final emp = seedAuthFor(store, 'EMP-1042');
  final hod = seedAuthFor(store, 'EMP-0062');
  final desk = seedAuthFor(store, 'EMP-0045');
  final driver = seedAuthFor(store, 'EMP-0821');

  _vehicle(
    store,
    id: 'veh_sedan',
    plate: 'DHAKA METRO-12-4401',
    type: 'SEDAN',
    capacity: 4,
    site: 'site_hq',
  );
  _vehicle(
    store,
    id: 'veh_van',
    plate: 'DHAKA METRO-18-2208',
    type: 'MICROBUS',
    capacity: 7,
    site: 'site_hq',
    odo: 61000,
  );
  _vehicle(
    store,
    id: 'veh_pickup',
    plate: 'DHAKA METRO-22-1190',
    type: 'PICKUP',
    capacity: 4,
    site: 'site_plant',
    odo: 88000,
  );
  _vehicle(
    store,
    id: 'veh_tanker',
    plate: 'DHAKA METRO-31-0092',
    type: 'TANKER',
    capacity: 2,
    site: 'site_plant',
    odo: 112000,
    hazmat: true,
    tank: 250,
  );

  store.put(Col.fleetDrivers, {
    'id': 'drv_0821',
    'userId': driver.user.str('id'),
    'employeeId': driver.employee.str('id'),
    'driverCode': 'DRV-01',
    'status': 'AVAILABLE',
    'licenceClass': 'LIGHT',
    'licenceExpiresAt': DateTime.parse(store.nowIso())
        .add(const Duration(days: 400))
        .toIso8601String(),
    'dutyHoursToday': 2.0,
    'totalTrips': 86,
    'lastBreathalyzerResult': 'PASSED',
    'lastBreathalyzerAt': store.nowIso(),
    'reservedTripId': null,
  });

  DateTime wall() => DateTime.parse(store.nowIso());
  void at(Duration ago) =>
      FleetEngine.seedClock = wall().subtract(ago).toIso8601String();

  Json make({
    required String dest,
    required String purpose,
    required DateTime depart,
    int pax = 2,
    String tripType = 'ONE_WAY',
    String priority = 'NORMAL',
  }) => FleetEngine.create(store, emp, {
    'purpose': purpose,
    'destination': dest,
    'origin': 'Head Office, Baridhara',
    'departAt': depart.toIso8601String(),
    'passengerCount': pax,
    'tripType': tripType,
    'priority': priority,
  });

  void endorse(Json r) {
    FleetEngine.submit(store, emp, r);
    WorkflowEngine.act(
      store,
      instanceId: r.str('workflowInstanceId'),
      actorUserId: hod.user.str('id'),
      type: 'APPROVE',
      comment: 'Approved for official travel',
    );
  }

  Json tripOf(Json r) => store.get(Col.fleetTrips, r.str('tripId'))!;

  // Finished last week — Tanvir can rate it.
  at(const Duration(hours: 50));
  final done = make(
    dest: 'Keraniganj Plant',
    purpose: 'Took the signed offtake minutes back to the plant registry',
    depart: wall().subtract(const Duration(hours: 48)),
  );
  endorse(done);
  FleetEngine.assign(store, desk, done, {
    'vehicleId': 'veh_sedan',
    'driverId': 'drv_0821',
    'dispatchNote': 'Same-day return after the registry stamp.',
  });
  FleetEngine.seedClock = DateTime.parse(done.str('departAt'))
      .toIso8601String();
  FleetEngine.gateOut(store, driver, tripOf(done), {'odometerKm': 42040});
  FleetEngine.seedClock = DateTime.parse(done.str('departAt'))
      .add(const Duration(hours: 2))
      .toIso8601String();
  FleetEngine.complete(store, driver, tripOf(done), {'endKm': 42120});

  // Waiting for Farida (HOD) to endorse.
  at(const Duration(hours: 2));
  FleetEngine.submit(
    store,
    emp,
    make(
      dest: 'Keraniganj Plant',
      purpose: 'Site visit with the sales team for the monthly offtake review',
      depart: wall().add(const Duration(hours: 6)),
    ),
  );

  // Approved — Kamruzzaman assigns a car.
  at(const Duration(hours: 5));
  endorse(
    make(
      dest: 'Chattogram Terminal',
      purpose: 'Collect signed bills of lading from the terminal office',
      depart: wall().add(const Duration(hours: 8)),
      tripType: 'ROUND_TRIP',
    ),
  );

  // Finished four days ago — shows in the driver's history.
  // The clock sits four days back, so departure must still be an hour later.
  at(const Duration(days: 4));
  final older = make(
    dest: 'Chattogram Terminal',
    purpose: 'Returned the empty sample cans after the lab test',
    depart: wall()
        .subtract(const Duration(days: 4))
        .add(const Duration(hours: 2)),
  );
  endorse(older);
  FleetEngine.assign(store, desk, older, {
    'vehicleId': 'veh_pickup',
    'driverId': 'drv_0821',
    'dispatchNote': 'Back before the evening shift.',
  });
  FleetEngine.seedClock = DateTime.parse(older.str('departAt'))
      .toIso8601String();
  FleetEngine.gateOut(store, driver, tripOf(older), {'odometerKm': 88110});
  FleetEngine.seedClock = DateTime.parse(older.str('departAt'))
      .add(const Duration(hours: 5))
      .toIso8601String();
  FleetEngine.complete(store, driver, tripOf(older), {'endKm': 88340});

  // On the road — the loginable driver can record stops, SOS and finish.
  at(const Duration(hours: 3));
  final live = make(
    dest: 'Keraniganj Plant',
    purpose: 'Carry the sealed tender file to the plant GM',
    depart: wall().subtract(const Duration(minutes: 40)),
    priority: 'HIGH',
  );
  endorse(live);
  FleetEngine.assign(store, desk, live, {
    'vehicleId': 'veh_van',
    'driverId': 'drv_0821',
    'dispatchNote': 'Do not open the envelope. Call Tanvir on arrival.',
  });
  FleetEngine.seedClock = DateTime.parse(live.str('departAt'))
      .toIso8601String();
  FleetEngine.gateOut(store, driver, tripOf(live), {'odometerKm': 61040});
  FleetEngine.addToll(store, driver, tripOf(live), {
    'plaza': 'Babubazar',
    'amount': 150,
  });
  FleetEngine.issueFuel(store, desk, {
    'vehicleId': 'veh_van',
    'tripId': live['tripId'],
    'station': 'Depot pump',
    'liters': 20,
    'amount': 2300,
  });
  FleetEngine.standaloneSos(store, driver, {
    'note': 'Need a second car — the approach road is flooded near the flyover',
    'requisitionId': live['id'],
    'tripId': live['tripId'],
  });

  FleetEngine.seedClock = null;

  at(const Duration(hours: 8));
  endorse(
    make(
      dest: 'Mongla Depot',
      purpose: 'Carry the signed offtake samples to the depot lab',
      depart: wall().add(const Duration(hours: 20)),
    ),
  );
  at(const Duration(hours: 6));
  endorse(
    make(
      dest: 'Narayanganj Depot',
      purpose: 'Pick up the customs file for the incoming bitumen cargo',
      depart: wall().add(const Duration(hours: 26)),
      pax: 1,
    ),
  );
  at(const Duration(hours: 1));
  FleetEngine.submit(
    store,
    emp,
    make(
      dest: 'Board secretariat',
      purpose: 'Deliver the monthly sales pack for the chairman’s briefing',
      depart: wall().add(const Duration(hours: 4)),
      priority: 'HIGH',
    ),
  );

  FleetEngine.seedClock = null;
}
