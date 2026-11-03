import 'dart:convert';

import 'package:bogcl_oneops/core/storage/app_database.dart';
import 'package:bogcl_oneops/core/utils/dates.dart';
import 'package:bogcl_oneops/mock/http.dart';

/// Seeds one slice of data. Each module/engine registers one.
typedef Seeder = void Function(MockStore store);

/// Bump when seed data changes shape: the store re-seeds on mismatch.
const mockSeedVersion = 8;

/// Persisted document store backing the mock server.
///
/// Reads are served from memory; writes are marked dirty and flushed to the
/// drift `MockRecords` table by [commit], so state survives app restarts.
class MockStore {
  MockStore(this._db, {required this.seeders});

  final AppDatabase _db;
  final List<Seeder> seeders;
  final Map<String, Map<String, Json>> _data = {};
  final Set<(String, String)> _dirty = {};
  final Set<(String, String)> _deleted = {};

  /// Loads persisted data, seeding when empty or the seed version changed.
  Future<void> init() async {
    final version = await _db.meta('seedVersion');
    if (version != '$mockSeedVersion') {
      await reset();
      return;
    }
    final rows = await _db.select(_db.mockRecords).get();
    for (final r in rows) {
      _data.putIfAbsent(r.collection, () => {})[r.id] =
          Map<String, Object?>.from(jsonDecode(r.body) as Map);
    }
  }

  /// Wipes everything and re-seeds (demo menu "reset data").
  Future<void> reset() async {
    await _db.clearMockData();
    _data.clear();
    _dirty.clear();
    _deleted.clear();
    for (final seed in seeders) {
      seed(this);
    }
    await commit();
    await _db.setMeta('seedVersion', '$mockSeedVersion');
  }

  /// Live map of `id -> record` for a collection.
  Map<String, Json> collection(String name) =>
      _data.putIfAbsent(name, () => {});

  List<Json> all(String name) => collection(name).values.toList();

  Json? get(String name, String id) => _data[name]?[id];

  /// Inserts or replaces a record (must carry a string `id`).
  void put(String name, Json record) {
    final id = record.str('id');
    collection(name)[id] = record;
    _dirty.add((name, id));
  }

  /// Marks a record changed after in-place mutation.
  void touch(String name, Json record) => put(name, record);

  void remove(String name, String id) {
    collection(name).remove(id);
    _dirty.remove((name, id));
    _deleted.add((name, id));
  }

  /// Flushes pending writes.
  Future<void> commit() async {
    final now = DateTime.now().millisecondsSinceEpoch;
    final dirty = [..._dirty];
    final deleted = [..._deleted];
    _dirty.clear();
    _deleted.clear();
    for (final (name, id) in dirty) {
      final rec = _data[name]?[id];
      if (rec == null) continue;
      await _db.upsertRecord(name, id, jsonEncode(rec), now);
    }
    for (final (name, id) in deleted) {
      await _db.deleteRecord(name, id);
    }
  }

  /// Current instant as ISO-8601 UTC (honours the demo "today" anchor).
  String nowIso() => Dhaka.toWire(Dhaka.clock());

  int nowMs() => Dhaka.clock().millisecondsSinceEpoch;
}
