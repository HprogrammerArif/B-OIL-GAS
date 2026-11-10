import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/storage/app_database.dart';
import 'package:bogcl_oneops/core/storage/blob_store.dart';
import 'package:bogcl_oneops/mock/engines/attendance_engine.dart';
import 'package:bogcl_oneops/mock/engines/claim_engine.dart';
import 'package:bogcl_oneops/mock/engines/file_access.dart';
import 'package:bogcl_oneops/mock/engines/file_engine.dart';
import 'package:bogcl_oneops/mock/engines/fleet_engine.dart';
import 'package:bogcl_oneops/mock/engines/leave_engine.dart';
import 'package:bogcl_oneops/mock/engines/note_sheet_engine.dart';
import 'package:bogcl_oneops/mock/mock_adapter.dart';
import 'package:bogcl_oneops/mock/mock_config.dart';
import 'package:bogcl_oneops/mock/seed/assets.dart';
import 'package:bogcl_oneops/mock/seed/attendance.dart';
import 'package:bogcl_oneops/mock/seed/audit.dart';
import 'package:bogcl_oneops/mock/seed/bus.dart';
import 'package:bogcl_oneops/mock/seed/chat.dart';
import 'package:bogcl_oneops/mock/seed/claims.dart';
import 'package:bogcl_oneops/mock/seed/fleet.dart';
import 'package:bogcl_oneops/mock/seed/home_ops.dart';
import 'package:bogcl_oneops/mock/seed/incidents.dart';
import 'package:bogcl_oneops/mock/seed/leave.dart';
import 'package:bogcl_oneops/mock/seed/licences.dart';
import 'package:bogcl_oneops/mock/seed/note_sheets.dart';
import 'package:bogcl_oneops/mock/seed/notices.dart';
import 'package:bogcl_oneops/mock/seed/notifications.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/seed/parcels.dart';
import 'package:bogcl_oneops/mock/seed/seed_photo.dart';
import 'package:bogcl_oneops/mock/seed/visitors.dart';
import 'package:bogcl_oneops/mock/seed/workflow.dart';
import 'package:bogcl_oneops/mock/seed/workforce.dart';
import 'package:bogcl_oneops/mock/server.dart';
import 'package:bogcl_oneops/mock/store.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'bootstrap.g.dart';

/// Seeders registered with the store. Each module adds its own here.
final List<Seeder> mockSeeders = [
  seedOrg,
  seedNotifications,
  seedAudit,
  seedWorkflowTemplates,
  seedLeave,
  seedAttendance,
  seedNotices,
  seedClaims,
  seedBus,
  seedNoteSheets,
  seedParcels,
  seedVisits,
  seedFleet,
  seedIncidents,
  seedAssets,
  seedLicences,
  seedWorkforce,
  seedChat,
  seedHomeOps,
];

/// The persisted mock store. Provided by [bootstrapMock] at startup.
@Riverpod(keepAlive: true)
MockStore mockStore(Ref ref) =>
    throw StateError('mockStoreProvider must be overridden by bootstrapMock');

/// Opens the database, loads or seeds the mock store, builds the server and
/// returns the root container with the mock transport wired in. The app runs
/// inside this container, so no real network is ever used.
///
/// [extraOverrides] receives a lazy getter for the returned container, for
/// wiring that needs `container.read` after start-up.
Future<ProviderContainer> bootstrapMock({
  List<Override> Function(ProviderContainer Function() container)?
  extraOverrides,
}) async {
  final db = AppDatabase();
  final store = MockStore(db, seeders: mockSeeders);
  await store.init();

  final blobs = DirectoryBlobStore();
  await writeMissingSeedPhotoBlobs(store, blobs);
  await FileEngine.sweepOrphans(store, blobs);
  // Profile photos are visible to every signed-in colleague.
  LeaveEngine.registerHooks();
  AttendanceEngine.registerHooks();
  ClaimEngine.registerHooks();
  NoteSheetEngine.registerHooks();
  FleetEngine.registerHooks();
  FileAccess.register();
  FileEngine.registerOwnerAccess('Employee', (_, _, _) => true);

  late final ProviderContainer container;
  final server = MockServer(
    store: store,
    blobs: blobs,
    config: () => container.read(mockConfigControllerProvider),
  );
  return container = ProviderContainer(
    overrides: [
      appDatabaseProvider.overrideWithValue(db),
      mockStoreProvider.overrideWithValue(store),
      blobStoreProvider.overrideWithValue(blobs),
      httpAdapterProvider.overrideWithValue(MockAdapter(server)),
      ...?extraOverrides?.call(() => container),
    ],
  );
}
