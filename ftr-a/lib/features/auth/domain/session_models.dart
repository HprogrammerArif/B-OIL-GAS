import 'package:freezed_annotation/freezed_annotation.dart';

part 'session_models.freezed.dart';
part 'session_models.g.dart';

/// Grant scope, narrowest to widest.
enum GrantScope { self, team, department, site, company }

@freezed
abstract class Grant with _$Grant {
  const factory Grant({
    required String key,
    required String scope,
    String? via,
    String? maxAmount,
  }) = _Grant;

  factory Grant.fromJson(Map<String, Object?> json) => _$GrantFromJson(json);
}

@freezed
abstract class RoleInfo with _$RoleInfo {
  const factory RoleInfo({required String key, required String name}) =
      _RoleInfo;

  factory RoleInfo.fromJson(Map<String, Object?> json) =>
      _$RoleInfoFromJson(json);
}

@freezed
abstract class Designation with _$Designation {
  const factory Designation({required String title, String? titleBn}) =
      _Designation;

  factory Designation.fromJson(Map<String, Object?> json) =>
      _$DesignationFromJson(json);
}

@freezed
abstract class Grade with _$Grade {
  const factory Grade({required String code, required String name}) = _Grade;

  factory Grade.fromJson(Map<String, Object?> json) => _$GradeFromJson(json);
}

/// Department or site reference.
@freezed
abstract class OrgRef with _$OrgRef {
  const factory OrgRef({
    required String id,
    required String code,
    required String name,
    String? nameBn,
  }) = _OrgRef;

  factory OrgRef.fromJson(Map<String, Object?> json) => _$OrgRefFromJson(json);
}

@freezed
abstract class EmployeeProfile with _$EmployeeProfile {
  const factory EmployeeProfile({
    required String id,
    required String empCode,
    required String fullName,
    required Designation designation,
    required Grade grade,
    required OrgRef department,
    required OrgRef site,
    String? fullNameBn,
    String? shortName,
    String? shortNameBn,
    String? initials,
    String? avatarColor,
    String? bloodGroup,
    String? photoFileId,
    String? joinDate,
  }) = _EmployeeProfile;

  factory EmployeeProfile.fromJson(Map<String, Object?> json) =>
      _$EmployeeProfileFromJson(json);
}

@freezed
abstract class Profile with _$Profile {
  const factory Profile({
    required String id,
    required String email,
    required String phone,
    required String preferredLang,
    required List<RoleInfo> roles,
    required EmployeeProfile employee,
  }) = _Profile;

  factory Profile.fromJson(Map<String, Object?> json) =>
      _$ProfileFromJson(json);
}

/// Home layout variant (doc 05 §10), derived from roles.
enum HomeVariant { executive, approver, driver, operations, employee }

/// Signed-in user with resolved permissions.
@immutable
class Session {
  const Session({
    required this.profile,
    required this.grants,
    required this.navigation,
  });

  final Profile profile;
  final List<Grant> grants;

  /// Module keys the shell may show (derived server-side).
  final List<String> navigation;

  Set<String> get roleKeys => {for (final r in profile.roles) r.key};

  bool hasRole(String key) => roleKeys.contains(key);

  Grant? grant(String key) {
    for (final g in grants) {
      if (g.key == key) return g;
    }
    return null;
  }

  bool can(String key, [GrantScope atLeast = GrantScope.self]) {
    final g = grant(key);
    if (g == null) return false;
    return scopeOf(g).index >= atLeast.index;
  }

  static GrantScope scopeOf(Grant g) => GrantScope.values.firstWhere(
    (s) => s.name.toUpperCase() == g.scope,
    orElse: () => GrantScope.self,
  );

  HomeVariant get homeVariant {
    if (hasRole('DRIVER')) return HomeVariant.driver;
    if (hasRole('CHAIRMAN')) return HomeVariant.executive;
    if (hasRole('PLANT_GM') || hasRole('HOD') || hasRole('HR_ADMIN')) {
      return HomeVariant.approver;
    }
    if (hasRole('TRANSPORT_ADMIN') ||
        hasRole('SECURITY_GATE') ||
        hasRole('MAILROOM') ||
        hasRole('HSE_OFFICER')) {
      return HomeVariant.operations;
    }
    return HomeVariant.employee;
  }

  /// Chat sits on the tab bar for leadership & operations (not Employee or Driver).
  bool get showChatTab {
    if (homeVariant == HomeVariant.employee ||
        homeVariant == HomeVariant.driver) {
      return false;
    }
    return can('chat:use');
  }
}
