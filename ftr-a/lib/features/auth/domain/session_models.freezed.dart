// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint, type=warning, deprecated_member_use, deprecated_member_use_from_same_package
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'session_models.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Grant {

 String get key; String get scope; String? get via; String? get maxAmount;
/// Create a copy of Grant
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$GrantCopyWith<Grant> get copyWith => _$GrantCopyWithImpl<Grant>(this as Grant, _$identity);

  /// Serializes this Grant to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as Grant;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Grant&&(identical(other.key, _this.key) || other.key == _this.key)&&(identical(other.scope, _this.scope) || other.scope == _this.scope)&&(identical(other.via, _this.via) || other.via == _this.via)&&(identical(other.maxAmount, _this.maxAmount) || other.maxAmount == _this.maxAmount));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as Grant;
  return Object.hash(runtimeType,_this.key,_this.scope,_this.via,_this.maxAmount);
}

@override
String toString() {
  final _this = this as Grant;
  return 'Grant(key: ${_this.key}, scope: ${_this.scope}, via: ${_this.via}, maxAmount: ${_this.maxAmount})';
}


}

/// @nodoc
abstract mixin class $GrantCopyWith<$Res>  {
  factory $GrantCopyWith(Grant value, $Res Function(Grant) _then) = _$GrantCopyWithImpl;
@useResult
$Res call({
 String key, String scope, String? via, String? maxAmount
});




}
/// @nodoc
class _$GrantCopyWithImpl<$Res>
    implements $GrantCopyWith<$Res> {
  _$GrantCopyWithImpl(this._self, this._then);

  final Grant _self;
  final $Res Function(Grant) _then;

/// Create a copy of Grant
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? key = null,Object? scope = null,Object? via = freezed,Object? maxAmount = freezed,}) {
  return _then(Grant(
key: null == key ? _self.key : key // ignore: cast_nullable_to_non_nullable
as String,scope: null == scope ? _self.scope : scope // ignore: cast_nullable_to_non_nullable
as String,via: freezed == via ? _self.via : via // ignore: cast_nullable_to_non_nullable
as String?,maxAmount: freezed == maxAmount ? _self.maxAmount : maxAmount // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [Grant].
extension GrantPatterns on Grant {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Grant value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Grant() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Grant value)  $default,){
final _that = this;
switch (_that) {
case _Grant():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Grant value)?  $default,){
final _that = this;
switch (_that) {
case _Grant() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String key,  String scope,  String? via,  String? maxAmount)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Grant() when $default != null:
return $default(_that.key,_that.scope,_that.via,_that.maxAmount);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String key,  String scope,  String? via,  String? maxAmount)  $default,) {final _that = this;
switch (_that) {
case _Grant():
return $default(_that.key,_that.scope,_that.via,_that.maxAmount);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String key,  String scope,  String? via,  String? maxAmount)?  $default,) {final _that = this;
switch (_that) {
case _Grant() when $default != null:
return $default(_that.key,_that.scope,_that.via,_that.maxAmount);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Grant implements Grant {
  const _Grant({required this.key, required this.scope, this.via, this.maxAmount});
  factory _Grant.fromJson(Map<String, dynamic> json) => _$GrantFromJson(json);

@override final  String key;
@override final  String scope;
@override final  String? via;
@override final  String? maxAmount;

/// Create a copy of Grant
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$GrantCopyWith<_Grant> get copyWith => __$GrantCopyWithImpl<_Grant>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$GrantToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _Grant&&(identical(other.key, key) || other.key == key)&&(identical(other.scope, scope) || other.scope == scope)&&(identical(other.via, via) || other.via == via)&&(identical(other.maxAmount, maxAmount) || other.maxAmount == maxAmount));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,key,scope,via,maxAmount);
}

@override
String toString() {
    return 'Grant(key: $key, scope: $scope, via: $via, maxAmount: $maxAmount)';
}


}

/// @nodoc
abstract mixin class _$GrantCopyWith<$Res> implements $GrantCopyWith<$Res> {
  factory _$GrantCopyWith(_Grant value, $Res Function(_Grant) _then) = __$GrantCopyWithImpl;
@override @useResult
$Res call({
 String key, String scope, String? via, String? maxAmount
});




}
/// @nodoc
class __$GrantCopyWithImpl<$Res>
    implements _$GrantCopyWith<$Res> {
  __$GrantCopyWithImpl(this._self, this._then);

  final _Grant _self;
  final $Res Function(_Grant) _then;

/// Create a copy of Grant
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? key = null,Object? scope = null,Object? via = freezed,Object? maxAmount = freezed,}) {
  return _then(_Grant(
key: null == key ? _self.key : key // ignore: cast_nullable_to_non_nullable
as String,scope: null == scope ? _self.scope : scope // ignore: cast_nullable_to_non_nullable
as String,via: freezed == via ? _self.via : via // ignore: cast_nullable_to_non_nullable
as String?,maxAmount: freezed == maxAmount ? _self.maxAmount : maxAmount // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$RoleInfo {

 String get key; String get name;
/// Create a copy of RoleInfo
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$RoleInfoCopyWith<RoleInfo> get copyWith => _$RoleInfoCopyWithImpl<RoleInfo>(this as RoleInfo, _$identity);

  /// Serializes this RoleInfo to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as RoleInfo;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is RoleInfo&&(identical(other.key, _this.key) || other.key == _this.key)&&(identical(other.name, _this.name) || other.name == _this.name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as RoleInfo;
  return Object.hash(runtimeType,_this.key,_this.name);
}

@override
String toString() {
  final _this = this as RoleInfo;
  return 'RoleInfo(key: ${_this.key}, name: ${_this.name})';
}


}

/// @nodoc
abstract mixin class $RoleInfoCopyWith<$Res>  {
  factory $RoleInfoCopyWith(RoleInfo value, $Res Function(RoleInfo) _then) = _$RoleInfoCopyWithImpl;
@useResult
$Res call({
 String key, String name
});




}
/// @nodoc
class _$RoleInfoCopyWithImpl<$Res>
    implements $RoleInfoCopyWith<$Res> {
  _$RoleInfoCopyWithImpl(this._self, this._then);

  final RoleInfo _self;
  final $Res Function(RoleInfo) _then;

/// Create a copy of RoleInfo
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? key = null,Object? name = null,}) {
  return _then(RoleInfo(
key: null == key ? _self.key : key // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [RoleInfo].
extension RoleInfoPatterns on RoleInfo {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _RoleInfo value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _RoleInfo() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _RoleInfo value)  $default,){
final _that = this;
switch (_that) {
case _RoleInfo():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _RoleInfo value)?  $default,){
final _that = this;
switch (_that) {
case _RoleInfo() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String key,  String name)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _RoleInfo() when $default != null:
return $default(_that.key,_that.name);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String key,  String name)  $default,) {final _that = this;
switch (_that) {
case _RoleInfo():
return $default(_that.key,_that.name);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String key,  String name)?  $default,) {final _that = this;
switch (_that) {
case _RoleInfo() when $default != null:
return $default(_that.key,_that.name);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _RoleInfo implements RoleInfo {
  const _RoleInfo({required this.key, required this.name});
  factory _RoleInfo.fromJson(Map<String, dynamic> json) => _$RoleInfoFromJson(json);

@override final  String key;
@override final  String name;

/// Create a copy of RoleInfo
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$RoleInfoCopyWith<_RoleInfo> get copyWith => __$RoleInfoCopyWithImpl<_RoleInfo>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$RoleInfoToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _RoleInfo&&(identical(other.key, key) || other.key == key)&&(identical(other.name, name) || other.name == name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,key,name);
}

@override
String toString() {
    return 'RoleInfo(key: $key, name: $name)';
}


}

/// @nodoc
abstract mixin class _$RoleInfoCopyWith<$Res> implements $RoleInfoCopyWith<$Res> {
  factory _$RoleInfoCopyWith(_RoleInfo value, $Res Function(_RoleInfo) _then) = __$RoleInfoCopyWithImpl;
@override @useResult
$Res call({
 String key, String name
});




}
/// @nodoc
class __$RoleInfoCopyWithImpl<$Res>
    implements _$RoleInfoCopyWith<$Res> {
  __$RoleInfoCopyWithImpl(this._self, this._then);

  final _RoleInfo _self;
  final $Res Function(_RoleInfo) _then;

/// Create a copy of RoleInfo
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? key = null,Object? name = null,}) {
  return _then(_RoleInfo(
key: null == key ? _self.key : key // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$Designation {

 String get title; String? get titleBn;
/// Create a copy of Designation
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$DesignationCopyWith<Designation> get copyWith => _$DesignationCopyWithImpl<Designation>(this as Designation, _$identity);

  /// Serializes this Designation to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as Designation;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Designation&&(identical(other.title, _this.title) || other.title == _this.title)&&(identical(other.titleBn, _this.titleBn) || other.titleBn == _this.titleBn));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as Designation;
  return Object.hash(runtimeType,_this.title,_this.titleBn);
}

@override
String toString() {
  final _this = this as Designation;
  return 'Designation(title: ${_this.title}, titleBn: ${_this.titleBn})';
}


}

/// @nodoc
abstract mixin class $DesignationCopyWith<$Res>  {
  factory $DesignationCopyWith(Designation value, $Res Function(Designation) _then) = _$DesignationCopyWithImpl;
@useResult
$Res call({
 String title, String? titleBn
});




}
/// @nodoc
class _$DesignationCopyWithImpl<$Res>
    implements $DesignationCopyWith<$Res> {
  _$DesignationCopyWithImpl(this._self, this._then);

  final Designation _self;
  final $Res Function(Designation) _then;

/// Create a copy of Designation
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? title = null,Object? titleBn = freezed,}) {
  return _then(Designation(
title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,titleBn: freezed == titleBn ? _self.titleBn : titleBn // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [Designation].
extension DesignationPatterns on Designation {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Designation value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Designation() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Designation value)  $default,){
final _that = this;
switch (_that) {
case _Designation():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Designation value)?  $default,){
final _that = this;
switch (_that) {
case _Designation() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String title,  String? titleBn)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Designation() when $default != null:
return $default(_that.title,_that.titleBn);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String title,  String? titleBn)  $default,) {final _that = this;
switch (_that) {
case _Designation():
return $default(_that.title,_that.titleBn);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String title,  String? titleBn)?  $default,) {final _that = this;
switch (_that) {
case _Designation() when $default != null:
return $default(_that.title,_that.titleBn);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Designation implements Designation {
  const _Designation({required this.title, this.titleBn});
  factory _Designation.fromJson(Map<String, dynamic> json) => _$DesignationFromJson(json);

@override final  String title;
@override final  String? titleBn;

/// Create a copy of Designation
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$DesignationCopyWith<_Designation> get copyWith => __$DesignationCopyWithImpl<_Designation>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$DesignationToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _Designation&&(identical(other.title, title) || other.title == title)&&(identical(other.titleBn, titleBn) || other.titleBn == titleBn));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,title,titleBn);
}

@override
String toString() {
    return 'Designation(title: $title, titleBn: $titleBn)';
}


}

/// @nodoc
abstract mixin class _$DesignationCopyWith<$Res> implements $DesignationCopyWith<$Res> {
  factory _$DesignationCopyWith(_Designation value, $Res Function(_Designation) _then) = __$DesignationCopyWithImpl;
@override @useResult
$Res call({
 String title, String? titleBn
});




}
/// @nodoc
class __$DesignationCopyWithImpl<$Res>
    implements _$DesignationCopyWith<$Res> {
  __$DesignationCopyWithImpl(this._self, this._then);

  final _Designation _self;
  final $Res Function(_Designation) _then;

/// Create a copy of Designation
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? title = null,Object? titleBn = freezed,}) {
  return _then(_Designation(
title: null == title ? _self.title : title // ignore: cast_nullable_to_non_nullable
as String,titleBn: freezed == titleBn ? _self.titleBn : titleBn // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$Grade {

 String get code; String get name;
/// Create a copy of Grade
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$GradeCopyWith<Grade> get copyWith => _$GradeCopyWithImpl<Grade>(this as Grade, _$identity);

  /// Serializes this Grade to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as Grade;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Grade&&(identical(other.code, _this.code) || other.code == _this.code)&&(identical(other.name, _this.name) || other.name == _this.name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as Grade;
  return Object.hash(runtimeType,_this.code,_this.name);
}

@override
String toString() {
  final _this = this as Grade;
  return 'Grade(code: ${_this.code}, name: ${_this.name})';
}


}

/// @nodoc
abstract mixin class $GradeCopyWith<$Res>  {
  factory $GradeCopyWith(Grade value, $Res Function(Grade) _then) = _$GradeCopyWithImpl;
@useResult
$Res call({
 String code, String name
});




}
/// @nodoc
class _$GradeCopyWithImpl<$Res>
    implements $GradeCopyWith<$Res> {
  _$GradeCopyWithImpl(this._self, this._then);

  final Grade _self;
  final $Res Function(Grade) _then;

/// Create a copy of Grade
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? code = null,Object? name = null,}) {
  return _then(Grade(
code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [Grade].
extension GradePatterns on Grade {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Grade value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Grade() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Grade value)  $default,){
final _that = this;
switch (_that) {
case _Grade():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Grade value)?  $default,){
final _that = this;
switch (_that) {
case _Grade() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String code,  String name)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Grade() when $default != null:
return $default(_that.code,_that.name);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String code,  String name)  $default,) {final _that = this;
switch (_that) {
case _Grade():
return $default(_that.code,_that.name);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String code,  String name)?  $default,) {final _that = this;
switch (_that) {
case _Grade() when $default != null:
return $default(_that.code,_that.name);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Grade implements Grade {
  const _Grade({required this.code, required this.name});
  factory _Grade.fromJson(Map<String, dynamic> json) => _$GradeFromJson(json);

@override final  String code;
@override final  String name;

/// Create a copy of Grade
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$GradeCopyWith<_Grade> get copyWith => __$GradeCopyWithImpl<_Grade>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$GradeToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _Grade&&(identical(other.code, code) || other.code == code)&&(identical(other.name, name) || other.name == name));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,code,name);
}

@override
String toString() {
    return 'Grade(code: $code, name: $name)';
}


}

/// @nodoc
abstract mixin class _$GradeCopyWith<$Res> implements $GradeCopyWith<$Res> {
  factory _$GradeCopyWith(_Grade value, $Res Function(_Grade) _then) = __$GradeCopyWithImpl;
@override @useResult
$Res call({
 String code, String name
});




}
/// @nodoc
class __$GradeCopyWithImpl<$Res>
    implements _$GradeCopyWith<$Res> {
  __$GradeCopyWithImpl(this._self, this._then);

  final _Grade _self;
  final $Res Function(_Grade) _then;

/// Create a copy of Grade
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? code = null,Object? name = null,}) {
  return _then(_Grade(
code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}


/// @nodoc
mixin _$OrgRef {

 String get id; String get code; String get name; String? get nameBn;
/// Create a copy of OrgRef
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$OrgRefCopyWith<OrgRef> get copyWith => _$OrgRefCopyWithImpl<OrgRef>(this as OrgRef, _$identity);

  /// Serializes this OrgRef to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as OrgRef;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is OrgRef&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.code, _this.code) || other.code == _this.code)&&(identical(other.name, _this.name) || other.name == _this.name)&&(identical(other.nameBn, _this.nameBn) || other.nameBn == _this.nameBn));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as OrgRef;
  return Object.hash(runtimeType,_this.id,_this.code,_this.name,_this.nameBn);
}

@override
String toString() {
  final _this = this as OrgRef;
  return 'OrgRef(id: ${_this.id}, code: ${_this.code}, name: ${_this.name}, nameBn: ${_this.nameBn})';
}


}

/// @nodoc
abstract mixin class $OrgRefCopyWith<$Res>  {
  factory $OrgRefCopyWith(OrgRef value, $Res Function(OrgRef) _then) = _$OrgRefCopyWithImpl;
@useResult
$Res call({
 String id, String code, String name, String? nameBn
});




}
/// @nodoc
class _$OrgRefCopyWithImpl<$Res>
    implements $OrgRefCopyWith<$Res> {
  _$OrgRefCopyWithImpl(this._self, this._then);

  final OrgRef _self;
  final $Res Function(OrgRef) _then;

/// Create a copy of OrgRef
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? code = null,Object? name = null,Object? nameBn = freezed,}) {
  return _then(OrgRef(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,nameBn: freezed == nameBn ? _self.nameBn : nameBn // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [OrgRef].
extension OrgRefPatterns on OrgRef {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _OrgRef value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _OrgRef() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _OrgRef value)  $default,){
final _that = this;
switch (_that) {
case _OrgRef():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _OrgRef value)?  $default,){
final _that = this;
switch (_that) {
case _OrgRef() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String code,  String name,  String? nameBn)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _OrgRef() when $default != null:
return $default(_that.id,_that.code,_that.name,_that.nameBn);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String code,  String name,  String? nameBn)  $default,) {final _that = this;
switch (_that) {
case _OrgRef():
return $default(_that.id,_that.code,_that.name,_that.nameBn);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String code,  String name,  String? nameBn)?  $default,) {final _that = this;
switch (_that) {
case _OrgRef() when $default != null:
return $default(_that.id,_that.code,_that.name,_that.nameBn);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _OrgRef implements OrgRef {
  const _OrgRef({required this.id, required this.code, required this.name, this.nameBn});
  factory _OrgRef.fromJson(Map<String, dynamic> json) => _$OrgRefFromJson(json);

@override final  String id;
@override final  String code;
@override final  String name;
@override final  String? nameBn;

/// Create a copy of OrgRef
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$OrgRefCopyWith<_OrgRef> get copyWith => __$OrgRefCopyWithImpl<_OrgRef>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$OrgRefToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _OrgRef&&(identical(other.id, id) || other.id == id)&&(identical(other.code, code) || other.code == code)&&(identical(other.name, name) || other.name == name)&&(identical(other.nameBn, nameBn) || other.nameBn == nameBn));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,code,name,nameBn);
}

@override
String toString() {
    return 'OrgRef(id: $id, code: $code, name: $name, nameBn: $nameBn)';
}


}

/// @nodoc
abstract mixin class _$OrgRefCopyWith<$Res> implements $OrgRefCopyWith<$Res> {
  factory _$OrgRefCopyWith(_OrgRef value, $Res Function(_OrgRef) _then) = __$OrgRefCopyWithImpl;
@override @useResult
$Res call({
 String id, String code, String name, String? nameBn
});




}
/// @nodoc
class __$OrgRefCopyWithImpl<$Res>
    implements _$OrgRefCopyWith<$Res> {
  __$OrgRefCopyWithImpl(this._self, this._then);

  final _OrgRef _self;
  final $Res Function(_OrgRef) _then;

/// Create a copy of OrgRef
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? code = null,Object? name = null,Object? nameBn = freezed,}) {
  return _then(_OrgRef(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,code: null == code ? _self.code : code // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,nameBn: freezed == nameBn ? _self.nameBn : nameBn // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}


/// @nodoc
mixin _$EmployeeProfile {

 String get id; String get empCode; String get fullName; Designation get designation; Grade get grade; OrgRef get department; OrgRef get site; String? get fullNameBn; String? get shortName; String? get shortNameBn; String? get initials; String? get avatarColor; String? get bloodGroup; String? get joinDate;
/// Create a copy of EmployeeProfile
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$EmployeeProfileCopyWith<EmployeeProfile> get copyWith => _$EmployeeProfileCopyWithImpl<EmployeeProfile>(this as EmployeeProfile, _$identity);

  /// Serializes this EmployeeProfile to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as EmployeeProfile;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is EmployeeProfile&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.empCode, _this.empCode) || other.empCode == _this.empCode)&&(identical(other.fullName, _this.fullName) || other.fullName == _this.fullName)&&(identical(other.designation, _this.designation) || other.designation == _this.designation)&&(identical(other.grade, _this.grade) || other.grade == _this.grade)&&(identical(other.department, _this.department) || other.department == _this.department)&&(identical(other.site, _this.site) || other.site == _this.site)&&(identical(other.fullNameBn, _this.fullNameBn) || other.fullNameBn == _this.fullNameBn)&&(identical(other.shortName, _this.shortName) || other.shortName == _this.shortName)&&(identical(other.shortNameBn, _this.shortNameBn) || other.shortNameBn == _this.shortNameBn)&&(identical(other.initials, _this.initials) || other.initials == _this.initials)&&(identical(other.avatarColor, _this.avatarColor) || other.avatarColor == _this.avatarColor)&&(identical(other.bloodGroup, _this.bloodGroup) || other.bloodGroup == _this.bloodGroup)&&(identical(other.joinDate, _this.joinDate) || other.joinDate == _this.joinDate));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as EmployeeProfile;
  return Object.hash(runtimeType,_this.id,_this.empCode,_this.fullName,_this.designation,_this.grade,_this.department,_this.site,_this.fullNameBn,_this.shortName,_this.shortNameBn,_this.initials,_this.avatarColor,_this.bloodGroup,_this.joinDate);
}

@override
String toString() {
  final _this = this as EmployeeProfile;
  return 'EmployeeProfile(id: ${_this.id}, empCode: ${_this.empCode}, fullName: ${_this.fullName}, designation: ${_this.designation}, grade: ${_this.grade}, department: ${_this.department}, site: ${_this.site}, fullNameBn: ${_this.fullNameBn}, shortName: ${_this.shortName}, shortNameBn: ${_this.shortNameBn}, initials: ${_this.initials}, avatarColor: ${_this.avatarColor}, bloodGroup: ${_this.bloodGroup}, joinDate: ${_this.joinDate})';
}


}

/// @nodoc
abstract mixin class $EmployeeProfileCopyWith<$Res>  {
  factory $EmployeeProfileCopyWith(EmployeeProfile value, $Res Function(EmployeeProfile) _then) = _$EmployeeProfileCopyWithImpl;
@useResult
$Res call({
 String id, String empCode, String fullName, Designation designation, Grade grade, OrgRef department, OrgRef site, String? fullNameBn, String? shortName, String? shortNameBn, String? initials, String? avatarColor, String? bloodGroup, String? joinDate
});


$DesignationCopyWith<$Res> get designation;$GradeCopyWith<$Res> get grade;$OrgRefCopyWith<$Res> get department;$OrgRefCopyWith<$Res> get site;

}
/// @nodoc
class _$EmployeeProfileCopyWithImpl<$Res>
    implements $EmployeeProfileCopyWith<$Res> {
  _$EmployeeProfileCopyWithImpl(this._self, this._then);

  final EmployeeProfile _self;
  final $Res Function(EmployeeProfile) _then;

/// Create a copy of EmployeeProfile
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? empCode = null,Object? fullName = null,Object? designation = null,Object? grade = null,Object? department = null,Object? site = null,Object? fullNameBn = freezed,Object? shortName = freezed,Object? shortNameBn = freezed,Object? initials = freezed,Object? avatarColor = freezed,Object? bloodGroup = freezed,Object? joinDate = freezed,}) {
  return _then(EmployeeProfile(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,empCode: null == empCode ? _self.empCode : empCode // ignore: cast_nullable_to_non_nullable
as String,fullName: null == fullName ? _self.fullName : fullName // ignore: cast_nullable_to_non_nullable
as String,designation: null == designation ? _self.designation : designation // ignore: cast_nullable_to_non_nullable
as Designation,grade: null == grade ? _self.grade : grade // ignore: cast_nullable_to_non_nullable
as Grade,department: null == department ? _self.department : department // ignore: cast_nullable_to_non_nullable
as OrgRef,site: null == site ? _self.site : site // ignore: cast_nullable_to_non_nullable
as OrgRef,fullNameBn: freezed == fullNameBn ? _self.fullNameBn : fullNameBn // ignore: cast_nullable_to_non_nullable
as String?,shortName: freezed == shortName ? _self.shortName : shortName // ignore: cast_nullable_to_non_nullable
as String?,shortNameBn: freezed == shortNameBn ? _self.shortNameBn : shortNameBn // ignore: cast_nullable_to_non_nullable
as String?,initials: freezed == initials ? _self.initials : initials // ignore: cast_nullable_to_non_nullable
as String?,avatarColor: freezed == avatarColor ? _self.avatarColor : avatarColor // ignore: cast_nullable_to_non_nullable
as String?,bloodGroup: freezed == bloodGroup ? _self.bloodGroup : bloodGroup // ignore: cast_nullable_to_non_nullable
as String?,joinDate: freezed == joinDate ? _self.joinDate : joinDate // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}
/// Create a copy of EmployeeProfile
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DesignationCopyWith<$Res> get designation {
  
  return $DesignationCopyWith<$Res>(_self.designation, (value) {
    return _then(_self.copyWith(designation: value));
  });
}/// Create a copy of EmployeeProfile
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$GradeCopyWith<$Res> get grade {
  
  return $GradeCopyWith<$Res>(_self.grade, (value) {
    return _then(_self.copyWith(grade: value));
  });
}/// Create a copy of EmployeeProfile
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OrgRefCopyWith<$Res> get department {
  
  return $OrgRefCopyWith<$Res>(_self.department, (value) {
    return _then(_self.copyWith(department: value));
  });
}/// Create a copy of EmployeeProfile
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OrgRefCopyWith<$Res> get site {
  
  return $OrgRefCopyWith<$Res>(_self.site, (value) {
    return _then(_self.copyWith(site: value));
  });
}
}


/// Adds pattern-matching-related methods to [EmployeeProfile].
extension EmployeeProfilePatterns on EmployeeProfile {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _EmployeeProfile value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _EmployeeProfile() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _EmployeeProfile value)  $default,){
final _that = this;
switch (_that) {
case _EmployeeProfile():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _EmployeeProfile value)?  $default,){
final _that = this;
switch (_that) {
case _EmployeeProfile() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String empCode,  String fullName,  Designation designation,  Grade grade,  OrgRef department,  OrgRef site,  String? fullNameBn,  String? shortName,  String? shortNameBn,  String? initials,  String? avatarColor,  String? bloodGroup,  String? joinDate)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _EmployeeProfile() when $default != null:
return $default(_that.id,_that.empCode,_that.fullName,_that.designation,_that.grade,_that.department,_that.site,_that.fullNameBn,_that.shortName,_that.shortNameBn,_that.initials,_that.avatarColor,_that.bloodGroup,_that.joinDate);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String empCode,  String fullName,  Designation designation,  Grade grade,  OrgRef department,  OrgRef site,  String? fullNameBn,  String? shortName,  String? shortNameBn,  String? initials,  String? avatarColor,  String? bloodGroup,  String? joinDate)  $default,) {final _that = this;
switch (_that) {
case _EmployeeProfile():
return $default(_that.id,_that.empCode,_that.fullName,_that.designation,_that.grade,_that.department,_that.site,_that.fullNameBn,_that.shortName,_that.shortNameBn,_that.initials,_that.avatarColor,_that.bloodGroup,_that.joinDate);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String empCode,  String fullName,  Designation designation,  Grade grade,  OrgRef department,  OrgRef site,  String? fullNameBn,  String? shortName,  String? shortNameBn,  String? initials,  String? avatarColor,  String? bloodGroup,  String? joinDate)?  $default,) {final _that = this;
switch (_that) {
case _EmployeeProfile() when $default != null:
return $default(_that.id,_that.empCode,_that.fullName,_that.designation,_that.grade,_that.department,_that.site,_that.fullNameBn,_that.shortName,_that.shortNameBn,_that.initials,_that.avatarColor,_that.bloodGroup,_that.joinDate);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _EmployeeProfile implements EmployeeProfile {
  const _EmployeeProfile({required this.id, required this.empCode, required this.fullName, required this.designation, required this.grade, required this.department, required this.site, this.fullNameBn, this.shortName, this.shortNameBn, this.initials, this.avatarColor, this.bloodGroup, this.joinDate});
  factory _EmployeeProfile.fromJson(Map<String, dynamic> json) => _$EmployeeProfileFromJson(json);

@override final  String id;
@override final  String empCode;
@override final  String fullName;
@override final  Designation designation;
@override final  Grade grade;
@override final  OrgRef department;
@override final  OrgRef site;
@override final  String? fullNameBn;
@override final  String? shortName;
@override final  String? shortNameBn;
@override final  String? initials;
@override final  String? avatarColor;
@override final  String? bloodGroup;
@override final  String? joinDate;

/// Create a copy of EmployeeProfile
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$EmployeeProfileCopyWith<_EmployeeProfile> get copyWith => __$EmployeeProfileCopyWithImpl<_EmployeeProfile>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$EmployeeProfileToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _EmployeeProfile&&(identical(other.id, id) || other.id == id)&&(identical(other.empCode, empCode) || other.empCode == empCode)&&(identical(other.fullName, fullName) || other.fullName == fullName)&&(identical(other.designation, designation) || other.designation == designation)&&(identical(other.grade, grade) || other.grade == grade)&&(identical(other.department, department) || other.department == department)&&(identical(other.site, site) || other.site == site)&&(identical(other.fullNameBn, fullNameBn) || other.fullNameBn == fullNameBn)&&(identical(other.shortName, shortName) || other.shortName == shortName)&&(identical(other.shortNameBn, shortNameBn) || other.shortNameBn == shortNameBn)&&(identical(other.initials, initials) || other.initials == initials)&&(identical(other.avatarColor, avatarColor) || other.avatarColor == avatarColor)&&(identical(other.bloodGroup, bloodGroup) || other.bloodGroup == bloodGroup)&&(identical(other.joinDate, joinDate) || other.joinDate == joinDate));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,empCode,fullName,designation,grade,department,site,fullNameBn,shortName,shortNameBn,initials,avatarColor,bloodGroup,joinDate);
}

@override
String toString() {
    return 'EmployeeProfile(id: $id, empCode: $empCode, fullName: $fullName, designation: $designation, grade: $grade, department: $department, site: $site, fullNameBn: $fullNameBn, shortName: $shortName, shortNameBn: $shortNameBn, initials: $initials, avatarColor: $avatarColor, bloodGroup: $bloodGroup, joinDate: $joinDate)';
}


}

/// @nodoc
abstract mixin class _$EmployeeProfileCopyWith<$Res> implements $EmployeeProfileCopyWith<$Res> {
  factory _$EmployeeProfileCopyWith(_EmployeeProfile value, $Res Function(_EmployeeProfile) _then) = __$EmployeeProfileCopyWithImpl;
@override @useResult
$Res call({
 String id, String empCode, String fullName, Designation designation, Grade grade, OrgRef department, OrgRef site, String? fullNameBn, String? shortName, String? shortNameBn, String? initials, String? avatarColor, String? bloodGroup, String? joinDate
});


@override $DesignationCopyWith<$Res> get designation;@override $GradeCopyWith<$Res> get grade;@override $OrgRefCopyWith<$Res> get department;@override $OrgRefCopyWith<$Res> get site;

}
/// @nodoc
class __$EmployeeProfileCopyWithImpl<$Res>
    implements _$EmployeeProfileCopyWith<$Res> {
  __$EmployeeProfileCopyWithImpl(this._self, this._then);

  final _EmployeeProfile _self;
  final $Res Function(_EmployeeProfile) _then;

/// Create a copy of EmployeeProfile
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? empCode = null,Object? fullName = null,Object? designation = null,Object? grade = null,Object? department = null,Object? site = null,Object? fullNameBn = freezed,Object? shortName = freezed,Object? shortNameBn = freezed,Object? initials = freezed,Object? avatarColor = freezed,Object? bloodGroup = freezed,Object? joinDate = freezed,}) {
  return _then(_EmployeeProfile(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,empCode: null == empCode ? _self.empCode : empCode // ignore: cast_nullable_to_non_nullable
as String,fullName: null == fullName ? _self.fullName : fullName // ignore: cast_nullable_to_non_nullable
as String,designation: null == designation ? _self.designation : designation // ignore: cast_nullable_to_non_nullable
as Designation,grade: null == grade ? _self.grade : grade // ignore: cast_nullable_to_non_nullable
as Grade,department: null == department ? _self.department : department // ignore: cast_nullable_to_non_nullable
as OrgRef,site: null == site ? _self.site : site // ignore: cast_nullable_to_non_nullable
as OrgRef,fullNameBn: freezed == fullNameBn ? _self.fullNameBn : fullNameBn // ignore: cast_nullable_to_non_nullable
as String?,shortName: freezed == shortName ? _self.shortName : shortName // ignore: cast_nullable_to_non_nullable
as String?,shortNameBn: freezed == shortNameBn ? _self.shortNameBn : shortNameBn // ignore: cast_nullable_to_non_nullable
as String?,initials: freezed == initials ? _self.initials : initials // ignore: cast_nullable_to_non_nullable
as String?,avatarColor: freezed == avatarColor ? _self.avatarColor : avatarColor // ignore: cast_nullable_to_non_nullable
as String?,bloodGroup: freezed == bloodGroup ? _self.bloodGroup : bloodGroup // ignore: cast_nullable_to_non_nullable
as String?,joinDate: freezed == joinDate ? _self.joinDate : joinDate // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

/// Create a copy of EmployeeProfile
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$DesignationCopyWith<$Res> get designation {
  
  return $DesignationCopyWith<$Res>(_self.designation, (value) {
    return _then(_self.copyWith(designation: value));
  });
}/// Create a copy of EmployeeProfile
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$GradeCopyWith<$Res> get grade {
  
  return $GradeCopyWith<$Res>(_self.grade, (value) {
    return _then(_self.copyWith(grade: value));
  });
}/// Create a copy of EmployeeProfile
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OrgRefCopyWith<$Res> get department {
  
  return $OrgRefCopyWith<$Res>(_self.department, (value) {
    return _then(_self.copyWith(department: value));
  });
}/// Create a copy of EmployeeProfile
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$OrgRefCopyWith<$Res> get site {
  
  return $OrgRefCopyWith<$Res>(_self.site, (value) {
    return _then(_self.copyWith(site: value));
  });
}
}


/// @nodoc
mixin _$Profile {

 String get id; String get email; String get phone; String get preferredLang; List<RoleInfo> get roles; EmployeeProfile get employee;
/// Create a copy of Profile
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProfileCopyWith<Profile> get copyWith => _$ProfileCopyWithImpl<Profile>(this as Profile, _$identity);

  /// Serializes this Profile to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  final _this = this as Profile;
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Profile&&(identical(other.id, _this.id) || other.id == _this.id)&&(identical(other.email, _this.email) || other.email == _this.email)&&(identical(other.phone, _this.phone) || other.phone == _this.phone)&&(identical(other.preferredLang, _this.preferredLang) || other.preferredLang == _this.preferredLang)&&const DeepCollectionEquality().equals(other.roles, _this.roles)&&(identical(other.employee, _this.employee) || other.employee == _this.employee));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
  final _this = this as Profile;
  return Object.hash(runtimeType,_this.id,_this.email,_this.phone,_this.preferredLang,const DeepCollectionEquality().hash(_this.roles),_this.employee);
}

@override
String toString() {
  final _this = this as Profile;
  return 'Profile(id: ${_this.id}, email: ${_this.email}, phone: ${_this.phone}, preferredLang: ${_this.preferredLang}, roles: ${_this.roles}, employee: ${_this.employee})';
}


}

/// @nodoc
abstract mixin class $ProfileCopyWith<$Res>  {
  factory $ProfileCopyWith(Profile value, $Res Function(Profile) _then) = _$ProfileCopyWithImpl;
@useResult
$Res call({
 String id, String email, String phone, String preferredLang, List<RoleInfo> roles, EmployeeProfile employee
});


$EmployeeProfileCopyWith<$Res> get employee;

}
/// @nodoc
class _$ProfileCopyWithImpl<$Res>
    implements $ProfileCopyWith<$Res> {
  _$ProfileCopyWithImpl(this._self, this._then);

  final Profile _self;
  final $Res Function(Profile) _then;

/// Create a copy of Profile
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? email = null,Object? phone = null,Object? preferredLang = null,Object? roles = null,Object? employee = null,}) {
  return _then(Profile(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,email: null == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String,phone: null == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String,preferredLang: null == preferredLang ? _self.preferredLang : preferredLang // ignore: cast_nullable_to_non_nullable
as String,roles: null == roles ? _self.roles : roles // ignore: cast_nullable_to_non_nullable
as List<RoleInfo>,employee: null == employee ? _self.employee : employee // ignore: cast_nullable_to_non_nullable
as EmployeeProfile,
  ));
}
/// Create a copy of Profile
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$EmployeeProfileCopyWith<$Res> get employee {
  
  return $EmployeeProfileCopyWith<$Res>(_self.employee, (value) {
    return _then(_self.copyWith(employee: value));
  });
}
}


/// Adds pattern-matching-related methods to [Profile].
extension ProfilePatterns on Profile {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Profile value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Profile() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Profile value)  $default,){
final _that = this;
switch (_that) {
case _Profile():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Profile value)?  $default,){
final _that = this;
switch (_that) {
case _Profile() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String id,  String email,  String phone,  String preferredLang,  List<RoleInfo> roles,  EmployeeProfile employee)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Profile() when $default != null:
return $default(_that.id,_that.email,_that.phone,_that.preferredLang,_that.roles,_that.employee);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String id,  String email,  String phone,  String preferredLang,  List<RoleInfo> roles,  EmployeeProfile employee)  $default,) {final _that = this;
switch (_that) {
case _Profile():
return $default(_that.id,_that.email,_that.phone,_that.preferredLang,_that.roles,_that.employee);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String id,  String email,  String phone,  String preferredLang,  List<RoleInfo> roles,  EmployeeProfile employee)?  $default,) {final _that = this;
switch (_that) {
case _Profile() when $default != null:
return $default(_that.id,_that.email,_that.phone,_that.preferredLang,_that.roles,_that.employee);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Profile implements Profile {
  const _Profile({required this.id, required this.email, required this.phone, required this.preferredLang, required  List<RoleInfo> roles, required this.employee}): _roles = roles;
  factory _Profile.fromJson(Map<String, dynamic> json) => _$ProfileFromJson(json);

@override final  String id;
@override final  String email;
@override final  String phone;
@override final  String preferredLang;
 final  List<RoleInfo> _roles;
@override List<RoleInfo> get roles {
  if (_roles is EqualUnmodifiableListView) return _roles;
  // ignore: implicit_dynamic_type
  return EqualUnmodifiableListView(_roles);
}

@override final  EmployeeProfile employee;

/// Create a copy of Profile
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProfileCopyWith<_Profile> get copyWith => __$ProfileCopyWithImpl<_Profile>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ProfileToJson(this, );
}

@override
bool operator ==(Object other) {
    return identical(this, other) || (other.runtimeType == runtimeType&&other is _Profile&&(identical(other.id, id) || other.id == id)&&(identical(other.email, email) || other.email == email)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.preferredLang, preferredLang) || other.preferredLang == preferredLang)&&const DeepCollectionEquality().equals(other.roles, _roles)&&(identical(other.employee, employee) || other.employee == employee));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode {
    return Object.hash(runtimeType,id,email,phone,preferredLang,const DeepCollectionEquality().hash(_roles),employee);
}

@override
String toString() {
    return 'Profile(id: $id, email: $email, phone: $phone, preferredLang: $preferredLang, roles: $roles, employee: $employee)';
}


}

/// @nodoc
abstract mixin class _$ProfileCopyWith<$Res> implements $ProfileCopyWith<$Res> {
  factory _$ProfileCopyWith(_Profile value, $Res Function(_Profile) _then) = __$ProfileCopyWithImpl;
@override @useResult
$Res call({
 String id, String email, String phone, String preferredLang, List<RoleInfo> roles, EmployeeProfile employee
});


@override $EmployeeProfileCopyWith<$Res> get employee;

}
/// @nodoc
class __$ProfileCopyWithImpl<$Res>
    implements _$ProfileCopyWith<$Res> {
  __$ProfileCopyWithImpl(this._self, this._then);

  final _Profile _self;
  final $Res Function(_Profile) _then;

/// Create a copy of Profile
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? email = null,Object? phone = null,Object? preferredLang = null,Object? roles = null,Object? employee = null,}) {
  return _then(_Profile(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,email: null == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String,phone: null == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String,preferredLang: null == preferredLang ? _self.preferredLang : preferredLang // ignore: cast_nullable_to_non_nullable
as String,roles: null == roles ? _self._roles : roles // ignore: cast_nullable_to_non_nullable
as List<RoleInfo>,employee: null == employee ? _self.employee : employee // ignore: cast_nullable_to_non_nullable
as EmployeeProfile,
  ));
}

/// Create a copy of Profile
/// with the given fields replaced by the non-null parameter values.
@override
@pragma('vm:prefer-inline')
$EmployeeProfileCopyWith<$Res> get employee {
  
  return $EmployeeProfileCopyWith<$Res>(_self.employee, (value) {
    return _then(_self.copyWith(employee: value));
  });
}
}

// dart format on
