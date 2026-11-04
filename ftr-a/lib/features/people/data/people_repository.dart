import 'package:bogcl_oneops/core/network/dio_client.dart';
import 'package:bogcl_oneops/core/network/envelope.dart';
import 'package:bogcl_oneops/core/network/interceptors.dart';
import 'package:bogcl_oneops/features/people/domain/person_pick.dart';
import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'people_repository.g.dart';

/// `/people`: the colleague picker (name, title, department, site only).
class PeopleRepository {
  PeopleRepository(this._dio);

  final Dio _dio;

  Future<List<PersonPick>> search(String query) async {
    try {
      final res = await _dio.get<Object?>(
        '/people',
        queryParameters: {'q': query, 'limit': 30},
      );
      final data = Envelope.data(res.data)! as List;
      return [
        for (final e in data)
          PersonPick.fromJson(Map<String, Object?>.from(e! as Map)),
      ];
    } on DioException catch (e) {
      throwApi(e);
    }
  }
}

@Riverpod(keepAlive: true)
PeopleRepository peopleRepository(Ref ref) =>
    PeopleRepository(ref.watch(dioProvider));
