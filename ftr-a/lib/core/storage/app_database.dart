import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'app_database.g.dart';

/// Document-style storage for the mock backend: one row per record, JSON body.
/// The mock engines own the schema of `body`; this keeps drift migrations
/// trivial while the data still persists across app restarts.
class MockRecords extends Table {
  TextColumn get collection => text()();
  TextColumn get id => text()();
  TextColumn get body => text()();
  IntColumn get updatedAtMs => integer()();

  @override
  Set<Column<Object>> get primaryKey => {collection, id};
}

/// Persisted mutation queue for offline-capable actions (doc 05-F §5).
class Outbox extends Table {
  TextColumn get id => text()();
  TextColumn get method => text()();
  TextColumn get endpoint => text()();
  TextColumn get payload => text()();
  TextColumn get idempotencyKey => text()();

  /// `PENDING` | `SYNCING` | `FAILED` | `DONE`
  TextColumn get status => text().withDefault(const Constant('PENDING'))();
  IntColumn get attempts => integer().withDefault(const Constant(0))();
  TextColumn get lastError => text().nullable()();
  IntColumn get createdAtMs => integer()();

  /// Localised, human-readable description shown in the Outbox screen.
  TextColumn get label => text().withDefault(const Constant(''))();

  /// Earliest time (epoch ms) the next attempt may run (backoff).
  IntColumn get nextAttemptAtMs => integer().withDefault(const Constant(0))();

  @override
  Set<Column<Object>> get primaryKey => {id};
}

/// Small key/value store for mock metadata (seed version, demo "today" anchor).
class MockMeta extends Table {
  TextColumn get key => text()();
  TextColumn get value => text()();

  @override
  Set<Column<Object>> get primaryKey => {key};
}

@DriftDatabase(tables: [MockRecords, Outbox, MockMeta])
class AppDatabase extends _$AppDatabase {
  AppDatabase([QueryExecutor? executor])
    : super(executor ?? driftDatabase(name: 'bogcl_oneops'));

  @override
  int get schemaVersion => 2;

  @override
  MigrationStrategy get migration => MigrationStrategy(
    onCreate: (m) => m.createAll(),
    onUpgrade: (m, from, to) async {
      if (from < 2) {
        await m.addColumn(outbox, outbox.label);
        await m.addColumn(outbox, outbox.nextAttemptAtMs);
      }
    },
  );

  // --- Mock records ---

  Future<List<MockRecord>> recordsOf(String collection) => (select(
    mockRecords,
  )..where((t) => t.collection.equals(collection))).get();

  Future<MockRecord?> recordById(String collection, String id) =>
      (select(mockRecords)
            ..where((t) => t.collection.equals(collection) & t.id.equals(id)))
          .getSingleOrNull();

  Future<void> upsertRecord(
    String collection,
    String id,
    String body,
    int nowMs,
  ) => into(mockRecords).insertOnConflictUpdate(
    MockRecordsCompanion.insert(
      collection: collection,
      id: id,
      body: body,
      updatedAtMs: nowMs,
    ),
  );

  Future<int> deleteRecord(String collection, String id) => (delete(
    mockRecords,
  )..where((t) => t.collection.equals(collection) & t.id.equals(id))).go();

  /// Wipes all mock data (demo "reset data"). Keeps the outbox untouched.
  Future<void> clearMockData() async {
    await delete(mockRecords).go();
    await delete(mockMeta).go();
  }

  // --- Meta ---

  Future<String?> meta(String key) async {
    final row = await (select(
      mockMeta,
    )..where((t) => t.key.equals(key))).getSingleOrNull();
    return row?.value;
  }

  Future<void> setMeta(String key, String value) => into(mockMeta)
      .insertOnConflictUpdate(MockMetaCompanion.insert(key: key, value: value));

  // --- Outbox ---

  Stream<List<OutboxData>> watchOutbox() => (select(
    outbox,
  )..orderBy([(t) => OrderingTerm.asc(t.createdAtMs)])).watch();

  Future<List<OutboxData>> pendingOutbox() =>
      (select(outbox)
            ..where((t) => t.status.isIn(const ['PENDING', 'FAILED']))
            ..orderBy([(t) => OrderingTerm.asc(t.createdAtMs)]))
          .get();

  Future<void> enqueue(OutboxCompanion entry) => into(outbox).insert(entry);

  Future<void> updateOutbox(String id, OutboxCompanion patch) =>
      (update(outbox)..where((t) => t.id.equals(id))).write(patch);

  Future<OutboxData?> outboxById(String id) =>
      (select(outbox)..where((t) => t.id.equals(id))).getSingleOrNull();

  Future<int> deleteOutbox(String id) =>
      (delete(outbox)..where((t) => t.id.equals(id))).go();

  /// Items left `SYNCING` by an app kill are retried.
  Future<void> resetStuckOutbox() =>
      (update(outbox)..where((t) => t.status.equals('SYNCING'))).write(
        const OutboxCompanion(status: Value('PENDING')),
      );
}

@Riverpod(keepAlive: true)
AppDatabase appDatabase(Ref ref) {
  final db = AppDatabase();
  ref.onDispose(db.close);
  return db;
}
