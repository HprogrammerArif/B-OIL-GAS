// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'session_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Grant _$GrantFromJson(Map<String, dynamic> json) => _Grant(
  key: json['key'] as String,
  scope: json['scope'] as String,
  via: json['via'] as String?,
  maxAmount: json['maxAmount'] as String?,
);

Map<String, dynamic> _$GrantToJson(_Grant instance) => <String, dynamic>{
  'key': instance.key,
  'scope': instance.scope,
  'via': instance.via,
  'maxAmount': instance.maxAmount,
};

_RoleInfo _$RoleInfoFromJson(Map<String, dynamic> json) =>
    _RoleInfo(key: json['key'] as String, name: json['name'] as String);

Map<String, dynamic> _$RoleInfoToJson(_RoleInfo instance) => <String, dynamic>{
  'key': instance.key,
  'name': instance.name,
};

_Designation _$DesignationFromJson(Map<String, dynamic> json) => _Designation(
  title: json['title'] as String,
  titleBn: json['titleBn'] as String?,
);

Map<String, dynamic> _$DesignationToJson(_Designation instance) =>
    <String, dynamic>{'title': instance.title, 'titleBn': instance.titleBn};

_Grade _$GradeFromJson(Map<String, dynamic> json) =>
    _Grade(code: json['code'] as String, name: json['name'] as String);

Map<String, dynamic> _$GradeToJson(_Grade instance) => <String, dynamic>{
  'code': instance.code,
  'name': instance.name,
};

_OrgRef _$OrgRefFromJson(Map<String, dynamic> json) => _OrgRef(
  id: json['id'] as String,
  code: json['code'] as String,
  name: json['name'] as String,
  nameBn: json['nameBn'] as String?,
);

Map<String, dynamic> _$OrgRefToJson(_OrgRef instance) => <String, dynamic>{
  'id': instance.id,
  'code': instance.code,
  'name': instance.name,
  'nameBn': instance.nameBn,
};

_EmployeeProfile _$EmployeeProfileFromJson(Map<String, dynamic> json) =>
    _EmployeeProfile(
      id: json['id'] as String,
      empCode: json['empCode'] as String,
      fullName: json['fullName'] as String,
      designation: Designation.fromJson(
        json['designation'] as Map<String, dynamic>,
      ),
      grade: Grade.fromJson(json['grade'] as Map<String, dynamic>),
      department: OrgRef.fromJson(json['department'] as Map<String, dynamic>),
      site: OrgRef.fromJson(json['site'] as Map<String, dynamic>),
      fullNameBn: json['fullNameBn'] as String?,
      shortName: json['shortName'] as String?,
      shortNameBn: json['shortNameBn'] as String?,
      initials: json['initials'] as String?,
      avatarColor: json['avatarColor'] as String?,
      bloodGroup: json['bloodGroup'] as String?,
      photoFileId: json['photoFileId'] as String?,
      joinDate: json['joinDate'] as String?,
    );

Map<String, dynamic> _$EmployeeProfileToJson(_EmployeeProfile instance) =>
    <String, dynamic>{
      'id': instance.id,
      'empCode': instance.empCode,
      'fullName': instance.fullName,
      'designation': instance.designation,
      'grade': instance.grade,
      'department': instance.department,
      'site': instance.site,
      'fullNameBn': instance.fullNameBn,
      'shortName': instance.shortName,
      'shortNameBn': instance.shortNameBn,
      'initials': instance.initials,
      'avatarColor': instance.avatarColor,
      'bloodGroup': instance.bloodGroup,
      'photoFileId': instance.photoFileId,
      'joinDate': instance.joinDate,
    };

_Profile _$ProfileFromJson(Map<String, dynamic> json) => _Profile(
  id: json['id'] as String,
  email: json['email'] as String,
  phone: json['phone'] as String,
  preferredLang: json['preferredLang'] as String,
  roles: (json['roles'] as List<dynamic>)
      .map((e) => RoleInfo.fromJson(e as Map<String, dynamic>))
      .toList(),
  employee: EmployeeProfile.fromJson(json['employee'] as Map<String, dynamic>),
);

Map<String, dynamic> _$ProfileToJson(_Profile instance) => <String, dynamic>{
  'id': instance.id,
  'email': instance.email,
  'phone': instance.phone,
  'preferredLang': instance.preferredLang,
  'roles': instance.roles,
  'employee': instance.employee,
};
