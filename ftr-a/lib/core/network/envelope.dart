import 'package:flutter/foundation.dart';

/// Pagination metadata (doc 03 §1.4).
@immutable
class PageMeta {
  const PageMeta({
    required this.page,
    required this.pageSize,
    required this.total,
    this.sort,
    this.requestId,
  });

  factory PageMeta.fromJson(Map<String, Object?> json) => PageMeta(
    page: (json['page'] as num?)?.toInt() ?? 1,
    pageSize: (json['pageSize'] as num?)?.toInt() ?? 20,
    total: (json['total'] as num?)?.toInt() ?? 0,
    sort: json['sort'] as String?,
    requestId: json['requestId'] as String?,
  );

  final int page;
  final int pageSize;
  final int total;
  final String? sort;
  final String? requestId;

  bool get hasMore => page * pageSize < total;
}

/// A page of items with its metadata.
@immutable
class Paged<T> {
  const Paged({required this.items, required this.meta});

  final List<T> items;
  final PageMeta meta;
}

/// A page of an append-only stream (cursor pagination, doc 03 §1.4).
@immutable
class CursorPage<T> {
  const CursorPage({required this.items, required this.nextCursor});

  final List<T> items;

  /// Null when there are no more items.
  final String? nextCursor;

  bool get hasMore => nextCursor != null;
}

/// Helpers to unwrap the `{data, meta}` success envelope.
abstract final class Envelope {
  /// Single object response.
  static Map<String, Object?> object(Object? body) {
    final data = _data(body);
    if (data is Map) return Map<String, Object?>.from(data);
    throw const FormatException('Expected an object in `data`');
  }

  /// Raw `data` value (object, list or scalar).
  static Object? data(Object? body) => _data(body);

  /// Cursor-paginated list response.
  static CursorPage<T> cursorPage<T>(
    Object? body,
    T Function(Map<String, Object?> json) fromJson,
  ) {
    final data = _data(body);
    if (data is! List) throw const FormatException('Expected a list in `data`');
    final meta = body is Map && body['meta'] is Map
        ? Map<String, Object?>.from(body['meta']! as Map)
        : const <String, Object?>{};
    return CursorPage(
      items: [
        for (final e in data) fromJson(Map<String, Object?>.from(e as Map)),
      ],
      nextCursor: meta['nextCursor'] as String?,
    );
  }

  /// Paginated list response.
  static Paged<T> page<T>(
    Object? body,
    T Function(Map<String, Object?> json) fromJson,
  ) {
    final data = _data(body);
    if (data is! List) throw const FormatException('Expected a list in `data`');
    final meta = body is Map && body['meta'] is Map
        ? PageMeta.fromJson(Map<String, Object?>.from(body['meta']! as Map))
        : PageMeta(page: 1, pageSize: data.length, total: data.length);
    return Paged(
      items: [
        for (final e in data) fromJson(Map<String, Object?>.from(e as Map)),
      ],
      meta: meta,
    );
  }

  static Object? _data(Object? body) {
    if (body is Map && body.containsKey('data')) return body['data'];
    throw const FormatException('Missing `data` in response envelope');
  }

  /// Builds a success envelope (used by the mock server).
  static Map<String, Object?> ok(Object? data, {String? requestId}) => {
    'data': data,
    'meta': {'requestId': ?requestId},
  };

  /// Builds a list envelope (used by the mock server).
  static Map<String, Object?> list(
    List<Object?> data, {
    required int page,
    required int pageSize,
    required int total,
    String? sort,
    String? requestId,
  }) => {
    'data': data,
    'meta': {
      'page': page,
      'pageSize': pageSize,
      'total': total,
      'sort': ?sort,
      'requestId': ?requestId,
    },
  };
}
