import 'package:bogcl_oneops/mock/http.dart';
import 'package:bogcl_oneops/mock/router.dart';
import 'package:bogcl_oneops/mock/seed/org.dart';
import 'package:bogcl_oneops/mock/seed/rbac.dart';
import 'package:bogcl_oneops/mock/store.dart';

/// The caller context of a seeded persona (`EMP-xxxx`), so seed data can go
/// through the same engines as real requests.
AuthContext seedAuthFor(MockStore store, String code) {
  final user = store.get(Col.users, userIdFor(code))!;
  return AuthContext(
    user: user,
    employee: store.get(Col.employees, empId(code))!,
    session: const {},
    grants: grantsForRoles(user.strList('roles')),
  );
}
